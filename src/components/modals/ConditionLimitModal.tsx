import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ConditionLimitModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const data = [
  { name: 'Jan', internetUsed: 10, amountPaid: 100 },
  { name: 'Feb', internetUsed: 30, amountPaid: 100 },
  { name: 'Mar', internetUsed: 45, amountPaid: 100 },
  { name: 'Apr', internetUsed: 60, amountPaid: 100 },
  { name: 'May', internetUsed: 85, amountPaid: 100 },
];

export default function ConditionLimitModal({ onClose, onSave }: ConditionLimitModalProps) {
  const [limitThreshold, setLimitThreshold] = useState('80');
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Limit Condition (Current Plan)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Statistical data of Amount Paid and Internet Used
          </p>
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="amountPaid" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Amount Paid ($)" />
                <Area type="monotone" dataKey="internetUsed" stroke="#ffc658" fill="#ffc658" fillOpacity={0.5} name="Internet Used (GB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Condition Threshold (%) :
            </label>
            <input
              type="number"
              value={limitThreshold}
              onChange={(e) => setLimitThreshold(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
            Cancel
          </button>
          <button onClick={() => onSave({ limitThreshold, type: "Limit Condition" })} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
