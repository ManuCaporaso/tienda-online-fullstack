import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const imageStorage = diskStorage({
  destination: join(process.cwd(), 'assets', 'images'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

interface ProductUploads {
  image?: Express.Multer.File[];
  images?: Express.Multer.File[];
}

/**
 * Acepta tanto el campo legacy `image` (1 archivo) como `images` (hasta 10).
 * El orden recibido define la imagen principal (la primera).
 */
const imageUploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'images', maxCount: 10 },
    { name: 'image', maxCount: 1 },
  ],
  { storage: imageStorage },
);

function collectFilenames(files?: ProductUploads): string[] {
  return [
    ...(files?.images ?? []).map((file) => file.filename),
    ...(files?.image ?? []).map((file) => file.filename),
  ];
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(imageUploadInterceptor)
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: ProductUploads,
  ) {
    return this.productsService.create(dto, collectFilenames(files));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(imageUploadInterceptor)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: ProductUploads,
  ) {
    return this.productsService.update(id, dto, collectFilenames(files));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
