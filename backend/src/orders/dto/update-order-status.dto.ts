import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message: 'status debe ser un estado de pedido válido',
  })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string;
}
