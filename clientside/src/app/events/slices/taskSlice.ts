import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// --- TYPES ---
export type Assignee = {
  userId: string;
  userName?: string;
  status?: 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Overdue';
  completedAt?: string;
  isRequiresProof?: { fileName: string; filePath: string };
  completedByAnotherAssignee?: boolean;
};

export type Comment = {
  userId: string; // This is the correct property for the user's ID
  username?: string;
  commentText: string;
  createdAt: string;
  readBy: string[];
};

export type StoredTaskDocument = {
  attachmentId: string;
  fileUrl: string;
  fileName: string;
  recSeq?: number;
};

export type Task = {
  taskId?: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskReviewer?: string | null;
  isRequiresProof?: boolean | null;
  isImportant?: boolean | null;
  isMandatory?: boolean | null;
  additionalDocuments: StoredTaskDocument[];
  createdBy?: string;
  createdByName?: string;
  assignedTo: Assignee[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  comments?: Comment[];
  createdAt?: string;
  isDraft?: boolean;
  statusForEmployee?: 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Overdue' | 'Due Today';
  unreadCommentCount?: number;
};

export interface TaskState {
  taskTitle: string;
  taskDescription?: string | null;
  taskReviewer?: string | null;
  isRequiresProof?: boolean | null;
  isImportant?: boolean | null;
  isMandatory?: boolean | null;
  additionalDocuments: StoredTaskDocument[];
  assignedTo: { userId: string; userName?: string }[];
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  rawTasks: Task[];
  createdTasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  taskTitle: '',
  taskDescription: null,
  taskReviewer: null,
  isRequiresProof: false,
  isImportant: false,
  isMandatory: false,
  additionalDocuments: [],
  assignedTo: [],
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  rawTasks: [],
  createdTasks: [],
  currentTask: null,
  loading: false,
  error: null,
};

// --- NEW ASYNC THUNK ---
// This function handles the API call to fetch tasks assigned to a user.
export const fetchUserAssignedTasks = createAsyncThunk(
  'task/fetchUserAssignedTasks',
  async ({ userId, token }: { userId: string; token: string }, { rejectWithValue }) => {
    try {
      // The endpoint should match your backend controller for fetching tasks assigned to a user
      const response = await axios.get(`http://localhost:5000/tasks/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Assuming the backend returns an object like { tasks: [], total: number } or just an array
      return response.data.tasks || response.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setTaskData(state, action: PayloadAction<Partial<TaskState>>) {
      return { ...state, ...action.payload };
    },
    resetTaskData: () => initialState,
    setAssignedEmployees(state, action: PayloadAction<{ userId: string; userName?: string }[]>) {
      state.assignedTo = action.payload;
    },
    updateTaskField(state, action: PayloadAction<{ field: keyof TaskState; value: any }>) {
      const { field, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state, field)) {
        (state as any)[field] = value;
      }
    },
  },
  // --- EXTRA REDUCERS to handle the async thunk lifecycle ---
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserAssignedTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAssignedTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.rawTasks = action.payload;
      })
      .addCase(fetchUserAssignedTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setTaskData,
  resetTaskData,
  setAssignedEmployees,
  updateTaskField,
} = taskSlice.actions;

export default taskSlice.reducer;
