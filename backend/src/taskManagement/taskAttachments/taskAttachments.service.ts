import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TaskAttachmentRepository } from './taskattachments.repository';
import { TaskAttachment } from './taskAttachment.entity';

@Injectable()
export class TaskAttachmentService {
  constructor(private readonly taskAttachmentRepository: TaskAttachmentRepository) {}

  async create(data: Partial<TaskAttachment>): Promise<void> {
    const newAttachment = {
      ...data,
      attachmentId: uuidv4(),
      recSeq: 1,
      dataStatus: 'A',
      createdOn: new Date(),
      modifiedOn: new Date(),
    };
    await this.taskAttachmentRepository.bulkCreate([newAttachment]);
  }

  async findByTaskId(taskId: string): Promise<TaskAttachment[]> {
    return this.taskAttachmentRepository.findByTaskId(taskId) as Promise<TaskAttachment[]>;
  }

  async findOne(attachmentId: string, recSeq: number): Promise<TaskAttachment> {
    const result = await this.taskAttachmentRepository.findById(attachmentId, recSeq);
    if (!result) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} and recSeq ${recSeq} not found`);
    }
    return result as TaskAttachment;
  }

  async update(attachmentId: string, recSeq: number, updateData: Partial<TaskAttachment>): Promise<void> {
    await this.findOne(attachmentId, recSeq);
    await this.taskAttachmentRepository.update(attachmentId, recSeq, updateData);
  }

  async remove(attachmentId: string, recSeq: number): Promise<void> {
    await this.findOne(attachmentId, recSeq);
    await this.taskAttachmentRepository.delete(attachmentId, recSeq);
  }

  async list(): Promise<TaskAttachment[]> {
    return this.taskAttachmentRepository.list() as Promise<TaskAttachment[]>;
  }
}
