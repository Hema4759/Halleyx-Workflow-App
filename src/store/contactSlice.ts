// src/store/contactSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define interfaces (matching what's used in ContactsSidebar)
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: string; // e.g., 'Premium', 'Regular', 'New'
}

export interface Segment {
  id: string;
  name: string;
  count?: number; // Optional, for display purposes
}

export interface ContactList {
  id: string;
  name: string;
  count?: number; // Optional, for display purposes
}

// State interface
interface ContactState {
  contacts: Contact[];
  segments: Segment[];
  contactLists: ContactList[];
}

// Initial state (with sample data for testing - replace with real data later)
const initialState: ContactState = {
  contacts: [
    { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com', segment: 'Premium' },
    { id: '2', name: 'Jane Smith', phone: '987-654-3210', email: 'jane@example.com', segment: 'Regular' },
    { id: '3', name: 'Alice Johnson', phone: '555-123-4567', email: 'alice@example.com', segment: 'New' },
  ],
  segments: [
    { id: '1', name: 'Premium', count: 1 },
    { id: '2', name: 'Regular', count: 1 },
    { id: '3', name: 'New', count: 1 },
  ],
  contactLists: [
    { id: '1', name: 'VIP List', count: 2 },
    { id: '2', name: 'Newsletter Subscribers', count: 1 },
  ],
};

const contactSlice = createSlice({
  name: 'contacts', // Important: This must match the store key ('contacts')
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.push(action.payload);
    },
    // Add more reducers as needed (e.g., updateContact, deleteContact)
  },
});

// Export actions
export const { addContact } = contactSlice.actions;

// Export selectors (these access state.contacts.*)
export const selectContacts = (state: any) => state.contacts.contacts;
export const selectSegments = (state: any) => state.contacts.segments;
export const selectContactLists = (state: any) => state.contacts.contactLists;

// Export reducer as default
export default contactSlice.reducer;