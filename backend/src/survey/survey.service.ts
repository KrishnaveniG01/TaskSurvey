import { Injectable } from '@nestjs/common';
// import { DatabaseService } from 'src/database/database.service';
import { CreateSurveyDto } from './dto/createSurveyDto';
import { SubmitSurveyDto } from './dto/surveyAnswerDto';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundException } from '@nestjs/common';
import { surveyDB } from 'src/database/surveyDB';
import { orgIdValue } from 'src/utils';
function formatDateForMySQL(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
// private readonly db: DatabaseService

@Injectable()
export class SurveyService {
    constructor() { }

    async createSurvey(dto: CreateSurveyDto, userId: any) {
        console.log("user Id", userId);
        const surveyId = uuidv4();
        const now = new Date();
        const createdOn = now;

        const modifiedOn = now;

        const startDate = new Date(dto.startDate);

        const endDate = new Date(dto.endDate);

        const createdBy = userId;
        const modifiedBy = userId;
        console.log("created by", createdBy);

        // 1. Insert into surveys table
        await surveyDB.query(
            `INSERT INTO surveys 
     (surveyId, orgId,surveyTitle, surveyType, surveyDescription, startDate,endDate,startTime, endTime, 
      modifiedBy, modifiedOn, createdBy, createdOn,isMandatory, isAnonymous, addToLibrary, recStatus, dataStatus, recSeq) 
     VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?,?,'A', 'A', 1)`,
            [
                surveyId,
                uuidv4(),
                dto.surveyTitle ?? null,
                dto.surveyType ?? null,
                dto.surveyDescription ?? null,
                startDate ?? null,
                endDate ?? null,
                dto.startTime ?? null,
                dto.endTime ?? null,
                modifiedBy,
                new Date(),
                createdBy,
                new Date(),
                dto.isMandatory ?? false,
                dto.isAnonymous ?? false,
                dto.addToLibrary ?? false,
            ],
        );
        console.log("userId of dto", userId)
        console.log("dto.audience value", dto.audience)
        // 2. Insert audience
        for (const user of dto.audience) {
            const { id: userId } = user;
            await surveyDB.query(
                `INSERT INTO surveyAudience 
       (recordId, surveyId, userId,orgId, createdBy, createdOn, modifiedBy, modifiedOn, recStatus, dataStatus, recSeq)
       VALUES (?,?, ?, ?, ?, ?, ?, ?, 'A', 'A', 1)`,
                [
                    uuidv4(),
                    surveyId ?? null,
                    userId,
                    process.env.orgIdValue,
                    createdBy ?? null,
                   new Date(),
                    modifiedBy ?? null,
                    new Date(),
                ],
            );
        }

        // 3. Insert questions (with options as JSON if applicable)
        for (const question of dto.questions) {

            if (!question.questionText) {
                throw new Error('Question text is missing');
            }

            const questionId = uuidv4();
            const isRequired = question.isRequired ? 1 : 0;//if clicked on is required , value is 1 , else 0
            const normalizeAnswerType = (type: string) => {
                switch (type.toLowerCase()) {
                    case 'radio button':
                        return 'radio';
                    case 'check box':
                        return 'checkbox';
                    case 'drop down':
                        return 'dropdown';
                    case 'rating scale':
                        return 'rating';
                    case 'net promoter score':
                        return 'nps';
                    case 'text box':
                        return 'textbox';
                    case 'file upload':
                        return 'file';
                    case 'date & time':
                        return 'datetime';
                    default:
                        return type.toLowerCase();
                }
            };

            const answerType = normalizeAnswerType(question.answerType);
            const usesOptions = ['radio', 'checkbox', 'dropdown', 'rating', 'nps'];
            const optionsJson = usesOptions.includes(answerType)
                ? JSON.stringify(question.options || [])
                : null;
            console.log(
                'options for question:',
                question.questionText,
                question.options,
            );

            await surveyDB.query(
                `INSERT INTO surveyQuestions 
       (questionId,orgId, surveyId, questionText, questionNumber, answerType, isMandatory, options,
        createdBy, createdAt, modifiedBy, modifiedOn, recStatus, dataStatus, recSeq)
       VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?,'A', 'A', 1)`,
                [
                    questionId,
                    process.env.orgIdValue,
                    surveyId,
                    question.questionText,
                    question.questionNumber,//only for now , why would user entr the question number , it must automatically be increased
                    answerType,
                    isRequired,
                    optionsJson,
                    createdBy,
                    new Date(),
                    modifiedBy,
                    new Date(),
                ],
            );
        }

        return { message: 'Survey created successfully', surveyId };
    }

    async saveDraftSurvey(dto: Partial<CreateSurveyDto>, userId: string) {
        const surveyId = dto.surveyId || uuidv4();
        const now = new Date();

        //  Properly handle empty strings and invalid dates
        const parseDateOrNull = (input: any): string | null => {
            if (!input || typeof input !== 'string' || input.trim() === '')
                return null;
            const parsed = new Date(input);
            return isNaN(parsed.getTime()) ? null : formatDateForMySQL(parsed);
        };

        const startDate = parseDateOrNull(dto.startDate);
        const endDate = parseDateOrNull(dto.endDate);
        const startTime = dto.startTime?.trim() || null;
        const endTime = dto.endTime?.trim() || null;
        const modifiedBy = dto.modifiedBy || userId;

        console.log('startDateTime value:', dto.startDate);
        console.log('startDateTime formatted:', startDate);

        await surveyDB.query(
            `INSERT INTO surveys (
      surveyId, surveyTitle, surveyType, surveyDescription,
      startDateTime, startTime, endTime, endDateTime,
      createdBy, createdOn, modifiedBy, modifiedOn, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      surveyTitle = ?, surveyType = ?, description = ?,
      startDate = ?, startTime = ?, endTime = ?, endDate = ?,
      modifiedBy = ?, modifiedOn = ?, status = ?`,
            [
                // INSERT values
                surveyId,
                dto.surveyTitle ?? null,
                dto.surveyType ?? null,
                dto.surveyDescription ?? null,
                startDate,
                startTime,
                endTime,
                endDate,
                userId,
                now,
                modifiedBy,
                now,
                'draft',

                // UPDATE values
                dto.surveyTitle ?? null,
                dto.surveyType ?? null,
                dto.surveyDescription ?? null,
                startDate,
                startTime,
                endTime,
                endDate,
                modifiedBy,
                now,
                'draft',
            ],
        );

        //  Audience
        if (dto.audience) {
            await surveyDB.query(`DELETE FROM surveyAudience WHERE surveyId = ?`, [
                surveyId,
            ]);

            for (const audienceId of dto.audience) {
                await surveyDB.query(
                    `INSERT INTO surveyAudience (recordId, orgId,surveyId, userId, createdBy, createdOn, modifiedBy, modifiedOn, recStatus, dataStatus, recSeq)
         VALUES (?, ?,?, ?, ?, ?, ?, ?, 'A', 'D', 1)`,
                    [uuidv4(), orgIdValue, surveyId, audienceId.id, userId, now, userId, now],
                );
            }
        }

        //  Questions
        if (dto.questions && Array.isArray(dto.questions)) {
            await surveyDB.query(`DELETE FROM surveyQuestions WHERE surveyId = ?`, [
                surveyId,
            ]);

            for (const question of dto.questions) {
                const questionId = uuidv4();
                const answerType = question.answerType || '';
                const optionsJson = [
                    'radio',
                    'checkbox',
                    'dropdown',
                    'rating',
                    'nps',
                ].includes(answerType)
                    ? JSON.stringify(question.options || [])
                    : null;

                await surveyDB.query(
                    `INSERT INTO surveyQuestions (
          questionId,orgId, surveyId, questionText,questionNumber, answerType, isRequired,
          createdBy, createdOn, modifiedBy, modifiedOn, recStatus, dataStatus, recSeq 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, 'A', 'A', 1)`,
                    [
                        questionId,
                        process.env.orgIdValue,
                        surveyId,
                        question.questionText || '',
                        question.questionNumber || null,//for now only , later change
                        answerType,
                        question.isRequired ? 1 : 0,
                        userId,
                        now,
                        userId,
                        now,

                    ],
                );
            }
        }

        return { success: true, surveyId };
    }
    async getSurveysForUser(userId: string) {
        return await surveyDB.query(
            `SELECT s.surveyId, s.surveyTitle, s.surveyDescription, s.startDate, s.endDate
     FROM surveys s
     JOIN surveyAudience sa ON s.surveyId = sa.surveyId
     WHERE sa.userId = ? AND s.recStatus = 'A'`,
            [userId],
        );
    }

    async getSurveysByCreator(userId: string, page: number, limit: number) {
  const parsedLimit = Math.max(Number(limit) || 5, 1);  // default to 5 if invalid
  const parsedPage = Math.max(Number(page) || 1, 1);    // default to 1 if invalid
  const offset = (parsedPage - 1) * parsedLimit;

  console.log("userId:", userId);
  console.log("parsedLimit:", parsedLimit, typeof parsedLimit);
  console.log("offset:", offset, typeof offset);

  return await surveyDB.query(
    `SELECT 
      s.surveyId, 
      s.surveyTitle, 
      s.startDate, 
      s.endDate,
      s.createdOn, 
      COUNT(sa.userId) AS numAssignees,
      s.recStatus AS status
    FROM surveys s
    LEFT JOIN surveyAudience sa ON s.surveyId = sa.surveyId
    WHERE s.createdBy = ? AND s.recStatus = 'A'
    GROUP BY s.surveyId
    ORDER BY s.createdOn DESC
    LIMIT ? OFFSET ?`,   
    [userId, parsedLimit, offset]
  );
}



    async getSurveyById(surveyId: string) {
        // Fetch the survey details
        const surveys = (await surveyDB.query(
            `SELECT * FROM surveys WHERE surveyId = ? AND recStatus = 'A'`,
            [surveyId],
        )) as any[];

        if (!surveys.length) {
            throw new NotFoundException(`Survey with ID ${surveyId} not found`);
        }

        const survey = surveys[0];

        // Fetch the questions for this survey
        const questions = (await surveyDB.query(
            `SELECT questionId, questionText, questionNumber, answerType, options, isMandatory FROM surveyQuestions WHERE surveyId = ? AND recStatus = 'A' ORDER BY createdAt ASC`,
            [surveyId],
        )) as any[];

        console.log('questions value from fetch', questions);
        // Parse options JSON for each question, if present
        for (const question of questions) {
            console.log(
                `questionId: ${question.questionId}, options (raw):`,
                question.options,
                'type:',
                typeof question.options,
            );
            if (typeof question.options === 'string' && question.options.trim()) {
                try {
                    question.options = JSON.parse(question.options);
                } catch (err) {
                    console.error(
                        ` Failed to parse options for question ${question.questionId}:`,
                        err,
                    );
                    question.options = [];
                }
            } else if (Array.isArray(question.options)) {
                // Already an array, do nothing
            } else {
                question.options = [];
            }
            console.log(
                `questionId: ${question.questionId}, options (parsed):`,
                question.options,
                'type:',
                typeof question.options,
            );
        }

        // Optionally, fetch audience if needed
        const audience = (await surveyDB.query(
            `SELECT userId FROM surveyAudience WHERE surveyId = ? AND recStatus = 'A'`,
            [surveyId],
        )) as any[];

        // Return combined survey data
        return {
            ...survey,
            questions,
            audience: audience.map((a) => a.userId),//new audience variable will store the userIds
        };
    }

    async saveSurveyAnswers(dto: SubmitSurveyDto) {
        // 1. Get all valid questionIds for this survey
        const [rows] = (await surveyDB.query(
            `SELECT questionId FROM surveyQuestions WHERE surveyId = ? AND recStatus = 'A'`,
            [dto.surveyId],
        )) as any[];
        console.log('rows result:', rows);
        const rowsArray = Array.isArray(rows) ? rows : [rows];
        const validQuestionIds = rowsArray.map((row) => row.questionId);

        // 2. Check if all required questions are answered
        if (dto.answers.length !== validQuestionIds.length) {
            throw new Error(
                `Expected ${validQuestionIds.length} answers, but got ${dto.answers.length}`,
            );
        }

        // 3. (Optional) Validate each questionId is part of the survey
        for (const answer of dto.answers) {
            if (!validQuestionIds.includes(answer.questionId)) {
                throw new Error(`Invalid questionId: ${answer.questionId}`);
            }
        }

        // 4. Save answers
        const now = new Date();
        for (const answer of dto.answers) {
            const answerId = uuidv4();
            await surveyDB.query(
                `INSERT INTO surveyAnswer (
        answerId, surveyId, questionId, userId,
        answerText, createdBy, createdOn, modifiedBy,modifiedOn, recSeq, recStatus, dataStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`,
                [
                    answerId,
                    dto.surveyId,
                    answer.questionId,
                    dto.userId,
                    answer.answerText,
                    dto.userId,
                    now,
                    dto.userId,
                    now,
                    1,
                    'A',
                    'S',
                ],
            );
        }

        return { message: 'Survey submitted successfully' };
    }

    async getDraftSurveys(userId: string) {
        const DraftSurveys = await surveyDB.query(
            `SELECT surveyTitle, startDate, endDate, description FROM surveys WHERE dataStatus='draft' AND userId=?`,
            [userId],
        );

        return DraftSurveys;
    }
}
