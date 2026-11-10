import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Estados en los que el pago ya fue acreditado y el cliente puede reseñar:
// desde la aprobación del pago hasta la entrega inclusive.
const REVIEWABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.APPROVED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForProduct(productId: string, user?: AuthUser | null) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((review) => review.rating === stars).length,
    }));

    const serialize = (review: (typeof reviews)[number]) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userId: review.userId,
      userName: review.user.email.split('@')[0],
    });

    const myReview = user
      ? reviews.find((review) => review.userId === user.id)
      : undefined;

    let canReview = false;
    if (user && !myReview) {
      // Los administradores pueden reseñar sin compra previa (útil para
      // cargar reseñas iniciales desde el panel).
      if (user.role === Role.ADMIN) {
        canReview = true;
      } else {
        const purchased = await this.prisma.orderItem.findFirst({
          where: {
            productId,
            order: {
              userId: user.id,
              status: { in: REVIEWABLE_ORDER_STATUSES },
            },
          },
          select: { id: true },
        });
        canReview = Boolean(purchased);
      }
    }

    return {
      average,
      total,
      distribution,
      canReview,
      myReview: myReview ? serialize(myReview) : null,
      reviews: reviews.map(serialize),
    };
  }

  async create(productId: string, user: AuthUser, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Los administradores pueden publicar reseñas sin historial de compra.
    if (user.role !== Role.ADMIN) {
      const purchased = await this.prisma.orderItem.findFirst({
        where: {
          productId,
          order: {
            userId: user.id,
            status: { in: REVIEWABLE_ORDER_STATUSES },
          },
        },
        select: { id: true },
      });
      if (!purchased) {
        throw new ForbiddenException(
          'Solo podés reseñar productos que hayas comprado y recibido',
        );
      }
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId: user.id } },
    });
    if (existing) {
      throw new ConflictException('Ya dejaste una reseña para este producto');
    }

    return this.prisma.productReview.create({
      data: {
        productId,
        userId: user.id,
        rating: dto.rating,
        comment: dto.comment.trim(),
      },
    });
  }
}
