import { IsString, IsOptional, IsDateString, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskAssignmentDto {
 @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @ApiProperty()

  orgId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  plannedStartDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  plannedEndDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  actualStartDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  actualEndDate?: string;

  @ApiProperty()
  @IsString()
  dataStatus: string;

  @ApiProperty()
  @IsString()
  assignedBy: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  completedBy?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  completedOn?: string;

  @ApiProperty()
  @IsString()
  createdBy: string;

  @ApiProperty()
  @IsString()
  modifiedBy: string;
  

}
