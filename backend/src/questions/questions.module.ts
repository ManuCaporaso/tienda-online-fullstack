import { Module } from '@nestjs/common';
import {
  ProductQuestionsController,
  QuestionsAdminController,
} from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  controllers: [ProductQuestionsController, QuestionsAdminController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
