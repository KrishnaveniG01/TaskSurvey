import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskAttachmentService } from './taskAttachments.service';
import { AwsS3Service } from 'src/aws/aws.S3.service';

@Controller('taskAttachments')
export class TaskAttachmentController {
  constructor(
    private readonly taskAttachmentService: TaskAttachmentService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) 
  async upload(
    
    @UploadedFile() file: Express.Multer.File,
  ) {
   const { fileUrl, fileName } = await this.awsS3Service.uploadFile(file);

    return this.taskAttachmentService.create({
     
      fileUrl: fileUrl, 
      createdBy: 'admin',
      modifiedBy: 'admin',
      recStatus: 'A',
      dataStatus: 'A',
      recSeq: 1,
      isAttachmentCreationDoc: false,
    });
  }

  @Get()
  async findByTaskId(@Param('taskId') taskId: string) {
    return this.taskAttachmentService.findByTaskId(taskId);
  }

  @Get('all')
  async list() {
    return this.taskAttachmentService.list();
  }

  @Get(':attachmentId/:recSeq')
  async findOne(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Param('recSeq', ParseIntPipe) recSeq: number,
  ) {
    return this.taskAttachmentService.findOne(attachmentId, recSeq);
  }

  @Delete(':attachmentId/:recSeq')
  async remove(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Param('recSeq', ParseIntPipe) recSeq: number,
  ) {
    return this.taskAttachmentService.remove(attachmentId, recSeq);
  }
}
