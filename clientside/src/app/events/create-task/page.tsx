'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

import TaskSetupStep from './taskDetails';
import SelectAudienceStep from './selectAudience';
import ReviewTaskDetails from './confirmation';
import { RootState } from '../slices/store';
import { handleCreateTaskWithFiles, handleSaveAndExitTask } from '@/app/utils/task.utils'; 
import { resetTaskData, setTaskData } from '../slices/taskSlice';
import { Box, CircularProgress, Typography } from '@mui/material';

const stepLabels = ['Task Details', 'Select Audience', 'Review & Confirm'];


const LoadingState = ({ message = 'Loading...' }: { message?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>{message}</Typography>
  </Box>
);

const CreateTaskPage = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false); 
  const userId = useSelector((state: RootState) => state.auth.userId);

  const formData = useSelector((state: RootState) => state.task);
    console.log("this is the data that has been sent to backend:",formData)
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const draftId = searchParams.get('draftId');
    if (!draftId || !token) return;

    const fetchDraftDetails = async () => {
      setIsLoadingDraft(true);
      try {
        const res = await fetch(`http://localhost:5000/tasks/${draftId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch draft details');
        const draftData = await res.json();
        dispatch(setTaskData(draftData));
        toast.success("Draft loaded successfully!");
        setStep(3); 
      } catch (error) {
        console.error("Error loading draft:", error);
        toast.error("Could not load the selected draft.");
        // FIX: Use the correct URL path for navigation, not a file system path.
        router.push('/events/draft-tasks'); 
      } finally {
        setIsLoadingDraft(false);
      }
    };
    fetchDraftDetails();
  }, [hasMounted, searchParams, token, dispatch, router]);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, stepLabels.length));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (stepNumber: number) => {
    // Allow navigation only to previous steps to maintain flow
    if (stepNumber < step) {
      setStep(stepNumber);
    }
  };

  const handleSubmit = async () => {
    if (!token || !userId) {
      toast.error('You are not authenticated!');
      return;
    }

    const myTasksUrl = '/events/my-tasks'; 

    await handleCreateTaskWithFiles(
      formData,
      filesToUpload,
      token,
      userId,
      () => router.push(myTasksUrl),
      () => {
          dispatch(resetTaskData());
          setStep(1);
          setFilesToUpload([]);
      }
    );
  };


  const handleSaveDraft = async () => {
    if (!token || !userId) {
      toast.error('You are not authenticated!');
      return;
    }
    // Define the destination URL for saving a draft.
    const draftTasksUrl = '/events/draft-tasks';

    await handleSaveAndExitTask(
      formData,
      token,
      userId,
      // FIX: The utility function expects a callback with no arguments.
      // This now correctly matches the function signature.
      () => router.push(draftTasksUrl),
      () => {
        dispatch(resetTaskData());
        setStep(1);
      }
    );
  };

  if (!hasMounted) return <LoadingState />;
  if (isLoadingDraft) return <LoadingState message="Loading Draft..." />;

  return (
    <div className="min-h-screen bg-[#d4d3d3] flex items-start justify-center p-8">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-10 transition-shadow duration-300 hover:shadow-3xl">
        
        {/* --- Refactored Stepper UI --- */}
        <Stepper activeStep={step - 1} alternativeLabel sx={{ mb: 4 }}>
          {stepLabels.map((label, index) => (
            <Step key={label} onClick={() => goToStep(index + 1)} sx={{ cursor: 'pointer' }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <hr className="my-8 border-gray-200" />
        
        {/* Step Content */}
        {step === 1 && (
          <TaskSetupStep
            handleNext={handleNext}
            setStep={setStep}
            onFilesChange={setFilesToUpload}
            initialFiles={filesToUpload}
            onSaveAndExit={handleSaveDraft}
          />
        )}
        {step === 2 && (
          <SelectAudienceStep
            onBack={handleBack}
            onNext={handleNext}
            setStep={setStep}
            onSaveAndExit={handleSaveDraft}
          />
        )}
        {step === 3 && (
          <ReviewTaskDetails
            formData={formData}
            files={filesToUpload}
            goToStep={(targetStep) => setStep(targetStep)} 
            handleSubmit={handleSubmit}
            onBack={handleBack}
            onSaveAndExit={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
};

export default CreateTaskPage;
