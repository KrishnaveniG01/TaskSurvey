// create-survey.dto.ts
export class CreateSurveyDto {
  surveyTitle: string;
  surveyId: number;
  createdBy: string;
  createdOn: Date
  surveyType: string;
  surveyDescription: string;
  startDate: string;
  startTime: string;
  endTime: string;
  endDate: string;
  modifiedBy?: string;
  modifiedOn?: Date;
  audience: { id: string; username: string }[]; // userIds
  isMandatory?: boolean;
  isAnonymous?: boolean;
  addToLibrary?: boolean;
  questions: {
    questionText: string;
    questionNumber:number;
    answerType: string; // eg: multiple choice, text
    options?: { optionText: string; isCorrect?: boolean }[];
    isRequired?: boolean;
  }[];
}
