import { Module } from '@nestjs/common';
import { TaskAttachmentController } from './taskAttachments.controller';
import { TaskAttachmentRepository } from './taskattachments.repository';
import { TaskAttachmentService } from './taskAttachments.service';
import { taskDB } from 'src/database/taskDB';
import { AwsS3Service } from 'src/aws/aws.S3.service';

 

@Module({
  
  controllers: [TaskAttachmentController],
  providers: [TaskAttachmentService, TaskAttachmentRepository, taskDB, AwsS3Service],
  exports: [TaskAttachmentService],
})
export class TaskAttachmentModule {}