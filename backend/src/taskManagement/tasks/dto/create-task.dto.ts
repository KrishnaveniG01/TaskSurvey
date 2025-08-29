import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @ApiPropertyOptional()
  taskId?: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  taskDescription: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  plannedStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  plannedStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  plannedEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  plannedEndTime?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  poolTask?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  groupTask?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isMandatory?: boolean;

  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isRequiresProof?: boolean;

  @ApiProperty()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isImportant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewerId?: string;
  
  // Map taskReviewer to reviewBy for compatibility
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taskReviewer?: string;

  @ApiProperty()
  @IsString()
  createdBy: string;

  @ApiProperty()
  @IsString()
  modifiedBy: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  isDraft?: boolean;

  @IsOptional()
  @IsString()
  assignedTo?: string; // This should be a JSON string

  // Frontend compatibility fields
  @ApiPropertyOptional()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  endTime?: string;

  @IsOptional()
  @IsArray()
  completedOn?: {
    userId: string;
    completedBy: string;
  }[];

  @IsOptional()
  @IsArray()
  attachments?: {
    fileUrl: string;
    createdBy: string;
  }[];

  @IsOptional()
  @IsArray()
  additionalDocuments?: any[];
}