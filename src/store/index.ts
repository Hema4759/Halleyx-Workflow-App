// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import workflowReducer from './workflowSlice'; // Your existing workflow slice
import contactReducer from './contactSlice'; // Import the new contacts slice

export const store = configureStore({
  reducer: {
    workflow: workflowReducer, // Existing
    contacts: contactReducer, // Add this - creates state.contacts
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;