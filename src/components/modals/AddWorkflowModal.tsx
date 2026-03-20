import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addWorkflow } from '../../store/workflowSlice';
import { AppDispatch } from '../../store';
import { useAuth } from '../../contexts/AuthContext';

interface Consumer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface AddWorkflowModalProps {
  onClose: () => void;
  existingWorkflowNames: string[];
}

const AddWorkflowModal: React.FC<AddWorkflowModalProps> = ({ onClose, existingWorkflowNames }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [workflowName, setWorkflowName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (user?.role === 'MANAGER' && user.id) {
      fetch(`http://localhost:5000/workflows/consumers?manager_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setConsumers(data);
          }
        })
        .catch(err => console.error('Failed to fetch consumers:', err));
    }
  }, [user]);

  const computedWorkflowName = () => {
    if (user?.role === 'ADMIN') return managerName || '';
    if (user?.role === 'MANAGER') return selectedConsumer?.name || '';
    return workflowName;
  };

  const validateWorkflowName = (name: string, touched: boolean, existing: string[]): string[] => {
    if (!touched) return [];
    const errs: string[] = [];
    if (!name) errs.push('Workflow name is required');
    if (name.length > 25) errs.push('Maximum 25 characters allowed');
    if (/[^a-zA-Z0-9]/.test(name)) errs.push('No special characters or spaces allowed');
    if (existing.includes(name)) errs.push('Workflow name already exists');
    return errs;
  };

  useEffect(() => {
    const finalName = computedWorkflowName();
    const errs = validateWorkflowName(finalName, isTouched, existingWorkflowNames);
    setErrors(errs);
  }, [workflowName, managerName, selectedConsumer, isTouched, existingWorkflowNames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);
    
    const finalName = computedWorkflowName();
    const currentErrors = validateWorkflowName(finalName, true, existingWorkflowNames);
    
    if (currentErrors.length === 0 && finalName) {
      const localId = Date.now().toString();
      
      dispatch(addWorkflow({ 
        id: localId, 
        name: finalName, 
        createdBy: user?.name || 'You', 
        status: 'Active', 
        actions: [],
        createdAt: new Date().toISOString(),
        consumer_id: selectedConsumer?.id
      }));

      try {
        await fetch('http://localhost:5000/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalName,
            input_schema: { nodes: [] },
            creator_id: user?.id,
            consumer_id: selectedConsumer?.id,
            is_active: true
          })
        });
      } catch (err) {
        console.warn('Backend sync skipped:', err);
      }

      onClose();
      navigate(`/workflow/${localId}`, { state: { name: finalName, consumer_id: selectedConsumer?.id } });
    } else {
      setErrors(currentErrors);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X className="w-2 h-2" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Create new workflow</h2>
        <form onSubmit={handleSubmit}>
          {user?.role === 'ADMIN' ? (
            <div className="mb-2">
              <label className="block font-medium mb-1">Manager Name</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                onBlur={() => setIsTouched(true)}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.length ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter manager name..."
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">Workflow Name: <span className="font-semibold text-gray-700">{computedWorkflowName() || '...'}</span></p>
            </div>
          ) : user?.role === 'MANAGER' ? (
            <div className="mb-2">
              <label className="block font-medium mb-1">Select Consumer</label>
              <select
                value={selectedConsumer?.id || ''}
                onChange={(e) => {
                  const consumer = consumers.find(c => c.id === e.target.value);
                  setSelectedConsumer(consumer || null);
                  setIsTouched(true);
                }}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.length ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a consumer...</option>
                {consumers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">Workflow Name: <span className="font-semibold text-gray-700">{computedWorkflowName() || '...'}</span></p>
            </div>
          ) : (
            <div className="mb-2">
              <label className="block font-medium mb-1">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                onBlur={() => setIsTouched(true)}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${errors.length ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={25}
                placeholder="Enter workflow name (no spaces or special chars)"
                autoFocus
              />
            </div>
          )}
          
          {errors.length > 0 && (
            <ul className="mb-4 text-red-600 text-sm list-disc list-inside space-y-1">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={errors.length > 0 || !computedWorkflowName()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkflowModal;
