'use client';

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress,
  Alert, Divider, TextField, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, ListItemButton
} from '@mui/material';
import { 
    Description, CloudUpload, Send, CheckCircle, RateReview, 
    ArrowBack, GppGoodOutlined, CheckCircleOutline 
} from '@mui/icons-material';
import { RootState } from '@/app/events/slices/store';
import { toast } from 'react-toastify';

// --- Interfaces ---
interface Proof {
  url: string; // The pre-signed URL from S3
  fileName: string;
  uploadedBy: string;
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
  reviewerId?: string | null;
  assignedToCount?: number;
  proofs?: Proof[];
  comments?: Comment[];
  status: string;
}

// --- Main Component ---
export default function MyTaskDetails() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;

  // --- State Management ---
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      console.log("the task details fetched are:", taskData);
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
      await fetchAllDetails(); // Refresh all data to show the new comment
    } catch (err: any) {
      toast.error(err.message || 'Could not post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!task) return;

    if (task.isRequiresProof && !proofFile) {
        setSubmitError("A proof file is required for this task.");
        return;
    }

    setIsSubmittingTask(true);
    setSubmitError(null);
    const formData = new FormData();
    if (proofFile) {
        formData.append('proofFile', proofFile);
    }

    try {
        const res = await fetch(`http://localhost:5000/tasks/${taskId}/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Submission failed.');
            console.log('Data ACTUALLY RECEIVED by Frontend:', res);
        
        toast.success(result.message);
        await fetchAllDetails(); // Refresh to show the new status
    } catch (err: any) {
        setSubmitError(err.message || 'Could not submit task.');
    } finally {
        setIsSubmittingTask(false);
    }
  };

  const formatDateTime = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr || new Date(dateStr).toString() === 'Invalid Date') {
      return 'N/A';
    }
    const fullDate = new Date(`${dateStr.split('T')[0]}T${timeStr || '00:00:00'}`);
    return fullDate.toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // --- Render Logic ---
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  if (!task) return <Box sx={{ p: 4 }}><Alert severity="warning">Task not found.</Alert></Box>;

  const canSubmit = task.status?.toLowerCase() === 'p' || task.status?.toLowerCase() === 'pending';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button variant="outlined" onClick={() => router.back()} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Tasks
      </Button>
      <Paper sx={{ p: 3 }}>
        {/* --- Task Header --- */}
        <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">{task.taskTitle}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {task.isMandatory && (
              <Chip icon={<GppGoodOutlined />} label="Mandatory" color="warning" size="small" variant="outlined" />
            )}
            {task.isRequiresProof && (
              <Chip icon={<CheckCircleOutline />} label="Requires Proof" color="info" size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        {/* --- Task Details Grid --- */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
          <Box><Typography color="text.secondary">Start on</Typography><Typography fontWeight="medium">{formatDateTime(task.startDate, task.startTime)}</Typography></Box>
          <Box><Typography color="text.secondary">Due on</Typography><Typography fontWeight="medium">{formatDateTime(task.endDate, task.endTime)}</Typography></Box>
          <Box><Typography color="text.secondary">Description</Typography><Typography fontWeight="medium">{task.taskDescription || 'No Description'}</Typography></Box>
          <Box><Typography color="text.secondary">Assigned by</Typography><Typography fontWeight="medium">{task.assignedByName || 'N/A'}</Typography></Box>
          <Box><Typography color="text.secondary">Reviewed by</Typography><Typography fontWeight="medium">{task.reviewerName || 'N/A'}</Typography></Box>
          <Box><Typography color="text.secondary">Assigned to</Typography><Typography fontWeight="medium">{task.assignedToCount || 1} Employee(s)</Typography></Box>
        </Box>
        
        {/* --- Attachments Section --- */}
        {task.proofs && task.proofs.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={1}>Attachments & Proofs</Typography>
            <List dense>
              {task.proofs.map((proof, idx) => (
                <ListItemButton key={idx} component="a" href={proof.url} target="_blank" rel="noopener noreferrer">
                  <ListItemAvatar><Avatar><Description /></Avatar></ListItemAvatar>
                  <ListItemText primary={proof.fileName} secondary={`Uploaded by ${proof.uploadedBy}`} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        {/* --- Submission Form --- */}
        {canSubmit ? (
          <Paper component="form" onSubmit={handleSubmitTask} variant="outlined" sx={{ mt: 4, p: 2, backgroundColor: '#e3f2fd' }}>
            <Typography variant="h6" gutterBottom>Submit Your Work</Typography>
            <Box mt={1}>
              <Button variant="outlined" component="label" color={task.isRequiresProof && !proofFile ? 'error' : 'primary'} startIcon={<CloudUpload />}>
                {proofFile ? proofFile.name : "Upload Proof"}
                {task.isRequiresProof && " *"}
                <input type="file" hidden onChange={(e) => { setProofFile(e.target.files ? e.target.files[0] : null); setSubmitError(null); }} />
              </Button>
              {task.isRequiresProof && 
                <Typography variant="caption" display="block" color="error.main" ml={1}>Proof is mandatory for this task.</Typography>
              }
            </Box>
            
            {submitError && 
              <Alert severity="error" sx={{mt: 2}}>
                {submitError}
              </Alert>
            }

            <Button 
              type="submit"
              variant="contained"
              sx={{ mt: 2, display: 'block' }}
              disabled={isSubmittingTask || (task.isRequiresProof && !proofFile)}
              startIcon={isSubmittingTask ? <CircularProgress size={20} color="inherit"/> : (task.reviewerId ? <RateReview /> : <CheckCircle />)}
            >
              {isSubmittingTask ? 'Submitting...' : (task.reviewerId ? 'Submit for Review' : 'Mark as Complete')}
            </Button>
          </Paper>
        ) : (
          <Alert severity="success" sx={{mt: 3}}>This task has already been submitted or completed.</Alert>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        {/* --- Comments Section --- */}
        <Typography variant="h6" fontWeight="bold" mb={2}>Task Comments</Typography>
        <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          {task.comments && task.comments.length > 0 ? task.comments.map((comment, idx) => (
            <Paper key={comment.commentId} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold">{comment.commenterName}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(comment.commentedOn).toLocaleString()}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>{comment.commentText}</Typography>
            </Paper>
          )) : <Typography color="text.secondary">No comments yet.</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField fullWidth variant="outlined" placeholder="Add Comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} size="small" />
          <Button variant="contained" onClick={handlePostComment} disabled={isSubmittingComment || !newComment.trim()} endIcon={isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : <Send />}>Add</Button>
        </Box>
      </Paper>
    </Box>
  );
}