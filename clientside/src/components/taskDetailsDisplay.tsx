'use client';

import React, { useMemo } from 'react';
import {
  Box, Typography, Paper, List, ListItemText,
  ListItemAvatar, Avatar, ListItemButton, Divider, Chip
} from '@mui/material';
import { Description, GppGoodOutlined, CheckCircleOutline } from '@mui/icons-material';

interface Proof {
    url: string; 
    fileName: string;
    uploadedBy: string;
    uploaderRole: 'admin' | 'employee' | 'manager'; 
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
}

interface TaskDetailDisplayProps {
  task: TaskDetail;
  userRole: 'admin' | 'manager' | 'employee'; 
  formatDateTime: (date: string | null, time: string | null) => string;
}


export default function TaskDetailDisplay({ task, userRole, formatDateTime }: TaskDetailDisplayProps) {

  const adminAttachments = useMemo(() => {
    return task.proofs?.filter(p => p.uploaderRole === 'admin') || [];
  }, [task.proofs]);

  const employeeSubmissions = useMemo(() => {
    if (userRole === 'manager' || userRole === 'admin') {
      return task.proofs?.filter(p => p.uploaderRole === 'employee') || [];
    }
    return [];
  }, [task.proofs, userRole]);


  return (
    <>
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

      {/* --- Admin Attachments Section (Visible to everyone) --- */}
      {adminAttachments.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={1}>Attachments from Admin</Typography>
          <List dense>
            {adminAttachments.map((proof) => (
              <ListItemButton key={proof.url} component="a" href={proof.url} target="_blank" rel="noopener noreferrer">
                <ListItemAvatar><Avatar><Description /></Avatar></ListItemAvatar>
                <ListItemText primary={proof.fileName} secondary={`Uploaded by ${proof.uploadedBy}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* --- Employee Submissions Section (Visible ONLY to Manager/Admin) --- */}
      {employeeSubmissions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9' }}>
          <Typography variant="h6" fontWeight="bold" mb={1}>Employee Submissions</Typography>
          <List dense>
            {employeeSubmissions.map((proof) => (
              <ListItemButton key={proof.url} component="a" href={proof.url} target="_blank" rel="noopener noreferrer">
                <ListItemAvatar><Avatar><Description /></Avatar></ListItemAvatar>
                <ListItemText primary={proof.fileName} secondary={`Submitted by ${proof.uploadedBy}`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
      
      <Divider sx={{ my: 3 }} />

      {/* --- Comments Section --- */}
      <Typography variant="h6" fontWeight="bold" mb={2}>Task Comments</Typography>
      <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
        {task.comments && task.comments.length > 0 ? task.comments.map((comment) => (
          <Paper key={comment.commentId} variant="outlined" sx={{ p: 2, m: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">{comment.commenterName}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(comment.commentedOn).toLocaleString()}</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>{comment.commentText}</Typography>
          </Paper>
        )) : <Typography color="text.secondary" sx={{p: 2}}>No comments yet.</Typography>}
      </Box>
    </>
  );
}