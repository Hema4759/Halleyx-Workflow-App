import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit, SlidersHorizontal,
  ChevronUp, ChevronDown, MoreVertical, ChevronsUpDown,
} from 'lucide-react';
import {
  selectWorkflows, addWorkflow, deleteWorkflow, updateWorkflow, setWorkflows, Workflow,
} from '../store/workflowSlice';
import { AppDispatch } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell } from 'recharts';

const PAGE_SIZE = 9;

// ── Status badge ──────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Closed: 'bg-red-100 text-red-600',
    Started: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ── Three-dot row menu ────────────────────────────────
const RowMenu: React.FC<{
  workflowId: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit className="w-3.5 h-3.5 text-gray-500" />
            Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────
interface ConsumerRequest {
  id: string;
  type: string;
  consumer_id: string;
  consumer_name: string;
  consumer_email: string;
  consumer_phone?: string;
  plan: string;
  status: string;
  created_at: string;
  metadata?: any;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const workflows = useSelector(selectWorkflows) as Workflow[];

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [consumerRequests, setConsumerRequests] = useState<ConsumerRequest[]>([]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, gb: string, price: string, amount: number} | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Help modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpIssueType, setHelpIssueType] = useState('');
  const [helpDescription, setHelpDescription] = useState('');
  
  // Admin notifications
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  
  // Consumer notifications for plan expiry
  const [consumerNotifications, setConsumerNotifications] = useState<AdminNotification[]>([]);

  // Fetch from Backend
  useEffect(() => {
    const url = user?.role === 'MANAGER' && user.id
      ? `http://localhost:5000/workflows?manager_id=${user.id}`
      : 'http://localhost:5000/workflows';
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: Workflow[] = data.map((w: any) => ({
            id: w.id,
            name: w.name || 'Untitled',
            createdBy: w.creator_id || 'System',
            status: w.is_active ? 'Active' : 'Draft',
            actions: [],
            createdAt: w.created_at || new Date().toISOString(),
            consumer_id: w.consumer_id
          }));
          dispatch(setWorkflows(mapped));
        }
      })
      .catch((err) => console.error('Failed to load workflows', err));
  }, [dispatch, user]);

  // Fetch consumer payment notifications for manager
  useEffect(() => {
    if (user?.role === 'MANAGER' && user.id) {
      fetch(`http://localhost:5000/workflows/notifications?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const requests: ConsumerRequest[] = data
              .filter((n: any) => n.type === 'PAYMENT' || n.type === 'HELP')
              .map((n: any) => ({
                id: n.id,
                type: n.type,
                consumer_id: n.sender_id,
                consumer_name: n.metadata?.consumer_name || 'Unknown',
                consumer_email: n.metadata?.consumer_email || '',
                consumer_phone: n.metadata?.consumer_phone || '',
                plan: n.metadata?.plan || '',
                status: 'Pending',
                created_at: n.created_at,
                metadata: n.metadata
              }));
            setConsumerRequests(requests);
          }
        })
        .catch(err => console.error('Failed to load consumer requests', err));
    }
  }, [user]);

  // Fetch admin notifications
  useEffect(() => {
    if (user?.role === 'ADMIN' && user.id) {
      fetch(`http://localhost:5000/workflows/notifications?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAdminNotifications(data);
          }
        })
        .catch(err => console.error('Failed to load admin notifications', err));
    }
  }, [user]);

  // ── Filtering + sorting ──────────────────────────────
  const filtered = workflows
    .filter((w) => w.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortAsc
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
    );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));

  // ── Validation ───────────────────────────────────────
  const validate = (name: string): boolean => {
    if (!name.trim()) { setNameError('Workflow name is required'); return false; }
    if (name.length > 25) { setNameError('Max 25 characters'); return false; }
    if (/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]+/.test(name)) { setNameError('No special characters'); return false; }
    if (workflows.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
      setNameError('Name already exists'); return false;
    }
    setNameError(''); return true;
  };

  const handleAdd = () => {
    if (!validate(newName)) return;
    const wfId = `draft-${Date.now()}`;
    const wf: Workflow = {
      id: wfId,
      name: newName.trim(),
      createdBy: user?.name || 'You',
      status: 'Draft',
      actions: [],
      createdAt: new Date().toISOString(),
    };
    dispatch(addWorkflow(wf));
    setNewName('');
    setShowAddModal(false);
    navigate(`/workflow/${wfId}`, { state: { name: wf.name, isDraft: true } });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this workflow?')) {
      try {
        await fetch(`http://localhost:5000/workflows/${id}`, { method: 'DELETE' });
      } catch(e) {}
      dispatch(deleteWorkflow(id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = paginated.length > 0 && paginated.every((w) => selectedIds.has(w.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); paginated.forEach((w) => n.delete(w.id)); return n; });
    } else {
      setSelectedIds((prev) => { const n = new Set(prev); paginated.forEach((w) => n.add(w.id)); return n; });
    }
  };

  // Quick stats mock data
  const planStats = [
    { name: 'Basic Plan', value: 400 },
    { name: 'Pro Plan', value: 300 },
    { name: 'Enterprise', value: 300 },
    { name: 'Free Tier', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderDashboardWidgets = () => {
    if (user?.role === 'ADMIN') {
      return (
         <div className="grid grid-cols-2 gap-4 px-6 py-4">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Managers Overview</h3>
                <p className="text-sm text-gray-500 mb-2">Total Subscribed: 1200 across all circles</p>
                <div className="flex-1 overflow-auto mt-2 border border-gray-200 rounded-lg">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-2 border-b">Manager Name</th>
                                <th className="px-3 py-2 border-b">Region</th>
                                <th className="px-3 py-2 border-b">Consumers in Circle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                            <tr>
                                <td className="px-3 py-2 font-medium">Regional Manager 1</td>
                                <td className="px-3 py-2">North America</td>
                                <td className="px-3 py-2 text-blue-600 font-bold">450</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-medium">Regional Manager 2</td>
                                <td className="px-3 py-2">Europe</td>
                                <td className="px-3 py-2 text-blue-600 font-bold">320</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2 font-medium">Regional Manager 3</td>
                                <td className="px-3 py-2">Asia Pacific</td>
                                <td className="px-3 py-2 text-blue-600 font-bold">430</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
             </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                 <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Admin Controls & Rules</h3>
                 
                 <div className="flex-1 overflow-auto mt-2 border border-gray-200 rounded-lg">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-3 py-2 border-b">Priority</th>
                                <th className="px-3 py-2 border-b">Condition</th>
                                <th className="px-3 py-2 border-b">Next Step</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                            <tr>
                                <td className="px-3 py-2">1</td>
                                <td className="px-3 py-2 font-mono text-[10px] bg-gray-50">amount {'>'} 100 && country == 'US' && priority == 'High'</td>
                                <td className="px-3 py-2 whitespace-nowrap">Finance Notification</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2">2</td>
                                <td className="px-3 py-2 font-mono text-[10px] bg-gray-50">amount {'<='} 100</td>
                                <td className="px-3 py-2 whitespace-nowrap">Task Rejection</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2">3</td>
                                <td className="px-3 py-2 font-mono text-[10px] bg-gray-50">priority == 'Low' && country != 'US'</td>
                                <td className="px-3 py-2 whitespace-nowrap">Task Rejection</td>
                            </tr>
                            <tr>
                                <td className="px-3 py-2">4</td>
                                <td className="px-3 py-2 font-mono text-[10px] bg-gray-50">DEFAULT</td>
                                <td className="px-3 py-2 whitespace-nowrap">Task Rejection</td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
                 
                 <div className="mt-4 flex justify-between items-center">
                   <div className="flex gap-2">
                     <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Audit Plan Requests</button>
                     <button className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Message Managers</button>
                   </div>
                   
                   <div className="relative group">
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 font-medium rounded-lg text-sm hover:bg-red-100 relative">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Notifications ({adminNotifications.length})
                      </button>
                       <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 shadow-xl rounded-xl p-3 hidden group-hover:block z-50 max-h-96 overflow-y-auto">
                        {adminNotifications.length === 0 ? (
                          <div className="p-3 text-center text-gray-500 text-sm">No pending requests</div>
                        ) : (
                          adminNotifications.map((notif) => {
                            const isInternetReq = notif.type === 'INTERNET_REQUEST';
                            const isRentPaid = notif.metadata?.is_rent_paid;
                            
                            return (
                              <div 
                                key={notif.id}
                                className={`p-4 rounded-lg cursor-pointer border mb-3 last:mb-0 transition ${
                                  isInternetReq 
                                    ? isRentPaid 
                                      ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' 
                                      : 'bg-red-50 border-red-200 hover:bg-red-100'
                                    : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                                }`}
                                onClick={() => {
                                  navigate(`/workflow/draft-${notif.id}`, { 
                                    state: { 
                                      name: notif.metadata?.manager_name || 'Manager Request',
                                      isDraft: true,
                                      notification_type: notif.type,
                                      notificationData: notif.metadata,
                                      fromNotification: true,
                                      manager_id: notif.metadata?.manager_id,
                                      manager_name: notif.metadata?.manager_name,
                                      manager_email: notif.metadata?.manager_email,
                                      autoOpenMessageReceive: true,
                                      messageReceiveType: notif.type === 'INTERNET_REQUEST' ? 'internet_request' : 'rent_payment'
                                    } 
                                  });
                                }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                    isInternetReq 
                                      ? isRentPaid 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {isInternetReq ? 'INTERNET REQUEST' : 'RENT REQUEST'}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {new Date(notif.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-800 mb-1">{notif.metadata?.manager_name || 'Unknown Manager'}</h4>
                                <p className="text-[11px] text-gray-600 mb-1">📧 {notif.metadata?.manager_email || 'N/A'}</p>
                                {isInternetReq && (
                                  <>
                                    <p className="text-[11px] text-gray-600 mb-1">💰 Rent: ${notif.metadata?.rent_amount || 0}</p>
                                    <p className="text-[11px] font-medium mb-2">
                                      Status: {isRentPaid ? '✅ Rent Paid' : '❌ Rent Not Paid'}
                                    </p>
                                    {!isRentPaid && (
                                      <p className="text-[10px] text-red-600 font-medium">⚠️ Internet cannot be enabled</p>
                                    )}
                                  </>
                                )}
                                <div className="mt-2 flex justify-end">
                                  <span className="text-[11px] font-semibold text-blue-600">Click to Review →</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                 </div>
             </div>
         </div>
      );
    }
    
    if (user?.role === 'MANAGER') {
      return (
        <div className="px-6 py-4">
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Manager Dashboard</h2>
              <p className="text-sm text-gray-500">You have {consumerRequests.length} consumer requests</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  const rentAmount = prompt('Enter rent amount to submit:');
                  if (!rentAmount || !user.id) return;
                  try {
                    const res = await fetch('http://localhost:5000/workflows/rent-request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        manager_id: user.id,
                        admin_id: user.adminId || 'admin1',
                        rent_amount: parseFloat(rentAmount)
                      })
                    });
                    if (res.ok) alert('Rent payment request sent to admin!');
                  } catch (err) { alert('Failed to send rent request'); }
                }}
                className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 shadow-sm">
                Submit Rent Payment
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('http://localhost:5000/workflows/internet-request', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        manager_id: user.id,
                        admin_id: user.adminId || 'admin1'
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      if (data.is_rent_paid) {
                        alert('Internet access request sent to admin! Your rent is paid.');
                      } else {
                        alert('Internet access request sent. Note: Your rent is pending.');
                      }
                    }
                  } catch (err) { alert('Failed to send internet request'); }
                }}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 shadow-sm">
                Request Internet Access
              </button>
            </div>
            
            <div className="relative group">
               <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg text-sm hover:bg-red-100 relative shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Notifications ({consumerRequests.length})
               </button>
               <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-xl p-3 hidden group-hover:block z-50 max-h-96 overflow-y-auto">
                  {consumerRequests.length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">No pending requests</div>
                  ) : (
                    consumerRequests.map((request) => (
                      <div 
                        key={request.id}
                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition shadow-sm mb-3 last:mb-0"
                        onClick={() => {
                          navigate(`/workflow/draft-${request.consumer_id}`, { 
                            state: { 
                              name: request.consumer_name, 
                              isDraft: true,
                              consumer_id: request.consumer_id,
                              consumer_name: request.consumer_name,
                              consumer_email: request.consumer_email,
                              consumer_phone: request.metadata?.consumer_phone || '',
                              notification_type: request.type,
                              fromNotification: true,
                              autoOpenMessageReceive: true,
                              messageReceiveType: request.type === 'PAYMENT' ? 'payment' : 'help',
                              plan: request.plan,
                              amount: request.metadata?.amount || 0,
                              days: request.metadata?.days || 30
                            } 
                          });
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded ${request.type === 'PAYMENT' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {request.type === 'PAYMENT' ? 'PAYMENT RECEIVED' : 'HELP REQUEST'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(request.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 mb-1">{request.consumer_name}</h4>
                        <p className="text-[11px] text-gray-600 mb-1">📧 {request.consumer_email}</p>
                        <p className="text-[11px] text-gray-600 mb-2">📋 Plan: {request.plan || 'Not specified'}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-semibold text-blue-600">Click to Process →</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">PENDING</span>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>
      );
    }
    if (user?.role === 'CONSUMER') {
        const plans = [
          { id: '1', name: 'Basic Plan', gb: '50GB', price: '$20/mo', amount: 20 },
          { id: '2', name: 'Pro Plan', gb: '100GB', price: '$40/mo', amount: 40 },
          { id: '3', name: 'Enterprise Plan', gb: 'Unlimited', price: '$80/mo', amount: 80 }
        ];

        const handlePayAmount = async () => {
          if (!selectedPlan || !paymentAmount) {
            alert('Please select a plan and enter amount');
            return;
          }
          
          console.log('User data:', user);
          console.log('Manager ID:', user?.managerId);
          
          if (!user?.managerId || !user?.id) {
            alert('Error: Consumer not properly registered with a manager\n\nUser ID: ' + user?.id + '\nManager ID: ' + user?.managerId);
            return;
          }
          
          setIsProcessing(true);
          try {
            const res = await fetch('http://localhost:5000/workflows/payment-request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consumer_id: user.id,
                plan: selectedPlan.name,
                amount: parseFloat(paymentAmount),
                days: 30,
                manager_id: user.managerId
              })
            });
            
            const data = await res.json();
            console.log('Response:', data);
            
            if (res.ok) {
              alert(`Payment request sent successfully!\n\nPlan: ${selectedPlan.name}\nAmount: $${paymentAmount}\nDays: 30`);
              setShowPaymentModal(false);
              setPaymentAmount('');
              setSelectedPlan(null);
            } else {
              alert(`Failed to send payment request: ${data.error || 'Unknown error'}`);
            }
          } catch (err: any) {
            console.error('Payment error:', err);
            alert(`Error: ${err?.message || err?.error || 'Unknown error'}`);
          }
          setIsProcessing(false);
        };

        const handleHelpRequest = async () => {
          if (!helpIssueType || !helpDescription || !user?.managerId || !user?.id) return;
          
          setIsProcessing(true);
          try {
            const res = await fetch('http://localhost:5000/workflows/help-request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consumer_id: user.id,
                issue_type: helpIssueType,
                description: helpDescription,
                manager_id: user.managerId
              })
            });
            
            if (res.ok) {
              alert('Help request sent to manager!');
              setShowHelpModal(false);
              setHelpIssueType('');
              setHelpDescription('');
            }
          } catch (err) {
            alert('Failed to send help request');
          }
          setIsProcessing(false);
        };

        return (
          <>
            <div className="px-6 py-4">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Your Subscription</h2>
                    <p className="text-gray-600 dark:text-gray-400">Current Plan: <strong>No Active Plan</strong></p>
                  </div>
                  <button 
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 border shadow-sm flex items-center gap-2"
                    onClick={() => setShowHelpModal(true)}>
                    <span className="text-lg">❓</span> Help & Support
                  </button>
                </div>
                
                {/* Plan Expiry Warning Banner */}
                {consumerNotifications.some(n => n.metadata?.plan_expiry_days <= 2) && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-yellow-800">Plan Expiring Soon!</h4>
                        <p className="text-sm text-yellow-700">Your plan will expire within 2 days. Please renew to continue service.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm mb-4">Select a plan below to get started</p>
                
                <div className="mt-4 mb-4">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((p) => (
                      <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-500 transition flex flex-col shadow-sm">
                        <h4 className="font-semibold text-gray-800">{p.name}</h4>
                        <div className="text-sm text-gray-500 my-2">{p.gb} - {p.price}</div>
                        <button className="mt-auto w-full py-1.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-sm"
                          onClick={() => {
                            setSelectedPlan(p);
                            setShowPaymentModal(true);
                          }}>
                          Pay Amount
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 border shadow-sm flex items-center gap-2" 
                      onClick={() => setShowHelpModal(true)}>
                      <span>📞</span> Report an Issue
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 border shadow-sm flex items-center gap-2">
                      <span>📊</span> View Usage
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 border shadow-sm flex items-center gap-2">
                      <span>📋</span> Plan Details
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedPlan && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">Pay for {selectedPlan.name}</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plan: {selectedPlan.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Data: {selectedPlan.gb}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Price: {selectedPlan.price}</p>
                    <label className="block text-sm font-medium mb-2">Enter Amount Paid</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Enter ${selectedPlan.amount}`}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); }}
                      className="flex-1 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayAmount}
                      disabled={isProcessing || !paymentAmount}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Sending...' : 'Send Payment Request'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Modal */}
            {showHelpModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">Report an Issue</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Issue Type</label>
                    <select
                      value={helpIssueType}
                      onChange={(e) => setHelpIssueType(e.target.value)}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Select issue type...</option>
                      <option value="Low Internet Speed">Low Internet Speed</option>
                      <option value="Network Disconnection">Network Disconnection</option>
                      <option value="Billing Issue">Billing Issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={helpDescription}
                      onChange={(e) => setHelpDescription(e.target.value)}
                      placeholder="Describe your issue..."
                      rows={4}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowHelpModal(false); setHelpIssueType(''); setHelpDescription(''); }}
                      className="flex-1 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleHelpRequest}
                      disabled={isProcessing || !helpIssueType || !helpDescription}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing ? 'Sending...' : 'Send Help Request'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
    }
    return null; // Manager sees standard workflow view mainly
  };

  // ── Pagination page numbers ───────────────────────────
  const pageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    if (currentPage >= totalPages - 3) return [1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">

      {/* ── Page header ── */}
      <header className="flex items-center gap-3 px-6 py-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          W
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Workflow</h1>
          <p className="text-xs text-gray-400 leading-tight">Here's an overview of your workflows</p>
        </div>
      </header>

      {/* ── Search / actions bar ── */}
      {user?.role !== 'CONSUMER' && (
        <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1 leading-4">⌘K</span>
          </div>

          {/* Filters */}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* Add Workflow (Hidden for consumers, and limited to 1 per user) */}
        {user?.role !== 'CONSUMER' && workflows.length === 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Workflow
          </button>
        )}    {/* Three-dot header menu */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {renderDashboardWidgets()}

      {/* ── Table (Only show for MANAGER or if we decide to show consumer their flows) ── */}
      {user?.role !== 'CONSUMER' && (
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* Table head */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300 dark:border-gray-500 text-blue-600"
              />
            </div>
            <div className="col-span-4 flex items-center gap-1 cursor-pointer select-none" onClick={() => setSortAsc(!sortAsc)}>
              Workflow Name
              <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="col-span-4">Created By</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 flex justify-end">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Table body */}
          {paginated.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <p className="text-base font-medium">{searchTerm ? 'No workflows found' : 'No workflows yet'}</p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Create Your First Workflow
                </button>
              )}
            </div>
          ) : (
            paginated.map((workflow) => (
              <div
                key={workflow.id}
                className="grid grid-cols-12 gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 items-center group transition-colors"
              >
                {/* Checkbox */}
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(workflow.id)}
                    onChange={() => toggleSelect(workflow.id)}
                    className="rounded border-gray-300 dark:border-gray-500 text-blue-600"
                  />
                </div>

                {/* Name */}
                <div
                  className="col-span-4 text-sm font-medium text-gray-800 dark:text-white cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/workflow/${workflow.id}`, { state: { name: workflow.name } })}
                >
                  {workflow.name}
                </div>

                {/* Created By */}
                <div className="col-span-4 text-sm text-gray-500 dark:text-gray-400">
                  {workflow.createdBy}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <StatusBadge status={workflow.status} />
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  <RowMenu
                    workflowId={workflow.id}
                    onEdit={() => navigate(`/workflow/${workflow.id}`, { state: { name: workflow.name } })}
                    onDelete={() => handleDelete(workflow.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="w-8 text-center text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition ${currentPage === p
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
      )}

      {/* ── Add Workflow Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            {/* Header */}
            <div className="relative flex flex-col items-center px-6 pt-6 pb-4">
              {/* X close */}
              <button
                onClick={() => { setShowAddModal(false); setNewName(''); setNameError(''); }}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Purple avatar */}
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md">
                W
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add Workflow</h3>
              <p className="text-xs text-gray-400 mt-1 text-center">This is a sample for subheading.</p>
            </div>

            {/* Body */}
            <div className="px-6 pb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Workflow Name
              </label>
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (nameError) validate(e.target.value); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Type segment name"
                maxLength={25}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder-gray-400"
              />
              {nameError && <p className="text-xs text-red-500 mt-1.5">{nameError}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowAddModal(false); setNewName(''); setNameError(''); }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !!nameError}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;