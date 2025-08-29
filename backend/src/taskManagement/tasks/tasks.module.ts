import { Module } from '@nestjs/common';
import { TaskController } from './tasks.controller';
import { TaskService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { TaskAttachmentRepository } from '../taskAttachments/taskattachments.repository';
import { AwsS3Service } from 'src/aws/aws.S3.service';
import { TaskAssignmentModule } from '../taskAssignments/taskAssignments.module';
import { DatabaseModule } from 'src/database/database.module';
import { TaskAssignmentRepository } from '../taskAssignments/taskAsssignments.repository';
import { taskDB } from 'src/database/taskDB';
import { authDB } from 'src/database/authDB';
import { TaskHandoverRepository } from './taskHandoverRepository';

@Module({
  imports: [
    TaskAssignmentModule,
    DatabaseModule, // This module provides the database connections
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    TaskAttachmentRepository,
    TaskAssignmentRepository,
    AwsS3Service,
    taskDB,
    authDB,
    TaskHandoverRepository
  ],
  exports: [TaskService],
})
export class TaskModule {}
