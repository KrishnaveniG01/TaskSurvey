import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskAttachmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  attachmentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileURL: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recStatus: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dataStatus: string;

  @ApiProperty()
  @IsString()
  createdBy: string;

  @ApiProperty()
  @IsString()
  modifiedBy: string;

  @ApiProperty()
  @IsBoolean()
  isAttachmentCreationDoc: boolean;
}
