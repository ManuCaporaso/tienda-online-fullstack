import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  findBySession(@Query('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId es obligatorio');
    }
    return this.reservationsService.findActiveBySession(sessionId);
  }

  @Delete(':id')
  release(@Param('id') id: string, @Query('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId es obligatorio');
    }
    return this.reservationsService.release(id, sessionId);
  }

  @Delete()
  releaseBySession(@Query('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId es obligatorio');
    }
    return this.reservationsService.releaseBySession(sessionId);
  }
}
