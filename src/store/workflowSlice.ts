// src/store/workflowSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ActionNode {
  id: string;
  type: 'send' | 'receive';
  content: string;
}

export interface Workflow {
  id: string;
  name: string;
  createdBy: string;
  status: string;
  actions: any[];
  createdAt: string;
  consumer_id?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  messageReceiveData: any;
  messageSendData: any;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  messageReceiveData: {},
  messageSendData: {},
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setWorkflows: (state, action: PayloadAction<Workflow[]>) => {
      state.workflows = action.payload;
    },
    addWorkflow: (state, action: PayloadAction<Workflow>) => {
      state.workflows.push(action.payload);
      state.currentWorkflow = action.payload;
    },
    deleteWorkflow: (state, action: PayloadAction<string>) => {
      state.workflows = state.workflows.filter(w => w.id !== action.payload);
      if (state.currentWorkflow?.id === action.payload) state.currentWorkflow = null;
    },
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    addAction: (state, action: PayloadAction<{ type: 'send' | 'receive'; content: string }>) => {
      if (state.currentWorkflow) {
        const newAction: ActionNode = {
          id: Date.now().toString(),
          type: action.payload.type,
          content: action.payload.content,
        };
        state.currentWorkflow.actions.push(newAction);
      }
    },
    saveWorkflow: (state) => {
      // Persist to API if needed
      alert('Workflow saved!');
    },
    saveMessageReceive: (state, action: PayloadAction<any>) => {
      state.messageReceiveData = action.payload;
    },
    saveMessageSend: (state, action: PayloadAction<any>) => {
      state.messageSendData = action.payload;
    },
    // New reducer: Allows updating an existing workflow by ID with partial updates
    updateWorkflow: (state, action: PayloadAction<{ id: string; updates: Partial<Workflow> }>) => {
      const { id, updates } = action.payload;
      const workflow = state.workflows.find(w => w.id === id);
      if (workflow) {
        Object.assign(workflow, updates); // Merges updates into the existing workflow
        // Optionally update currentWorkflow if it's the one being edited
        if (state.currentWorkflow?.id === id) {
          state.currentWorkflow = { ...state.currentWorkflow, ...updates };
        }
      }
    },
  },
});

// Updated exports: Include updateWorkflow (removed Workflow, as it's not an action)
export const {
  setWorkflows,
  addWorkflow,
  deleteWorkflow,
  setCurrentWorkflow,
  addAction,
  saveWorkflow,
  saveMessageReceive,
  saveMessageSend,
  updateWorkflow  // Added here
} = workflowSlice.actions;

export const selectWorkflows = (state: any) => state.workflow.workflows;
export const selectCurrentWorkflow = (state: any) => state.workflow.currentWorkflow;

export default workflowSlice.reducer;