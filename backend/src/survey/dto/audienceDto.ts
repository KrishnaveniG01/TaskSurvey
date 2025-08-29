import { IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SurveyAudienceDto {
  @IsArray()
  @IsUUID('4', { each: true })
  audience: string[]; // e.g., ['uuid1', 'uuid2', ...]
}
