// survey-submission.dto.ts
export class SurveyAnswerDto {
  questionId: string;
  answerText: string; // even if it's array, send it as stringified
}

export class SubmitSurveyDto {
  surveyId: string;
  userId: string;
  answers: SurveyAnswerDto[];
}
