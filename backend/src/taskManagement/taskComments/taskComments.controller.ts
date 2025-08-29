import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { TaskCommentService } from './taskComment.service';
import { CreateTaskCommentDto } from './dto/create-taskComment.dto';


@Controller('tasks/:taskId/comments')
export class TaskCommentController {
  constructor(private readonly taskCommentService: TaskCommentService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateTaskCommentDto
  ) {
    return this.taskCommentService.create(taskId, createCommentDto);
  }

  @Get()
  findByTaskId(@Param('taskId') taskId: string) {
    return this.taskCommentService.findByTaskId(taskId);
  }

  @Patch(':commentId/:recSeq')
  update(
    @Param('commentId') commentId: string,
    @Param('recSeq', ParseIntPipe) recSeq: number,
    @Body() updateData: { comment: string }
  ) {
    return this.taskCommentService.update(commentId, recSeq, updateData);
  }

  @Delete(':commentId/:recSeq')
  remove(
    @Param('commentId') commentId: string,
    @Param('recSeq', ParseIntPipe) recSeq: number
  ) {
    return this.taskCommentService.remove(commentId, recSeq);
  }
}
