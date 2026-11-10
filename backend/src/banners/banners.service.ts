import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  findAll() {
    return this.prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
  }

  create(dto: CreateBannerDto, imageUrl?: string) {
    const finalImage = imageUrl ?? dto.imageUrl;
    if (!finalImage) {
      throw new BadRequestException('La imagen del banner es obligatoria');
    }

    return this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl: finalImage,
        linkUrl: dto.linkUrl,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBannerDto, imageUrl?: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }

    return this.prisma.banner.update({
      where: { id },
      data: {
        title: dto.title,
        imageUrl: imageUrl ?? dto.imageUrl ?? banner.imageUrl,
        linkUrl: dto.linkUrl,
        order: dto.order,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }

    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner eliminado correctamente' };
  }
}
