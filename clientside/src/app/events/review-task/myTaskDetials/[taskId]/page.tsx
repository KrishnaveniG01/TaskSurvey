'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Button, CircularProgress,
  Alert, TextField
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { RootState } from '@/app/events/slices/store';
import { toast } from 'react-toastify';
import TaskDetailDisplay from '@/components/taskDetailsDisplay';


// --- Interfaces ---
interface Proof {
  url: string;
  fileName: string;
  uploadedBy: string;
  uploaderRole: 'admin' | 'employee';
}
interface Comment {
  commentId: string;
  commentText: string;
  commenterName: string;
  commentedOn: string;
}
interface TaskDetail {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  startDate: string | null;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  isRequiresProof: boolean;
  isMandatory: boolean;
  assignedByName?: string;
  reviewerName?: string;
  assignedToCount?: number;
  proofs?: Proof[];
  comments?: Comment[];
  status: string;
}

// --- Main Component ---
export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;

  // --- State Management ---
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);
  const userRole = useSelector((state: RootState) => state.auth.role as 'admin' | 'manager' | 'employee');

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // --- Data Fetching ---
  const fetchAllDetails = useCallback(async () => {
    if (!token || !taskId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/tasks/${taskId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load task details.');
      const taskData = await res.json();
      setTask(taskData);
    } catch (fetchError: any) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);

  useEffect(() => {
    fetchAllDetails();
  }, [fetchAllDetails]);

  // --- Event Handlers ---
  const handlePostComment = async () => {
    if (!newComment.trim() || !userId) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`http://localhost:5000/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commentText: newComment, userId }),
      });
      if (!res.ok) throw new Error('Failed to post comment.');
      setNewComment('');
      await fetchAllDetails();
    } catch (err: any) {
      toast.error(err.message || 'Could not post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'reject') => {
      setIsReviewing(true);
      try {
        // This API endpoint handles both approving and rejecting
        const res = await fetch(`http://localhost:5000/tasks/${taskId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action, comment: newComment }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Review action failed.');

        toast.success(`Task has been ${action}d!`);
        setNewComment('');
        await fetchAllDetails(); // Refresh data to show the new status
      } catch (err: any) {
        toast.error(err.message || 'Could not complete review action.');
      } finally {
        setIsReviewing(false);
      }
  };

  const formatDateTime = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr || new Date(dateStr).toString() === 'Invalid Date') return 'N/A';
    const fullDate = new Date(`${dateStr.split('T')[0]}T${timeStr || '00:00:00'}`);
    return fullDate.toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- Render Logic ---
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  if (!task) return <Box sx={{ p: 4 }}><Alert severity="warning">Task not found.</Alert></Box>;

  // A variable to check if the task is ready for review
  const canReview = task.status?.toLowerCase() === 'i' || task.status?.toLowerCase() === 'in review';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button variant="outlined" onClick={() => router.back()} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Tasks
      </Button>
      <Paper sx={{ p: 3 }}>
        {/* --- Reusable Display Component --- */}
        <TaskDetailDisplay task={task} userRole={userRole} formatDateTime={formatDateTime} />

        {/* --- Manager-Specific Action Buttons --- */}
        {canReview ? (
          <Paper variant="outlined" sx={{ mt: 4, p: 2, backgroundColor: '#fff9c4' }}>
            <Typography variant="h6" gutterBottom>Review Actions</Typography>
            <TextField
                label="Add review comment (required for rejection)"
                fullWidth
                multiline
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ my: 2, backgroundColor: 'white' }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button 
                variant="contained" 
                color="success" 
                onClick={() => handleReviewAction('approve')}
                disabled={isReviewing}
              >
                {isReviewing ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => handleReviewAction('reject')}
                disabled={isReviewing || !newComment.trim()} // Reject button is disabled without a comment
              >
                {isReviewing ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
              </Button>
            </Box>
          </Paper>
        ) : (
             <Alert severity="info" sx={{mt: 3}}>This task is not currently in a reviewable state.</Alert>
        )}

        {/* --- Comment Input Box (for general comments) --- */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
            <TextField fullWidth variant="outlined" placeholder="Add a general comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} size="small" />
            <Button variant="contained" onClick={handlePostComment} disabled={isSubmittingComment || !newComment.trim()} endIcon={isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : <Send />}>
                Add
            </Button>
        </Box>
      </Paper>
    </Box>
  );
}