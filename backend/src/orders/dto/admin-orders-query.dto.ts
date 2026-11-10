import { IsEnum, IsOptional } from 'class-validator';
import { DeliveryType, OrderStatus } from '@prisma/client';

export class AdminOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'status debe ser un estado de pedido válido',
  })
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(DeliveryType, {
    message: 'deliveryType debe ser SHIPPING o PICKUP',
  })
  deliveryType?: DeliveryType;
}
