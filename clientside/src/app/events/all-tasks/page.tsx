'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import {
  Box, Typography, Paper, Table, TableBody,SelectChangeEvent,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, Select, MenuItem, InputLabel, FormControl, CircularProgress, Chip
} from '@mui/material';

interface Task {
 taskId: string; 
  recSeq: number; 
  orgId: string; 
  recStatus: string; 
  dataStatus: string; 
  taskTitle?: string | null; 
  taskDescription: string; 
  plannedStartDate?: string | null; 
  plannedStartTime?: string | null; 
  plannedEndDate?: string | null;
  plannedEndTime?: string | null;
  poolTask?: number | null; 
  groupTask?: number | null;
  mandatory?: number | null;
  proofOfCompletion?: number; 
  important?: number; 
  reviewBy?: string | null; 
  createdBy: string; 
  createdOn: Date;
  modifiedBy: string; 
  modifiedOn: Date;
}

const STATUSES = {
  All: 'All',
  P: 'Pending',
  D: 'Done',
  C: 'Cancelled',
  I: 'In Review',
};

export default function MyAllTasksPage() {

 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(0); 
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);


  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search,
          page: (page + 1).toString(),
          limit: pageSize.toString(), // Use 'limit'
        });
        if (status !== 'All') {
          params.append('status', status);
        }
       const res = await fetch(`http://localhost:5000/tasks/alltasks?${params}`);
        if (!res.ok) throw new Error('Failed to fetch tasks');
        
        const data = await res.json();
        setTasks(data.tasks || []);
        setTotal(data.total || 0);

      } catch (err) {
        console.error("Fetch error:", err);
        setTasks([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [search, status, page, pageSize]);

  // Handlers
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatus(e.target.value as string);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (recStatus: string) => {
    const statusMap: { [key: string]: { label: string; color: "success" | "warning" | "error" | "info" | "default" } } = {
      P: { label: 'Pending', color: 'warning' },
      D: { label: 'Done', color: 'success' },
      C: { label: 'Cancelled', color: 'error' },
      I: { label: 'In Review', color: 'info' },
    };
    const statusInfo = statusMap[recStatus] || { label: recStatus, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

 return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>All Tasks</Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField label="Search Tasks" variant="outlined" onChange={handleSearchChange} size="small" />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={handleStatusChange}>
            {Object.entries(STATUSES).map(([key, value]) => (
              <MenuItem key={key} value={key}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      <Paper sx={{ minHeight: 400 }}>
        {loading ? ( <Box sx={{ m: 6, textAlign: 'center' }}><CircularProgress /></Box> ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center">No tasks found.</TableCell></TableRow>
                  ) : (
                    tasks.map(task => (
                      <TableRow key={`${task.taskId}-${task.recSeq}`}>
                        <TableCell>{task.taskTitle}</TableCell>
                        <TableCell>{task.taskDescription}</TableCell>
                        {/* ✅ FIX 3: Use recStatus and a helper to display status correctly */}
                        <TableCell>{getStatusChip(task.recStatus)}</TableCell>
                        <TableCell>{task.plannedEndDate ? new Date(task.plannedEndDate).toLocaleDateString() : 'N/A'}</TableCell>
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
}