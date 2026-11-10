import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Role } from '@prisma/client';
import { createHmac } from 'crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

// ⚠️ TEMPORAL: precio simbólico de ARS 1 para validar un pago real de punta a
// punta. Revertir a `item.price` cuando termine la prueba.
const TEST_UNIT_PRICE_ARS = 1;

// Estados que ya no admiten un nuevo intento de pago.
const PAID_OR_FULFILLED_STATUSES: OrderStatus[] = [
  OrderStatus.APPROVED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private getClient(): MercadoPagoConfig {
    const accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN');

    const isPlaceholder =
      !accessToken ||
      accessToken === 'tu_access_token' ||
      /^TEST-0{10,}/.test(accessToken) ||
      /^APP_USR-0{10,}/.test(accessToken);

    if (isPlaceholder) {
      throw new BadRequestException(
        'Configurá un MERCADOPAGO_ACCESS_TOKEN real en backend/.env (TEST- para sandbox o APP_USR- para producción) para generar preferencias de pago.',
      );
    }

    return new MercadoPagoConfig({ accessToken });
  }

  async createPreference(orderId: number, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, user: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new UnauthorizedException('No podés pagar este pedido');
    }
    if (PAID_OR_FULFILLED_STATUSES.includes(order.status)) {
      throw new BadRequestException('El pedido ya fue pagado');
    }

    const appUrl =
      this.config.get<string>('NEXT_PUBLIC_APP_URL') ?? 'http://localhost:3000';
    const backendUrl =
      this.config.get<string>('BACKEND_PUBLIC_URL') ?? 'http://localhost:3030';

    const preference = new Preference(this.getClient());

    // Mercado Pago exige una URL pública HTTPS para `auto_return`. En
    // desarrollo (localhost o IP de LAN) la preferencia se crea igual, pero
    // sin redirección automática: el usuario vuelve con los back_urls.
    const isLocalAppUrl =
      /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(appUrl);
    const canAutoReturn = /^https:\/\//i.test(appUrl) && !isLocalAppUrl;

    let result;
    try {
      result = await preference.create({
        body: {
          items: order.items.map((item) => ({
            id: `${item.productId}-${item.id}`,
            title: item.variantLabel
              ? `${item.product.name} (${item.variantLabel})`
              : item.product.name,
            description: item.product.description ?? undefined,
            quantity: item.quantity,
            unit_price: TEST_UNIT_PRICE_ARS,
            currency_id: 'ARS',
          })),
          payer: { email: order.user.email },
          back_urls: {
            success: `${appUrl}/checkout/success`,
            failure: `${appUrl}/checkout/failure`,
            pending: `${appUrl}/checkout/pending`,
          },
          ...(canAutoReturn ? { auto_return: 'approved' as const } : {}),
          external_reference: String(order.id),
          notification_url: `${backendUrl}/api/payments/webhook`,
        },
      });
    } catch (error) {
      this.logger.error('Error creando preferencia de Mercado Pago', error as Error);
      throw new BadGatewayException(
        'No se pudo generar la preferencia de Mercado Pago. Verificá el access token.',
      );
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: result.id },
    });

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    };
  }

  async handleWebhook(body: any, query: any, headers: any) {
    const type = body?.type ?? query?.type ?? query?.topic;
    const paymentId = body?.data?.id ?? query?.['data.id'] ?? query?.id;

    if (type !== 'payment' || !paymentId) {
      return { received: true, ignored: true };
    }

    this.validateSignature(String(paymentId), headers);

    const paymentApi = new Payment(this.getClient());
    const payment = await paymentApi.get({ id: String(paymentId) });

    const orderId = Number(payment.external_reference);
    if (!orderId) {
      this.logger.warn(`Pago ${paymentId} sin external_reference`);
      return { received: true };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      this.logger.warn(`Pedido ${orderId} no encontrado`);
      return { received: true };
    }

    const status = this.mapStatus(payment.status);
    if (order.status === status) {
      return { received: true, status };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          mpPaymentId: String(paymentId),
          paymentMethod:
            payment.payment_method_id ?? payment.payment_type_id ?? null,
        },
      });

      // Si el pago se rechaza/cancela, devolvemos el stock reservado.
      if (
        status === OrderStatus.CANCELLED &&
        order.status !== OrderStatus.CANCELLED
      ) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    this.logger.log(`Pedido ${orderId} actualizado a ${status}`);
    return { received: true, status };
  }

  private mapStatus(status?: string): OrderStatus {
    switch (status) {
      case 'approved':
        return OrderStatus.APPROVED;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
        return OrderStatus.CANCELLED;
      default:
        return OrderStatus.PENDING;
    }
  }

  private validateSignature(paymentId: string, headers: any) {
    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret || secret === 'tu_webhook_secret_o_signature') {
      return;
    }

    const xSignature = headers['x-signature'] as string | undefined;
    const xRequestId = (headers['x-request-id'] as string | undefined) ?? '';
    if (!xSignature) {
      return;
    }

    const parts = Object.fromEntries(
      xSignature
        .split(',')
        .map((part) => part.trim().split('=') as [string, string]),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) {
      return;
    }

    const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
    const hmac = createHmac('sha256', secret).update(manifest).digest('hex');

    if (hmac !== v1) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }
  }
}
