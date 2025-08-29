'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '../slices/store';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, Select, MenuItem, InputLabel, FormControl, 
  CircularProgress, Chip, Alert, IconButton, debounce, SelectChangeEvent,
  Typography
} from '@mui/material';
import { RemoveRedEye } from '@mui/icons-material';

// Interface to handle all possible data fields
interface Task {
  taskId: string;
  taskTitle: string;
  assignedByName?: string; // For Employee view
  assignedToName?: string;  // For Admin/Manager view
  dueDate: string; 
  reviewerName?: string;
  status: string;
}

// Expanded roles to include 'manager'
type UserRole = 'admin' | 'manager' | 'employee';

const STATUSES = ['All', 'Pending', 'Done', 'Cancelled', 'In Review'];

const LoadingComponent = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
);

export const MyTasksPage = () => {
  const [hasMounted, setHasMounted] = useState(false);

  const userId = useSelector((state: RootState) => state.auth.userId);
  const token = useSelector((state: RootState) => state.auth.token);
  // Get the user's role, defaulting to 'employee' if not present
  const userRole: UserRole = useSelector((state: RootState) => state.auth.role as UserRole || 'employee');

  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => { setHasMounted(true); }, []);
  
  const debouncedSearch = useCallback(debounce((value: string) => {
    setSearch(value);
    setPage(0); 
  }, 500), []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  useEffect(() => {
    if (!hasMounted || !userId || !token) {
      if(hasMounted) setLoading(false);
      return;
    }

    const fetchMyTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ STEP 1: Determine the correct API endpoint based on the user's role
        let baseUrl = '';
        switch (userRole) {
          case 'admin':
            baseUrl = `http://localhost:5000/tasks/created-by/${userId}`;
            break;
          case 'manager':
            baseUrl = `http://localhost:5000/tasks/reviewed-by/${userId}`;
            break;
          case 'employee':
          default:
            baseUrl = `http://localhost:5000/tasks/assigned-to/${userId}`;
            break;
        }

        const params = new URLSearchParams({
          search,
          page: (page + 1).toString(),
          limit: pageSize.toString(), 
        });
        if (status !== 'All') {
          params.append('status', status);
        }

        const res = await fetch(`${baseUrl}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        
        if (data && Array.isArray(data.tasks) && typeof data.total === 'number') {
          setTasks(data.tasks);
          setTotal(data.total);
        } else {
          setTasks(Array.isArray(data) ? data : []);
          setTotal(Array.isArray(data) ? data.length : 0);
        }

      } catch (err: any) {
        setError(`Failed to load tasks: ${err.message}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [hasMounted, userId, token, search, status, page, pageSize, userRole]); // Add userRole to dependency array

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatus(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleTaskClick = (taskId: string) => {
    const urlPath = `/events/my-tasks/myTaskDetails/${taskId}`;
    router.push(urlPath);
  };
  
  const getStatusChipColor = (status: string): "success" | "warning" | "error" | "info" | "default" => {
    switch (status?.toLowerCase()) {
      case 'done': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'in review': return 'info';
      default: return 'default';
    }
  };
  
  if (!hasMounted) return <LoadingComponent />;

  // ✅ STEP 2: Determine the correct column header based on the user's role
  const relevantColumnHeader = userRole === 'employee' ? 'Assigned By' : 'Assigned To';

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>My Tasks</Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField label="Search Tasks" variant="outlined" size="small" onChange={handleSearchChange} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={handleStatusChange}>
            {STATUSES.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
          </Select>
        </FormControl>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Task name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{relevantColumnHeader}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Due On</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reviewer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                     <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                  ) : tasks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No tasks found.</TableCell></TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.taskId} hover>
                        <TableCell align="center">
                          <IconButton onClick={() => handleTaskClick(task.taskId)} color="primary" aria-label="view task">
                            <RemoveRedEye />
                          </IconButton>
                        </TableCell>
                        <TableCell>{task.taskTitle}</TableCell>
                        {/* ✅ STEP 3: Show the correct data field based on the user's role */}
                        <TableCell>
                          {userRole === 'employee' ? task.assignedByName : task.assignedToName || 'N/A'}
                        </TableCell>
                        <TableCell>{task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'N/A'}</TableCell>
                        <TableCell>{task.reviewerName || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={task.status || 'N/A'} color={getStatusChipColor(task.status)} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={total} page={page} onPageChange={handleChangePage}
              rowsPerPage={pageSize} onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default MyTasksPage;