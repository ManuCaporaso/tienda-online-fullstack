import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/jwt-payload.interface';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';

@Controller('products/:productId/questions')
export class ProductQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findByProduct(@Param('productId') productId: string) {
    return this.questionsService.findByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(productId, user.id, dto);
  }
}

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class QuestionsAdminController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(@Query('answered') answered?: string) {
    return this.questionsService.findAll(answered);
  }

  @Patch(':id/answer')
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnswerQuestionDto,
  ) {
    return this.questionsService.answer(id, dto);
  }
}
