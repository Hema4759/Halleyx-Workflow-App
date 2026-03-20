import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Execution {
  id: string;
  workflow_id: string;
  workflow_version: number;
  status: string;
  triggered_by: string;
  started_at: string;
  ended_at: string | null;
  logs: any[];
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExec, setSelectedExec] = useState<Execution | null>(null);

  useEffect(() => {
    // In a real app, this fetches from GET /executions (matching permissions)
    // Simulating dummy data for now
    const dummyExec: Execution[] = [
      {
        id: 'uuid1234',
        workflow_id: 'Expense Approval',
        workflow_version: 3,
        status: 'completed',
        triggered_by: 'user123',
        started_at: '2026-02-18T10:15:23Z',
        ended_at: '2026-02-18T10:20:00Z',
        logs: [
          {
            step_name: 'Manager Approval',
            step_type: 'approval',
            evaluated_rules: [
              { rule: "amount > 100 && country == 'US' && priority == 'High'", result: true }
            ],
            selected_next_step: 'Finance Notification',
            status: 'completed',
            approver_metadata: { user: 'user123' },
            started_at: '2026-02-18T10:15:23Z',
            ended_at: '2026-02-18T10:18:00Z'
          },
          {
            step_name: 'Finance Notification',
            step_type: 'notification',
            evaluated_rules: [],
            selected_next_step: null,
            status: 'completed',
            started_at: '2026-02-18T10:18:00Z',
            ended_at: '2026-02-18T10:20:00Z'
          }
        ]
      },
      {
        id: 'uuid5678',
        workflow_id: 'Employee Onboarding',
        workflow_version: 1,
        status: 'failed',
        triggered_by: 'user456',
        started_at: '2026-02-18T11:00:00Z',
        ended_at: '2026-02-18T11:05:00Z',
        logs: [
           {
             error: "Step not found: Missing IT Provision Step"
           }
        ]
      }
    ];

    setExecutions(dummyExec);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center gap-3 px-6 py-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Audit Logs</h1>
          <p className="text-xs text-gray-400 leading-tight">Track workflow executions</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Executions Table List */}
        <div className="w-2/3 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
           <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
               <thead className="bg-gray-50 dark:bg-gray-700 border-b">
                   <tr>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Execution ID</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Workflow</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Version</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
                       <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                   {executions.map(exec => (
                       <tr key={exec.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer" onClick={() => setSelectedExec(exec)}>
                           <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono">{exec.id.split('-')[0]}</td>
                           <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">{exec.workflow_id}</td>
                           <td className="px-4 py-3 text-sm text-gray-500">v{exec.workflow_version}</td>
                           <td className="px-4 py-3">
                               <span className={`px-2 py-1 text-xs font-medium rounded-full ${exec.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {exec.status.toUpperCase()}
                               </span>
                           </td>
                           <td className="px-4 py-3 text-sm text-blue-600 font-medium hover:underline">View Logs</td>
                       </tr>
                   ))}
               </tbody>
           </table>
        </div>

        {/* Selected Log Sidebar */}
        <div className="w-1/3 p-6 bg-white dark:bg-gray-800 overflow-y-auto">
            {selectedExec ? (
                <div>
                   <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Execution Logs</h2>
                   <p className="text-xs text-gray-500 mb-6">Execution ID: {selectedExec.id}</p>
                   
                   <div className="space-y-6">
                       {selectedExec.logs.map((log, idx) => (
                           <div key={idx} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                               <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${log.error ? 'bg-red-500' : 'bg-green-500'}`}></div>
                               
                               {log.error ? (
                                   <div>
                                       <h3 className="font-semibold text-red-600 text-sm">Error Failure</h3>
                                       <p className="text-xs text-gray-700 dark:text-gray-400 mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{log.error}</p>
                                   </div>
                               ) : (
                                   <div>
                                       <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{log.step_name} <span className="text-xs text-gray-500 font-normal">({log.step_type})</span></h3>
                                       
                                       {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                                           <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs text-gray-600 dark:text-gray-300 font-mono overflow-x-auto">
                                               Rules evaluated: {JSON.stringify(log.evaluated_rules)}
                                           </div>
                                       )}
                                       
                                       <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                           <p><strong>Next Step:</strong> {log.selected_next_step || 'None (Completed)'}</p>
                                           <p><strong>Status:</strong> {log.status}</p>
                                           {log.approver_metadata && <p><strong>Approver:</strong> {JSON.stringify(log.approver_metadata)}</p>}
                                       </div>
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Select an execution to view logs
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
