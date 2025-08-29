// clientside/src/app/events/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Helper to safely access localStorage (client-side only environment)
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Define the shape of your authentication state for better type safety
interface AuthState {
  token: string | null;
  role: 'admin' | 'employee' | 'manager' | null; // Explicitly define possible roles
  userId: string | null;
  username: string | null; // Added username to state
  isAuthenticated: boolean; // Indicates if a user is currently logged in
  loading: boolean; // Indicates if authentication state is currently being loaded/verified
}

// Initial state: Attempt to rehydrate from localStorage
const initialState: AuthState = {
  token: getLocalStorageItem('token'),
  role: getLocalStorageItem('userRole') as 'admin' | 'employee' | 'manager' | null, // Cast role type
  userId: getLocalStorageItem('userId'),
  username: getLocalStorageItem('username'), // Load username from localStorage
  isAuthenticated: !!getLocalStorageItem('token'), // Set true if a token exists in localStorage
  loading: false, // Default to false; set true if you have an async token verification thunk
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer to set user details upon successful login/registration
    setUser(state, action: PayloadAction<{ userId: string; token: string; role: string; username: string }>) {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
      state.role = action.payload.role as 'admin' | 'employee' | 'manager'; // Ensure type safety
      state.username = action.payload.username;
      state.isAuthenticated = true; // Mark as authenticated

      // Persist user data to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('userId', action.payload.userId);
      localStorage.setItem('userRole', action.payload.role); // Use 'userRole' as the key
      localStorage.setItem('username', action.payload.username);
    },
    // Reducer to handle user logout
    logout(state) {
      state.token = null;
      state.role = null;
      state.userId = null;
      state.username = null;
      state.isAuthenticated = false; // Mark as not authenticated

      // Clear all related items from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
    },
    // Reducer to update loading status of authentication (e.g., during token verification)
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  // If you use `createAsyncThunk` for your login or initial auth check,
  // you would define `extraReducers` here to handle `pending`, `fulfilled`, `rejected` states.
  // Example (assuming you have an `asyncLoginThunk`):
  /*
  extraReducers: (builder) => {
    builder
      .addCase(asyncLoginThunk.pending, (state) => {
        state.loading = true;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(asyncLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userId = action.payload.payload.userId;
        state.username = action.payload.payload.username;
        state.role = action.payload.payload.role;
        state.isAuthenticated = true;
        // Also remember to save to localStorage here if not using `setUser` directly after thunk
        localStorage.setItem('token', action.payload.token);
        // ... and other items
      })
      .addCase(asyncLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.userId = null;
        state.username = null;
        state.role = null;
        state.error = action.error.message || 'Authentication failed';
        // Clear from localStorage on rejection
        localStorage.removeItem('token');
        // ... and other items
      });
  },
  */
});

// Export all actions, including the new setAuthLoading
export const { setUser, logout, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;