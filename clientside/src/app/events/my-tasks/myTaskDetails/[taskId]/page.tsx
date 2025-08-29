'use client';

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress,
  Alert, Divider, TextField, IconButton, List, ListItem,
  ListItemText, ListItemAvatar, Avatar,
  ListItemButton
} from '@mui/material';
import { ArrowBack, Send, Description, CheckCircleOutline, GppGoodOutlined } from '@mui/icons-material';
import { RootState } from '@/app/events/slices/store';

// Interfaces for your data shapes
interface Proof {
  url: string;
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
  assignedToCount?: number;
  proofs?: Proof[];
  comments?: Comment[];
  status: string;
}

export default function MyTaskDetails() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.taskId as string;
  const token = useSelector((state: RootState) => state.auth.token);
  const userId = useSelector((state: RootState) => state.auth.userId);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchAllDetails = React.useCallback(async () => {
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
    } catch (err: any) { // ✅ FIX 1: ADDED THE MISSING '{' HERE
      alert(err.message || 'Could not post comment.');
    } finally {
      setIsSubmittingComment(false);
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

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  if (!task) return <Box sx={{ p: 4 }}><Alert severity="warning">Task not found.</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button variant="outlined" onClick={() => router.back()} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Tasks
      </Button>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
          <Chip label={`Due on ${new Date(task.endDate || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`} color="primary" />
          <Typography variant="h5" fontWeight="bold" mt={1}>{task.taskTitle}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {task.isMandatory && (
              <Chip icon={<GppGoodOutlined />} label="Mandatory" color="warning" size="small" variant="outlined" />
            )}
            {task.isRequiresProof && (
              <Chip icon={<CheckCircleOutline />} label="Requires Proof" color="info" size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
          <Box><Typography color="text.secondary">Start on</Typography><Typography fontWeight="medium">{formatDateTime(task.startDate, task.startTime)}</Typography></Box>
          <Box><Typography color="text.secondary">Due on</Typography><Typography fontWeight="medium">{formatDateTime(task.endDate, task.endTime)}</Typography></Box>
          <Box><Typography color="text.secondary">Description</Typography><Typography fontWeight="medium">{task.taskDescription || 'No Description'}</Typography></Box>
          <Box><Typography color="text.secondary">Assigned by</Typography><Typography fontWeight="medium">{task.assignedByName || 'N/A'}</Typography></Box>
          <Box><Typography color="text.secondary">Reviewed by</Typography><Typography fontWeight="medium">{task.reviewerName || 'N/A'}</Typography></Box>
          <Box><Typography color="text.secondary">Assigned to</Typography><Typography fontWeight="medium">{task.assignedToCount || 1} Employee(s)</Typography></Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />

       {task.proofs && task.proofs.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 3 }}>
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

        <Typography variant="h6" fontWeight="bold" mb={2}>Task Comments</Typography>
        <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          {task.comments && task.comments.length > 0 ? task.comments.map(comment => (
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
          {/* ✅ FIX 2: Corrected the typo from e.g.,.value to e.target.value */}
          <TextField fullWidth variant="outlined" placeholder="Add Comment" value={newComment} onChange={(e) => setNewComment(e.target.value)} size="small" />
          <Button variant="contained" onClick={handlePostComment} disabled={isSubmittingComment || !newComment.trim()} endIcon={isSubmittingComment ? <CircularProgress size={20} color="inherit" /> : <Send />}>Add</Button>
        </Box>
      </Paper>
    </Box>
  );
}