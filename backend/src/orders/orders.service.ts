import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryType, OrderStatus, Prisma, Role } from '@prisma/client';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ORDER_DETAIL_INCLUDE = {
  items: { include: { product: true } },
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      documentNumber: true,
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Producto ${item.productId} no encontrado`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}"`,
        );
      }

      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant || variant.productId !== item.productId) {
          throw new BadRequestException('Variante inválida');
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para la variante de "${product.name}"`,
          );
        }
      }
    }

    const total = dto.items.reduce(
      (sum, item) =>
        sum +
        Number(productMap.get(item.productId)!.price) * item.quantity,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para producto ${item.productId}`,
          );
        }

        if (item.variantId) {
          const variantUpdated = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantUpdated.count === 0) {
            throw new BadRequestException(
              `Stock insuficiente para la variante de ${item.productId}`,
            );
          }
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          deliveryType: dto.deliveryType,
          shippingAddress: dto.shippingAddress
            ? (dto.shippingAddress as unknown as Prisma.InputJsonValue)
            : undefined,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Number(productMap.get(item.productId)!.price),
              variantId: item.variantId,
              variantLabel: item.variantLabel,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // A propósito NO liberamos las reservas del carrito acá. Si el cliente
      // abandona Mercado Pago y vuelve atrás, sus productos y la reserva de
      // 10 minutos deben seguir vigentes. La liberación ocurre recién en
      // `/checkout/success` (carrito confirmado) o al expirar la reserva.

      return order;
    });
  }

  findAll(user: AuthUser) {
    return this.prisma.order.findMany({
      where: user.role === Role.ADMIN ? {} : { userId: user.id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllAdmin(filters: {
    status?: OrderStatus;
    deliveryType?: DeliveryType;
  }) {
    return this.prisma.order.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.deliveryType
          ? { deliveryType: filters.deliveryType }
          : {}),
      },
      include: ORDER_DETAIL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.trackingNumber !== undefined && {
          trackingNumber: dto.trackingNumber.trim() || null,
        }),
      },
      include: ORDER_DETAIL_INCLUDE,
    });
  }

  async findOne(id: number, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('No podés acceder a este pedido');
    }

    return order;
  }
}
