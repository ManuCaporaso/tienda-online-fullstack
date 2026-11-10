import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isEmailVerified: true,
  phone: true,
  documentNumber: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isEmailVerified: true,
        phone: true,
        documentNumber: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number, requester: AuthUser) {
    if (requester.role !== Role.ADMIN && requester.id !== id) {
      throw new ForbiddenException('No podés acceder a este usuario');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    await this.getProfile(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone?.trim() || null,
        documentNumber: dto.documentNumber?.trim() || null,
      },
      select: PROFILE_SELECT,
    });
  }

  listAddresses(userId: number) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: number, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const isDefault = dto.isDefault ?? count === 0;

      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          street: dto.street.trim(),
          number: dto.number.trim(),
          apartment: dto.apartment?.trim() || null,
          city: dto.city.trim(),
          state: dto.state.trim(),
          zipCode: dto.zipCode.trim(),
          isDefault,
        },
      });
    });
  }

  async updateAddress(
    userId: number,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...(dto.street !== undefined && { street: dto.street.trim() }),
          ...(dto.number !== undefined && { number: dto.number.trim() }),
          ...(dto.apartment !== undefined && {
            apartment: dto.apartment.trim() || null,
          }),
          ...(dto.city !== undefined && { city: dto.city.trim() }),
          ...(dto.state !== undefined && { state: dto.state.trim() }),
          ...(dto.zipCode !== undefined && { zipCode: dto.zipCode.trim() }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  async deleteAddress(userId: number, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    await this.prisma.address.delete({ where: { id: addressId } });

    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Dirección eliminada' };
  }

  myReviews(userId: number) {
    return this.prisma.productReview.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
