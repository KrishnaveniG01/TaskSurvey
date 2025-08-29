'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, CircularProgress, Chip,
  Alert, Tooltip,
} from '@mui/material';
import { 
    AssignmentLate, CheckCircle, Grade, RateReview, Today 
} from '@mui/icons-material';
import { RootState } from '@/app/events/slices/store';
import { GridLegacy as Grid } from '@mui/material'

// --- Interfaces ---
interface Task {
  taskId: string;
  taskTitle: string;
  isImportant: boolean;
  category: 'Overdue' | 'Due Today' | 'In Review' | 'Completed' | 'Pending';
}

interface TaskColumn {
  title: string;
  icon: React.ReactElement;
  color: string;
  tasks: Task[];
}

// --- Props for our reusable component ---
interface TaskDashboardProps {
  title: string;
  apiUrl: string;
}

export default function TaskDashboard({ title, apiUrl }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const token = useSelector((state: RootState) => state.auth.token);

  // --- Data Fetching ---
  useEffect(() => {
    if (!apiUrl || !token) {
      setLoading(false);
      return;
    }
    const fetchCategorizedTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch tasks.');
        const data = await res.json();
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
  }, [apiUrl, token]);

  // --- Task Categorization on Frontend ---
  const taskColumns: TaskColumn[] = useMemo(() => {
    const columnMap: Record<any, Task[]> = { 'Overdue': [], 'Due Today': [], 'In Review': [], 'Completed': [], 'Pending' : [] };
    tasks.forEach(task => { if (task.category in columnMap) { columnMap[task.category].push(task); } });
    return [
      { title: 'Overdue', icon: <AssignmentLate />, color: 'error.main', tasks: columnMap['Overdue'] },
      { title: 'Due Today', icon: <Today />, color: 'warning.main', tasks: columnMap['Due Today'] },
      { title: 'In Review', icon: <RateReview />, color: 'info.main', tasks: columnMap['In Review'] },
      { title: 'Completed', icon: <CheckCircle />, color: 'success.main', tasks: columnMap['Completed'] },
      { title: 'Pending', icon: <AssignmentLate />, color: 'grey.500', tasks: columnMap['Pending'] },
    ];
  }, [tasks]);

  const handleTaskClick = (taskId: string) => {
    router.push(`/events/my-tasks/myTaskDetails/${taskId}`);
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f4f6f8', minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>{title}</Typography>
      <Grid container spacing={2}>
        {taskColumns.map(col => (
          <Grid item xs={12} md={6} lg={3} key={col.title}>
            <Paper sx={{ p: 2, backgroundColor: '#f9fafb', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ color: col.color }}>{col.icon}</Box>
                <Typography variant="h6" fontSize="1rem" fontWeight="bold">{col.title} ({col.tasks.length})</Typography>
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
                        <Tooltip title="Important Task"><Grade sx={{ color: 'orange', fontSize: '1.1rem' }} /></Tooltip>
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
    </Box>
  );
}