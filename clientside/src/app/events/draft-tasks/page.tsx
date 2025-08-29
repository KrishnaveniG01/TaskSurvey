'use client';

import { useEffect, useState, ChangeEvent, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Paper, TablePagination,
  TextField, CircularProgress,
  Alert,  Button, Card, CardContent, CardActionArea, debounce
} from '@mui/material';
import { RootState } from '../slices/store';
import { CalendarToday, PersonOutline } from '@mui/icons-material';


interface TaskForDraftsPage { 
  taskId: string; 
  taskTitle: string;
  startDate: string;
  startTime: string;
  createdByName?: string;
}

export default function MyDraftsTasksPage() {
  const userId = useSelector((state: RootState) => state.auth.userId);
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  const [tasks, setTasks] = useState<TaskForDraftsPage[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [total, setTotal] = useState(0); 

  const debouncedSearch = useCallback(debounce((value: string) => {
    setSearch(value);
    setPage(0); 
  }, 500), []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    if (!userId || !token) return;

    const fetchDraftTasks = async () => {
      setLoading(true);
      setError(null);
      try {
       
        const params = new URLSearchParams({
          page: (page + 1).toString(),
          limit: pageSize.toString(),
        });
        if (search) {
          params.append('search', search);
        }

       
        const res = await fetch(`http://localhost:5000/tasks/drafts/${userId}?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
       
        const responseData = await res.json();
        
        if (Array.isArray(responseData.tasks) && typeof responseData.total === 'number') {
            setTasks(responseData.tasks); 
            setTotal(responseData.total);
        } else {
            
            setTasks(Array.isArray(responseData) ? responseData : []);
            setTotal(Array.isArray(responseData) ? responseData.length : 0);
        }
      } catch (err: any) {
        setError(`Failed to load draft tasks: ${err.message}.`);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDraftTasks();
  }, [userId, token, page, pageSize, search]); 

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0); 
  };
  
  const handleDraftClick = (taskId: string) => {
  
    router.replace(`/events/create-task?draftId=${taskId}`); 
  };

  const formatDraftDate = (dateStr?: string, timeStr?: string) => {
      if (!dateStr) return 'No start date specified';
      const date = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
      return `Draft Task Starts on: ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  if (loading && tasks.length === 0) { 
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading drafts...</Typography></Box>;
  }
  if (error) {
    return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        
        <TextField
          label="Search Drafts"
          variant="outlined"
          size="small"
          onChange={handleSearchChange}
        />
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Drafts ({total})
      </Typography>

      {tasks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography>No draft tasks found for your search.</Typography>
          </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
          {tasks.map(task => (
            <Box key={task.taskId} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)' }, display: 'flex' }}>
              <Card sx={{ width: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: 6 } }}>
                <CardActionArea onClick={() => handleDraftClick(task.taskId)} sx={{ flexGrow: 1 }}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {task.taskTitle || <i>Untitled Draft</i>}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <PersonOutline fontSize="small" /> by {task.createdByName || 'Unknown User'}
                    </Typography>
                    <Box sx={{ backgroundColor: '#e3f2fd', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                        <CalendarToday fontSize="small" />
                        {formatDraftDate(task.startDate, task.startTime)}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[9, 18, 27]}
        sx={{ mt: 4 }}
      />
    </Box>
  );
}
