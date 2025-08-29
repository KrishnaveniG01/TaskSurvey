
import { configureStore } from '@reduxjs/toolkit';
import surveyReducer from './surveySlice';
import questionReducer from './questionSlice';
import audienceReducer from './audienceSlice';
import authReducer from './authSlice'
import taskReducer from './taskSlice'

export const store = configureStore({
  reducer: {
    
    survey:surveyReducer,
    question:questionReducer,
    audience:audienceReducer,
    auth: authReducer,
    task: taskReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
