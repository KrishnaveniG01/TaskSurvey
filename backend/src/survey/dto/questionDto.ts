import {
    IsArray,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OptionDto {
    @IsString()
    optionText: string;
}

export class QuestionDto {
    @IsString()
    questionText: string;

    @IsString()
    answerType: string; 
    
    isRequired:boolean;// e.g., 'multiple choice', 'text', 'rating', etc.

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OptionDto)
    options?: OptionDto[]; // only for multiple choice type
}

export class SurveyQuestionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuestionDto)
    questions: QuestionDto[];
}
