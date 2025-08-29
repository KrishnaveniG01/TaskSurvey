'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

import SurveySetupStep from './surveySetup';
import SelectAudienceStep from './selelectAudience';
import CreateQuestion from './createQuestion';
import ReviewSurvey from './reviewDetails';

import { RootState } from '../slices/store';
import { resetAudience } from '../slices/audienceSlice';
import { resetQuestions } from '../slices/questionSlice';
import { resetSurveyData } from '../slices/surveySlice';

const stepLabels = ['Survey setup', 'Select Audience', 'Question creation', 'Review details'];

const CreateSurvey = () => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);

  // ✅ Next.js method for reading search params
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastMessage = searchParams.get('toast');
    if (toastMessage) {
      toast.success(toastMessage);
    }
  }, [searchParams]);

  const formData = useSelector((state: RootState) => state.survey);
  const audience = useSelector((state: RootState) => state.audience.audience);
  const questions = useSelector((state: RootState) => state.question.questions);
  const token = useSelector((state: RootState) => state.auth.token);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const startDateTime = `${formData.startDate}T${formData.startTime}`;
  const endDateTime = `${formData.endDate}T${formData.endTime}`;

  const handleSubmit = async () => {
    const finalPayload = {
      ...formData,
      startDateTime,
      endDateTime,
      audience,
      questions,
      
      createdOn: new Date().toISOString(),
    };
console.log("token:" , token)
    try {
      const response = await axios.post(
        
        'http://localhost:5000/survey/create',
        finalPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Survey created successfully!');
        console.log('DTO sent to backend:', finalPayload);

        dispatch(resetAudience());
        dispatch(resetQuestions());
        dispatch(resetSurveyData());
        setStep(1);
      } else {
        toast.error('Something went wrong while saving the survey.');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to create survey. Check console.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center p-8">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-10 transition-shadow duration-300 hover:shadow-3xl">
        {/* Stepper */}
        <div className="relative mb-12 px-4">
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-300 z-0 rounded-full" />
          <div
            className="absolute top-6 left-0 h-1 bg-green-500 z-10 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / (stepLabels.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between relative z-20">
            {stepLabels.map((label, index) => {
              const isCompleted = step > index + 1;
              const isActive = step === index + 1;
              const circleColor = isCompleted
                ? 'bg-green-500 text-white'
                : isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-800';

              return (
                <div key={index} className="flex flex-col items-center w-1/4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${circleColor}`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${isActive ? 'text-blue-700 font-semibold'
                      : isCompleted ? 'text-green-600'
                        : 'text-gray-700'
                      }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="mb-10 border-gray-200" />

        {/* Step Content */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Survey Setup</h2>
            <SurveySetupStep handleNext={handleNext} />
          </>
        )}

        {step === 2 && (
          <SelectAudienceStep onBack={handleBack} onNext={handleNext} setStep={setStep} />
        )}

        {step === 3 && (
          <CreateQuestion onBack={handleBack} onNext={handleNext} setStep={setStep} />
        )}

        {step === 4 && (
          <ReviewSurvey
            formData={{
              setup: formData,
              audience: audience,
              questions: questions.map(q => ({
                questionText: q.questionText,
                answerType: q.answerType,
                options: q.options,
              }))
            }}
            goToStep={(targetStep) => setStep(targetStep + 1)}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default CreateSurvey;
