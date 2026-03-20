import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Workflow } from '../store/workflowSlice';

const fetchWorkflows = async (): Promise<Workflow[]> => {
  const response = await axios.get('/api/workflows'); // Replace with real API endpoint
  return response.data;
};

export const useWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};