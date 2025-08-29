'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../slices/store';
import { Box, Typography } from '@mui/material';
import TaskDashboard from '@/components/dashboard';

export default function ManagerReviewPage() {
  const userId = useSelector((state: RootState) => state.auth.userId);

  if (!userId) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Please log in to view tasks for review.</Typography>
      </Box>
    );
  }

  // Fetch tasks where the manager is the reviewer
  const apiUrl = `http://localhost:5000/tasks/reviewed-by/${userId}/categorized`;

  return <TaskDashboard title="Tasks to Review" apiUrl={apiUrl} />;
}