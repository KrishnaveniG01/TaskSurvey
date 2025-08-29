import { Module } from '@nestjs/common';
import { TaskCommentService } from './taskComment.service';
import { TaskCommentRepository } from './taskComments.repository';
import { TaskCommentController } from './taskComments.controller';
import { taskDB } from 'src/database/taskDB';


@Module({
  
  controllers: [TaskCommentController],
  providers: [TaskCommentService, TaskCommentRepository, taskDB],
  exports: [TaskCommentService],
})
export class TaskCommentModule {}