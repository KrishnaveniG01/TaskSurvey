import { Injectable, NotFoundException } from '@nestjs/common';
import { RowDataPacket } from 'mysql2';
import { TaskCommentRepository } from './taskComments.repository';
import { CreateTaskCommentDto } from './dto/create-taskComment.dto';


@Injectable()
export class TaskCommentService {
  constructor(private readonly taskCommentRepository: TaskCommentRepository) {}

  async create(taskId: string, createCommentDto: CreateTaskCommentDto): Promise<void> {
    const data = {
      commentId: crypto.randomUUID(),
      recSeq: 1, 
      taskId,
      updateText: createCommentDto.updateText,
      recStatus: 'A',
      dataStatus: 'N',
      createdBy: createCommentDto.createdBy,
      createdOn: new Date(),
      modifiedBy: createCommentDto.createdBy,
      modifiedOn: new Date(),
    };
    await this.taskCommentRepository.create(data);
  }

  async findByTaskId(taskId: string): Promise<RowDataPacket[]> {
    return this.taskCommentRepository.findByTaskId(taskId);
  }

  async findOne(commentId: string, recSeq: number): Promise<RowDataPacket> {
    const comment = await this.taskCommentRepository.findById(commentId, recSeq);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} and RecSeq ${recSeq} not found`);
    }
    return comment;
  }

  async update(commentId: string, recSeq: number, updateData: { comment: string }): Promise<RowDataPacket> {
    await this.findOne(commentId, recSeq); 
    await this.taskCommentRepository.update(commentId, recSeq, updateData);
    return this.findOne(commentId, recSeq);
  }

  async remove(commentId: string, recSeq: number): Promise<void> {
    await this.findOne(commentId, recSeq); 
    await this.taskCommentRepository.delete(commentId, recSeq);
  }
}
