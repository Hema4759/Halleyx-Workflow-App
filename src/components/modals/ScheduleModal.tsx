import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ScheduleModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ScheduleModal({ onClose, onSave }: ScheduleModalProps) {
  const [timeLimit, setTimeLimit] = useState('30');
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule - Time Limit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subscription Time Limit (Days)
          </label>
          <div className="mb-4 text-xs p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg">
            <p><strong>Consumer Joined:</strong> Jan 1, 2026</p>
            <p><strong>Current Time:</strong> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-2">Trigger when the subscription time limit is nearing this value.</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
            Cancel
          </button>
          <button onClick={() => onSave({ timeLimit })} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
