import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

const PUBLIC_SELECT = {
  id: true,
  question: true,
  answer: true,
  answeredAt: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, email: true } },
} as const;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const questions = await this.prisma.productQuestion.findMany({
      where: { productId },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return questions.map(({ user, ...question }) => ({
      ...question,
      userName: user.email.split('@')[0],
    }));
  }

  async create(productId: string, userId: number, dto: CreateQuestionDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const question = await this.prisma.productQuestion.create({
      data: {
        productId,
        userId,
        question: dto.question.trim(),
      },
      select: PUBLIC_SELECT,
    });

    const { user, ...rest } = question;
    return { ...rest, userName: user.email.split('@')[0] };
  }

  findAll(answered?: string) {
    const where =
      answered === 'true'
        ? { answer: { not: null } }
        : answered === 'false'
          ? { answer: null }
          : {};

    return this.prisma.productQuestion.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answer(id: string, dto: AnswerQuestionDto) {
    const existing = await this.prisma.productQuestion.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    return this.prisma.productQuestion.update({
      where: { id },
      data: { answer: dto.answer.trim(), answeredAt: new Date() },
      include: {
        user: { select: { id: true, email: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });
  }
}
