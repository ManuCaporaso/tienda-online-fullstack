import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { toBoolean } from '../../common/transformers/to-boolean';
import { ProductVariantInputDto } from './product-variant-input.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio debe ser numérico' })
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  highlighted?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? plainToInstance(ProductVariantInputDto, parsed)
          : parsed;
      } catch {
        return value;
      }
    }
    if (Array.isArray(value)) {
      return plainToInstance(ProductVariantInputDto, value);
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  variants?: ProductVariantInputDto[];

  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId: string;
}
