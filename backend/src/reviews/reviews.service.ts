import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForProduct(productId: string, userId?: number | null) {
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

    const myReview = userId
      ? reviews.find((review) => review.userId === userId)
      : undefined;

    let canReview = false;
    if (userId && !myReview) {
      const purchased = await this.prisma.orderItem.findFirst({
        where: {
          productId,
          order: { userId, status: OrderStatus.APPROVED },
        },
        select: { id: true },
      });
      canReview = Boolean(purchased);
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

  async create(productId: string, userId: number, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: OrderStatus.APPROVED },
      },
      select: { id: true },
    });
    if (!purchased) {
      throw new ForbiddenException(
        'Solo podés reseñar productos que compraste y cuyo pago fue aprobado.',
      );
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException('Ya dejaste una reseña para este producto');
    }

    return this.prisma.productReview.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        comment: dto.comment.trim(),
      },
    });
  }
}
