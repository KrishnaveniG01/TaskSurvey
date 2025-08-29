import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Option type for questions
type Option = {
  optionText: string;
};

// Question type
type Question = {
  id: string;
  questionText: string;
  answerType: string;
  options?: Option[];
  required?: boolean;
};

// Basic survey type (for lists)
type Survey = {
  surveyId: string;
  surveyTitle: string;
  surveyDescription: string;
  createdOn:string;
  mandatory?: boolean;          // add this if your backend supports it
  startDate?: string;           // ISO string, e.g. '2025-07-14T10:00:00Z'
  endDate?: string;             // ISO string
  numAssignees?: number;
  status?: 'Ongoing' | 'Due Today' | 'Completed'; // use string literal union for better typing
  isDraft?: boolean;            // add if you track draft status
  inProgress?: boolean;         // add if you track in-progress status
  completed?: boolean;          // add if you track completion
};

// Survey with questions (for take survey)
type SurveyWithQuestions = Survey & {
  questions: Question[];
};

// State type
interface SurveyState {
  surveyTitle: string;
  surveyType: string;
  surveyDescription: string;
  startDate: string;
  startTime: string;
  endTime: string;
  endDate: string;
  isMandatory: boolean,
  isAnonymous: boolean,
  publishToLibrary: boolean,
  rawSurveys: Survey[];
  createdSurveys: Survey[];
  currentSurvey: SurveyWithQuestions | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SurveyState = {
  surveyTitle: '',
  surveyType: '',
  surveyDescription: '',
  startDate: '',
  startTime: '',
  endTime: '',
  endDate: '',
  isMandatory: false,
  isAnonymous: false,
  publishToLibrary: false,
  rawSurveys: [],
  createdSurveys: [],
  currentSurvey: null,
  loading: false,
  error: null,
};

// Thunks

// Fetch surveys assigned to an employee or manager
export const fetchUserSurveys = createAsyncThunk(
  'survey/fetchUserSurveys',
  async (userId: string) => {
    const response = await axios.get(`http://localhost:5000/survey/my-surveys/${userId}`);
    console.log('fetch survey response ', response.data)
    return response.data[0] as Survey[];
  }
);

// Fetch surveys created by admin user
// surveySlice.ts
export const fetchSurveysCreatedByUser = createAsyncThunk(
  'survey/fetchSurveysCreatedByUser',
  async ({ userId, page, limit }: { userId: string; page: number; limit: number }) => {
    const response = await axios.get(
      `http://localhost:5000/survey/created-surveys/${userId}?page=${page}&limit=${limit}`
    );
    console.log("response of fetch request", response.data);
    return response.data as Survey[];
  }
);


// Fetch a single survey (with questions) for taking the survey
export const fetchSurveyById = createAsyncThunk(
  'survey/fetchSurveyById',
  async (surveyId: string) => {
    const response = await axios.get(`http://localhost:5000/survey/${surveyId}`);
    return response.data as SurveyWithQuestions;
  }
);
export const fetchDraftSurveys = createAsyncThunk(
  'survey/fetchDraftSurveys',
  async (userId: string) => {
    const response = await axios.get(`/survey/drafts/${userId}`);
    return response.data;
  }
);

// Slice
const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    setSurveyData(state, action: PayloadAction<Partial<SurveyState>>) {
      Object.assign(state, action.payload);
    },
    resetSurveyData() {
      return initialState;
    },
    resetCurrentSurvey(state) {
      state.currentSurvey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Assigned surveys
      .addCase(fetchUserSurveys.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSurveys.fulfilled, (state, action) => {
        state.loading = false;
        state.rawSurveys = action.payload;
      })
      .addCase(fetchUserSurveys.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch assigned surveys';
      })

      // Created surveys
      .addCase(fetchSurveysCreatedByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSurveysCreatedByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.createdSurveys = action.payload;
      })
      .addCase(fetchSurveysCreatedByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch created surveys';
      })

      // Single survey with questions
      .addCase(fetchSurveyById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentSurvey = null;
      })
      .addCase(fetchSurveyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSurvey = action.payload;
      })
      .addCase(fetchSurveyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch survey';
        state.currentSurvey = null;
      });
  },
});

// Exports
export const { setSurveyData, resetSurveyData, resetCurrentSurvey } = surveySlice.actions;
export default surveySlice.reducer;
