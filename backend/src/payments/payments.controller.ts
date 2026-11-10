import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('preference')
  @UseGuards(JwtAuthGuard)
  createPreference(
    @Body() dto: CreatePreferenceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.createPreference(dto.orderId, user);
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(@Body() body: any, @Query() query: any, @Headers() headers: any) {
    return this.paymentsService.handleWebhook(body, query, headers);
  }
}
