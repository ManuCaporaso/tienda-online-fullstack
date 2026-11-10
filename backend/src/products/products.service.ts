import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.categoryId !== undefined) {
      where.categoryId = query.categoryId;
    }
    if (query.search) {
      where.name = { contains: query.search };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { gte: query.minPrice, lte: query.maxPrice };
    }
    if (query.highlighted !== undefined) {
      where.highlighted = query.highlighted;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
      },
      orderBy: { price: query.sort ?? 'asc' },
    });

    if (products.length === 0) return [];

    const now = new Date();
    const productIds = products.map((product) => product.id);
    const [reservations, variantReservations] = await Promise.all([
      this.prisma.cartReservation.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
          expiresAt: { gt: now },
        },
        _sum: { quantity: true },
      }),
      this.prisma.cartReservation.groupBy({
        by: ['variantId'],
        where: {
          productId: { in: productIds },
          variantId: { not: null },
          expiresAt: { gt: now },
        },
        _sum: { quantity: true },
      }),
    ]);
    const reservedByProduct = new Map(
      reservations.map((entry) => [entry.productId, entry._sum.quantity ?? 0]),
    );
    const reservedByVariant = new Map(
      variantReservations.map((entry) => [
        entry.variantId!,
        entry._sum.quantity ?? 0,
      ]),
    );

    return products.map((product) => ({
      ...product,
      availableStock: Math.max(
        0,
        product.stock - (reservedByProduct.get(product.id) ?? 0),
      ),
      variants: product.variants.map((variant) => ({
        ...variant,
        availableStock: Math.max(
          0,
          variant.stock - (reservedByVariant.get(variant.id) ?? 0),
        ),
      })),
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const now = new Date();
    const [productReserved, variantReserved] = await Promise.all([
      this.prisma.cartReservation.aggregate({
        where: { productId: id, expiresAt: { gt: now } },
        _sum: { quantity: true },
      }),
      this.prisma.cartReservation.groupBy({
        by: ['variantId'],
        where: {
          productId: id,
          variantId: { not: null },
          expiresAt: { gt: now },
        },
        _sum: { quantity: true },
      }),
    ]);
    const reservedByVariant = new Map(
      variantReserved.map((entry) => [
        entry.variantId!,
        entry._sum.quantity ?? 0,
      ]),
    );

    return {
      ...product,
      availableStock: Math.max(
        0,
        product.stock - (productReserved._sum.quantity ?? 0),
      ),
      variants: product.variants.map((variant) => ({
        ...variant,
        availableStock: Math.max(
          0,
          variant.stock - (reservedByVariant.get(variant.id) ?? 0),
        ),
      })),
    };
  }

  async create(dto: CreateProductDto, uploadedImages: string[] = []) {
    await this.ensureCategory(dto.categoryId);

    if (dto.highlighted) {
      await this.ensureHighlightLimit();
    }

    const variants = dto.variants ?? [];
    const totalStock =
      variants.length > 0
        ? variants.reduce((sum, variant) => sum + variant.stock, 0)
        : (dto.stock ?? 0);

    // La primera imagen subida es la principal; el resto va a la galería.
    const mainImage = uploadedImages[0] ?? dto.imageUrl;
    const gallery = uploadedImages.slice(1);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price,
        stock: totalStock,
        imageUrl: mainImage,
        highlighted: dto.highlighted ?? false,
        categoryId: dto.categoryId,
      },
    });

    if (gallery.length > 0) {
      await this.prisma.productImage.createMany({
        data: gallery.map((url) => ({ url, productId: product.id })),
      });
    }

    if (variants.length > 0) {
      await this.prisma.productVariant.createMany({
        data: variants.map((variant) => ({
          name: variant.name,
          value: variant.value,
          stock: variant.stock,
          price: variant.price,
          productId: product.id,
        })),
      });
    }

    return this.findOne(product.id);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    uploadedImages: string[] = [],
  ) {
    const product = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      await this.ensureCategory(dto.categoryId);
    }

    if (dto.highlighted === true && !product.highlighted) {
      await this.ensureHighlightLimit();
    }

    const variants = dto.variants;
    const totalStock =
      variants !== undefined
        ? variants.length > 0
          ? variants.reduce((sum, variant) => sum + variant.stock, 0)
          : (dto.stock ?? 0)
        : dto.stock;

    const hasNewImages = uploadedImages.length > 0;
    const managingImages = hasNewImages || dto.existingImages !== undefined;

    let mainImage: string | null | undefined;
    let gallery: string[] | undefined;

    if (managingImages) {
      const existing = dto.existingImages ?? [];

      if (dto.mainImage) {
        // La imagen principal es una de las existentes.
        mainImage = dto.mainImage;
      } else if (hasNewImages) {
        // La primera imagen nueva pasa a ser la principal.
        mainImage = uploadedImages[0];
      } else if (existing.length > 0) {
        mainImage = existing[0];
      } else {
        mainImage = null;
      }

      const existingGallery = existing.filter((url) => url !== mainImage);
      const uploadedGallery =
        hasNewImages && mainImage !== uploadedImages[0]
          ? uploadedImages
          : uploadedImages.slice(1);

      gallery = [...existingGallery, ...uploadedGallery];
    } else {
      mainImage = dto.imageUrl ?? product.imageUrl;
    }

    await this.prisma.$transaction(async (tx) => {
      if (variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((variant) => ({
              name: variant.name,
              value: variant.value,
              stock: variant.stock,
              price: variant.price,
              productId: id,
            })),
          });
        }
      }

      if (gallery !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (gallery.length > 0) {
          await tx.productImage.createMany({
            data: gallery.map((url) => ({ url, productId: id })),
          });
        }
      }

      await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: totalStock,
          imageUrl: mainImage,
          highlighted: dto.highlighted,
          categoryId: dto.categoryId,
        },
      });
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);

    const used = await this.prisma.orderItem.count({
      where: { productId: id },
    });
    if (used > 0) {
      throw new ConflictException(
        'No se puede eliminar un producto con pedidos asociados',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Producto eliminado correctamente' };
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('La categoría no existe');
    }
  }

  private async ensureHighlightLimit() {
    const highlighted = await this.prisma.product.count({
      where: { highlighted: true },
    });
    if (highlighted >= 3) {
      throw new ConflictException(
        'Solo se pueden destacar hasta 3 productos. Quitá uno primero.',
      );
    }
  }
}
