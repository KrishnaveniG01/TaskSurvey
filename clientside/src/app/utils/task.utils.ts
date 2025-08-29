'use client';

import axios from 'axios';
import { toast } from 'react-toastify';
import { type Task } from '../events/slices/taskSlice';
import { useEffect, useState } from 'react';

// --- Helper Function 1: handleSubmitTask (No changes needed here) ---
export const handleSubmitTask = async (
  taskData: Partial<Task>,
  token: string,
  navigate: () => void,
  onComplete: () => void
) => {
  // ... this function remains the same
  if (!token) {
    toast.error('Authentication error. Please log in again.');
    return;
  }
  const payload: { [key: string]: any } = {};
  Object.entries(taskData).forEach(([key, value]) => {
    if (!['rawTasks', 'createdTasks', 'currentTask', 'loading', 'error'].includes(key)) {
      payload[key] = value;
    }
  });
  payload.isDraft = false;
  try {
    const isUpdate = !!taskData.taskId;
    const url = isUpdate
      ? `http://localhost:5000/tasks/${taskData.taskId}`
      : 'http://localhost:5000/tasks';
    const method = isUpdate ? 'put' : 'post';
    const response = await axios({
      method,
      url,
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200 || response.status === 201) {
      toast.success(`Task ${isUpdate ? 'updated' : 'created'} successfully!`);
      onComplete();
      navigate();
    }
  } catch (error: any) {
    console.error('Failed to submit task:', error.response?.data || error.message);
    toast.error('Failed to submit task: ' + (error.response?.data?.message || 'Server Error'));
  }
};

export const handleCreateTaskWithFiles = async (
  taskState: Partial<Task>,
  files: File[],
  token: string,
  userId: string,
  navigate: () => void,
  onComplete: () => void
) => {
  if (!token || !userId) {
    toast.error('Authentication error. Please log in again.');
    return;
  }

  // Create a clean payload object.
  const payload = {
    taskTitle: taskState.taskTitle,
    taskDescription: taskState.taskDescription,
    plannedStartDate: taskState.startDate,
    plannedEndDate: taskState.endDate,
    plannedStartTime: taskState.startTime,
    plannedEndTime: taskState.endTime,
    reviewerId: taskState.taskReviewer,
    isImportant: taskState.isImportant,
    isRequiresProof: taskState.isRequiresProof,
    isMandatory: taskState.isMandatory,
    assignedTo: taskState.assignedTo,
    createdBy: userId,
    modifiedBy: userId,
  };

  const formData = new FormData();
  files.forEach(file => {
    formData.append('attachments', file);
  });
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  formData.append('isDraft', 'false');

  try {
    const isUpdate = !!taskState.taskId;
    const url = isUpdate
      ? `http://localhost:5000/tasks/${taskState.taskId}`
      : 'http://localhost:5000/tasks';
    const method = isUpdate ? 'put' : 'post';
    const response = await axios({ method, url, data: formData, headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200 || response.status === 201) {
      toast.success(`Task ${isUpdate ? 'updated' : 'created'} successfully!`);
      onComplete();
      navigate();
    }
  } catch (error: any) {
    console.error('Failed to submit task:', error.response?.data || error.message);
    toast.error('Failed to submit task: ' + (error.response?.data?.message || 'Server Error'));
  }
};

// --- Helper Function 3: handleSaveAndExitTask ---
export const handleSaveAndExitTask = async (
  taskData: Partial<Task>,
  token: string,
  userId: string,
  navigate: () => void,
  onComplete: () => void
) => {
  if (!token || !userId) {
    toast.error('Authentication error. Please log in again.');
    return;
  }

  const payload: { [key: string]: any } = {};
  Object.entries(taskData).forEach(([key, value]) => {
    if (!['rawTasks', 'createdTasks', 'currentTask', 'loading', 'error'].includes(key)) {
      payload[key] = value;
    }
  });
  payload.createdBy = userId;
  payload.modifiedBy = userId;
  
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
     if (value === null || value === undefined) return;
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });
  formData.set('isDraft', 'true');

  try {
    const isUpdate = !!taskData.taskId;
    const url = isUpdate
      ? `http://localhost:5000/tasks/save-draft/${taskData.taskId}`
      : 'http://localhost:5000/tasks/save-draft';
    const method = isUpdate ? 'put' : 'post';
    const response = await axios({ method, url, data: formData, headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 200 || response.status === 201) {
      toast.success('Task draft saved successfully!');
      onComplete();
      navigate();
    }
  } catch (error: any) {
    console.error('Failed to save task draft:', error.response?.data || error.message);
    toast.error('Failed to save task draft: ' + (error.response?.data?.message || 'Server Error'));
  }
};

// --- Geolocation and Access Control Hooks (No changes needed here) ---
const getCurrentLocation = (): Promise<GeolocationPosition> => {
  // ... this function remains the same
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

export const useAccessControl = (actionName: string, token: string | null) => {
  // ... this hook remains the same
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [reason, setReason] = useState('Checking access...');
  useEffect(() => {
    if (!actionName) {
      setIsLoading(false);
      setIsAllowed(false);
      setReason('No action specified.');
      return;
    }
    if (!token) {
      setIsLoading(false);
      setIsAllowed(false);
      setReason('Authentication required.');
      return;
    }
    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const position: GeolocationPosition = await getCurrentLocation();
        const { latitude, longitude } = position.coords;
        const response = await fetch('http://localhost:5000/events/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            actionName: actionName,
            userLatitude: latitude,
            userLongitude: longitude,
          }),
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.access) {
          setIsAllowed(true);
          setReason('');
        } else {
          setIsAllowed(false);
          setReason(data.reason || 'Access Denied.');
        }
      } catch (error: any) {
        setIsAllowed(false);
        const message = error instanceof Error ? error.message : 'Could not verify access.';
        setReason(message);
      } finally {
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [actionName, token]);
  return { isLoading, isAllowed, reason };
};
  