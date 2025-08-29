// audienceSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AudienceMember {
  id: string;
  username: string; // <- Added this
}

interface AudienceState {
  audience: AudienceMember[];
}

const initialState: AudienceState = {
  audience: [],
};

const audienceSlice = createSlice({
  name: 'audience',
  initialState,
  reducers: {
    setAudience: (state, action: PayloadAction<AudienceMember[]>) => {
      state.audience = action.payload;
    },
    addToAudience: (state, action: PayloadAction<AudienceMember>) => {
      const exists = state.audience.some(member => member.id === action.payload.id);
      if (!exists) {
        state.audience.push(action.payload);
      }
    },
    removeFromAudience: (state, action: PayloadAction<string>) => {
      state.audience = state.audience.filter(member => member.id !== action.payload);
    },
    resetAudience: (state) => {
      state.audience = [];
    }
  },
});

export const { setAudience, addToAudience, removeFromAudience, resetAudience } = audienceSlice.actions;
export default audienceSlice.reducer;
