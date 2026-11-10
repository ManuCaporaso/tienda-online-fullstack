import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeliveryType } from '@prisma/client';

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  variantLabel?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsEnum(DeliveryType, {
    message: 'deliveryType debe ser HOME_DELIVERY o PICKUP',
  })
  deliveryType: DeliveryType;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un producto' })
  items: OrderItemDto[];
}
