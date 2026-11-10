import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

const RESERVATION_TTL_MS = 10 * 60 * 1000; // 10 minutos

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReservationDto) {
    await this.cleanupExpired();

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    let variant = null;
    if (dto.variantId) {
      variant = product.variants.find((item) => item.id === dto.variantId) ?? null;
      if (!variant) {
        throw new BadRequestException('Variante no encontrada');
      }
    }

    const now = new Date();

    const productReserved = await this.prisma.cartReservation.aggregate({
      where: { productId: dto.productId, expiresAt: { gt: now } },
      _sum: { quantity: true },
    });
    const availableProduct =
      product.stock - (productReserved._sum.quantity ?? 0);
    if (availableProduct < dto.quantity) {
      throw new BadRequestException('Stock insuficiente para este producto');
    }

    if (variant) {
      const variantReserved = await this.prisma.cartReservation.aggregate({
        where: { variantId: variant.id, expiresAt: { gt: now } },
        _sum: { quantity: true },
      });
      const availableVariant =
        variant.stock - (variantReserved._sum.quantity ?? 0);
      if (availableVariant < dto.quantity) {
        throw new BadRequestException('Stock insuficiente para esta variante');
      }
    }

    return this.prisma.cartReservation.create({
      data: {
        sessionId: dto.sessionId,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        expiresAt: new Date(now.getTime() + RESERVATION_TTL_MS),
      },
    });
  }

  findActiveBySession(sessionId: string) {
    return this.prisma.cartReservation.findMany({
      where: { sessionId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async release(id: string, sessionId: string) {
    const result = await this.prisma.cartReservation.deleteMany({
      where: { id, sessionId },
    });
    return { released: result.count };
  }

  async releaseBySession(sessionId: string) {
    const result = await this.prisma.cartReservation.deleteMany({
      where: { sessionId },
    });
    return { released: result.count };
  }

  async cleanupExpired() {
    const result = await this.prisma.cartReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return { cleaned: result.count };
  }
}
