import { Module } from '@nestjs/common';
import { TaskAssignmentsController } from './taskAssignments.controller';
import { TaskAssignmentService } from './taskAssignments.service';
import { TaskAssignmentRepository } from './taskAsssignments.repository';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    DatabaseModule, 
  ],
  controllers: [TaskAssignmentsController],
  providers: [
    TaskAssignmentService,
    TaskAssignmentRepository,
  ],
  exports: [TaskAssignmentService], 
})
export class TaskAssignmentModule {}

