import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Question {
  questionText: string;
  answerType: string;
  options: { optionText: string }[];
  required?:boolean;
}

interface QuestionState {
  questions: Question[];
}

const initialState: QuestionState = {
  questions: [],
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.questions.push(action.payload);
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    resetQuestions: () => initialState,
  },
});

export const { addQuestion, setQuestions, resetQuestions } = questionSlice.actions;
export default questionSlice.reducer;
