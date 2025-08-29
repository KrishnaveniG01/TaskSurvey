// utils/surveyUtils.ts
'use client'; // required for client-side navigation

import axios from 'axios';
import { toast } from 'react-toastify';
import { resetSurveyData } from '../events/slices/surveySlice';
import { resetAudience } from '../events/slices/audienceSlice';
import { resetQuestions } from '../events/slices/questionSlice';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'; // to type `router`

export const handleSaveAndExit = async (
  data: any,
  token: string,
  navigate: (path: string) => void, // 👈 Just the push function
  dispatch: any,
  resetStep?: () => void
) => {
  try {
    const response = await axios.post(
      'http://localhost:5000/survey/save-draft',
      { ...data, status: 'D' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 200 || response.status === 201) {
      dispatch(resetSurveyData());
      dispatch(resetAudience());
      dispatch(resetQuestions());
      resetStep?.();
      toast.success('Added to draft!');
      navigate('/dashboard/create'); // ✅ Just call the passed-in push
    }
  } catch (error) {
    console.error('Failed to save draft:', error);
    toast.error('Failed to save draft');
  }
};

