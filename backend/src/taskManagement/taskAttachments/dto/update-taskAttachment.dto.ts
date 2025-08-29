import { PartialType } from '@nestjs/swagger';
import { CreateTaskAttachmentDto } from './create-taskattachment.dto';



export class UpdateTaskDto extends PartialType(CreateTaskAttachmentDto) {}