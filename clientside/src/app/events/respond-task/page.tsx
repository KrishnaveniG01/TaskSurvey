'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '../slices/store';
import {
  Box, Typography, Paper, CircularProgress, Chip,
  Alert, Tooltip, Modal, Button
} from '@mui/material';
import {GridLegacy as Grid} from '@mui/material';
import { 
    AssignmentLate, CheckCircle, Grade, RateReview, Today, ExitToApp 
} from '@mui/icons-material';
import HandoverRequestForm from '@/components/handoverRequestForm';


// --- Interfaces ---
interface Task {
  taskId: string;
  taskTitle: string;
  isImportant: boolean;
  category: 'Overdue' | 'Due Today' | 'In Review' | 'Completed' | 'Pending';
}

interface TaskColumn {
  title: 'Overdue' | 'Due Today' | 'In Review' | 'Completed' | 'Pending';
  icon: React.ReactElement;
  color: string;
  tasks: Task[];
}

// --- Style for the modal pop-up ---
const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

// --- Main Component ---
export default function RespondToTaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const userId = useSelector((state: RootState) => state.auth.userId);
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
   if (!hasMounted) {
      return;
    }
    if (!userId || !token) {
      setLoading(false);
      return;
    }

    const fetchCategorizedTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/tasks/assigned-to/${userId}/categorized`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch assigned tasks.');
        const data = await res.json();
        // Handle both direct array and object-wrapped array responses
        if (data && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setTasks([]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategorizedTasks();
  }, [hasMounted, userId, token]);

  // --- Task Categorization on Frontend ---
  const taskColumns: TaskColumn[] = useMemo(() => {
    const columnMap: Record<TaskColumn['title'], Task[]> = {
      'Overdue': [],
      'Due Today': [],
      'In Review': [],
      'Completed': [],
      'Pending' : []
    };

    tasks.forEach(task => {
      if (task.category in columnMap) {
        columnMap[task.category as TaskColumn['title']].push(task);
      }
    });

    return [
      { title: 'Overdue', icon: <AssignmentLate />, color: 'error.main', tasks: columnMap['Overdue'] },
      { title: 'Due Today', icon: <Today />, color: 'warning.main', tasks: columnMap['Due Today'] },
      { title: 'In Review', icon: <RateReview />, color: 'info.main', tasks: columnMap['In Review'] },
      { title: 'Completed', icon: <CheckCircle />, color: 'success.main', tasks: columnMap['Completed'] },
       { title: 'Pending', icon: <AssignmentLate />, color: 'grey.500', tasks: columnMap['Pending'] },
    ];
  }, [tasks]);

  // --- Event Handlers ---
  const handleTaskClick = (taskId: string) => {
    router.push(`/events/respond-task/myTaskDetails/${taskId}`);
  };

  // --- Render Logic ---
  if (!hasMounted) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
 
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>My Assigned Tasks</Typography>
      <Grid container spacing={2}>
        {taskColumns.map(col => (
          <Grid item xs={12} md={6} lg={3} key={col.title}>
            <Paper sx={{ p: 2, backgroundColor: '#f9fafb', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: col.color }}>{col.icon}</Box>
                    <Typography variant="h6" fontSize="1rem" fontWeight="bold">{col.title} ({col.tasks.length})</Typography>
                </Box>
                {col.title === 'Due Today' && (
                    <Tooltip title="Request Handover">
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setIsHandoverModalOpen(true)}
                            startIcon={<ExitToApp />}
                        >
                            Handover
                        </Button>
                    </Tooltip>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {col.tasks.length > 0 ? col.tasks.map(task => (
                  <Paper 
                    key={task.taskId} 
                    variant="outlined"
                    onClick={() => handleTaskClick(task.taskId)}
                    sx={{ p: 1.5, cursor: 'pointer', '&:hover': { boxShadow: 3, borderColor: 'primary.main' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {task.isImportant && (
                        <Tooltip title="Important Task">
                          <Grade sx={{ color: 'orange', fontSize: '1.1rem' }} />
                        </Tooltip>
                      )}
                      <Typography variant="body2" fontWeight="500">{task.taskTitle}</Typography>
                    </Box>
                  </Paper>
                )) : (
                  <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No tasks</Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* --- Handover Request Modal --- */}
      <Modal
        open={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      >
        <Box sx={modalStyle}>
          <HandoverRequestForm onClose={() => setIsHandoverModalOpen(false)} />
        </Box>
      </Modal>
    </Box>
  );
}