import { PartialType } from '@nestjs/swagger';
import { CreateTaskAssignmentDto } from './create-taskassignment.dto';


export class UpdateTaskDto extends PartialType(CreateTaskAssignmentDto) {}