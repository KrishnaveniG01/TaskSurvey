import { PartialType } from '@nestjs/swagger';
import { CreateTaskCommentDto } from './create-taskComment.dto';


export class UpdateTaskDto extends PartialType(CreateTaskCommentDto) {}