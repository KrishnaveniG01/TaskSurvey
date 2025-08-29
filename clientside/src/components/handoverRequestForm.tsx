'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, CircularProgress, Alert, List, 
  ListItem, ListItemText, ListItemIcon, Checkbox, Button, IconButton,
  ListItemButton
} from '@mui/material';
import { RootState } from '@/app/events/slices/store'; // Adjust path
import { toast } from 'react-toastify';
import { Close } from '@mui/icons-material';

interface HandoverTask {
  taskId: string;
  taskTitle: string;
}

interface HandoverRequestFormProps {
  onClose: () => void; // Function to close the modal
}

export default function HandoverRequestForm({ onClose }: HandoverRequestFormProps) {
  const [tasks, setTasks] = useState<HandoverTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);

  useEffect(() => {
    if (!userId || !token) return;
    const fetchEligibleTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/tasks/eligible-for-handover/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch eligible tasks.');
        const data = await res.json();
        setTasks(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEligibleTasks();
  }, [userId, token]);

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmitRequest = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/tasks/request-handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskIds: selectedTasks }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to submit request.');
      toast.success('Handover request submitted successfully!');
      onClose(); // Close the modal on success
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Request Task Handover</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>
      <Typography color="text.secondary" sx={{ my: 2 }}>
        Select the tasks you wish to hand over.
      </Typography>
      
      {tasks.length > 0 ? (
        <>
          <List>
            {tasks.map(task => (
              <ListItemButton key={task.taskId} onClick={() => handleToggleTask(task.taskId)} dense >
                <ListItemIcon><Checkbox edge="start" checked={selectedTasks.includes(task.taskId)} disableRipple /></ListItemIcon>
                <ListItemText primary={task.taskTitle} />
              </ListItemButton>
            ))}
          </List>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={selectedTasks.length === 0 || isSubmitting}
            onClick={handleSubmitRequest}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : `Submit Request for ${selectedTasks.length} Task(s)`}
          </Button>
        </>
      ) : (
        <Alert severity="info">You have no tasks eligible for handover.</Alert>
      )}
    </Box>
  );
}
