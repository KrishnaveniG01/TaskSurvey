import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskCommentDto {
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
  recStatus: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dataStatus: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  updateText: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  modifiedBy: string;
}
