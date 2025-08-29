import {
    Req,
    Body,
    Controller,
    Post,
    Get,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { CreateSurveyDto } from './dto/createSurveyDto';
import { SurveyService } from './survey.service';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { SubmitSurveyDto } from './dto/surveyAnswerDto';
import { Request } from 'express';

@Controller('survey')
export class SurveyController {
    constructor(private readonly surveyService: SurveyService) { }

    @Get('types')
    getSurveyTypes() {
        return [
            'Employee Satisfaction Survey',
            'Employee Wellness Survey',
            'Employee Engagement Survey',
            'Communication Effectiveness',
            'Training and Development ',
        ];
    }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createSurvey(
        @Body() createSurveyDto: CreateSurveyDto,
        @Req() req: Request,
    ) {
        const userId = req.user?.userId;
        console.log('req.user:', req.user);
        console.log('Creating survey for user:', userId);

        return this.surveyService.createSurvey(createSurveyDto, userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('save-draft')
    async saveDraft(
        @Body() dto: Partial<CreateSurveyDto>,
        @Req() req: Request,
    ) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new Error('Unauthorized: User ID missing');
        }
        return this.surveyService.saveDraftSurvey(dto, userId);
    }

    @Get('/my-surveys/:userId')
    async getMySurveys(@Param('userId') userId: string) {
        return this.surveyService.getSurveysForUser(userId);
    }

    @Get('/created-surveys/:userId')
    async getCreatedSurveys(
        @Param('userId') userId: string,
        @Query('page') page: '1',
        @Query('limit') limit: '10',
    ) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        return this.surveyService.getSurveysByCreator(userId, pageNum, limitNum);
    }

    @Get(':surveyId')
    async getSurveyById(@Param('surveyId') surveyId: string) {
        const survey = await this.surveyService.getSurveyById(surveyId);
        console.log('survey value from getSurveyById', survey);
        return survey;
    }

    @Get('/drafts:userId')
    async getDraftSurveys(@Param('userId') userId: string) {
        return await this.surveyService.getDraftSurveys(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('submit')
    async submitSurvey(@Body() dto: SubmitSurveyDto) {
        console.log(dto);
        return this.surveyService.saveSurveyAnswers(dto);
    }
}
