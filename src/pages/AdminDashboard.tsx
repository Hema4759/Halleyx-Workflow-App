import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Users, MessageSquare, Send, Bell, CreditCard, Wifi, CheckCircle, XCircle, AlertTriangle, Copy, FileText } from 'lucide-react';

interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  region: string;
  is_internet_active: boolean;
  rent_amount: number;
  is_rent_paid: boolean;
  date_of_rent_paid: string | null;
  consumers_count: number;
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  sender_name: string;
  created_at: string;
}

interface Workflow {
  id: string;
  name: string;
  manager_name: string;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState<ManagerInfo[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState<ManagerInfo | null>(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentAmount, setRentAmount] = useState('500');
  const [isRentPaid, setIsRentPaid] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [activeTab, setActiveTab] = useState<'managers' | 'workflows'>('managers');

  useEffect(() => {
    if (user?.id) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const managersRes = await fetch('http://localhost:5000/workflows/managers');
      const managersData = await managersRes.json();
      
      if (Array.isArray(managersData)) {
        const managersWithCounts = await Promise.all(managersData.map(async (m: any) => {
          const consumersRes = await fetch(`http://localhost:5000/workflows/consumers?manager_id=${m.id}`);
          const consumers = await consumersRes.json();
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            region: m.phone || 'Unknown',
            is_internet_active: m.is_internet_active || false,
            rent_amount: m.rent_amount || 0,
            is_rent_paid: m.date_of_rent_paid !== null,
            date_of_rent_paid: m.date_of_rent_paid,
            consumers_count: Array.isArray(consumers) ? consumers.length : 0
          } as ManagerInfo;
        }));
        setManagers(managersWithCounts);
      }
      
      const workflowsRes = await fetch('http://localhost:5000/workflows');
      const workflowsData = await workflowsRes.json();
      
      if (Array.isArray(workflowsData)) {
        setWorkflows(workflowsData.map((w: any) => ({
          id: w.id,
          name: w.name || 'Unnamed Workflow',
          manager_name: w.creator_id || 'Unknown',
          status: w.is_active ? 'Active' : 'Inactive',
          created_at: w.created_at
        })));
      }
      
      const notifRes = await fetch(`http://localhost:5000/workflows/notifications?user_id=${user?.id}`);
      const notifData = await notifRes.json();
      
      if (Array.isArray(notifData)) {
        setNotifications(notifData.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          metadata: n.metadata,
          sender_name: n.metadata?.manager_name || 'Unknown',
          created_at: n.created_at
        })));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setLoading(false);
    }
  };

  const handleValidateRent = async () => {
    if (!selectedManager) return;
    
    try {
      const res = await fetch('http://localhost:5000/workflows/validate-rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: selectedManager.id,
          admin_id: user?.id,
          is_rent_paid: isRentPaid,
          internet_enabled: isRentPaid,
          rent_amount: parseFloat(rentAmount) || 500
        })
      });
      
      if (res.ok) {
        alert(isRentPaid 
          ? `Internet access enabled for ${selectedManager.name}. Manager can now provide internet to consumers.`
          : `Rent validation recorded for ${selectedManager.name}. Internet access denied.`
        );
        setShowRentModal(false);
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to validate rent');
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName) {
      alert('Please enter a workflow name');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkflowName,
          creator_id: user?.id,
          input_schema: { region: selectedRegion, type: 'admin_created', created_for: 'manager' },
          is_active: true
        })
      });
      
      if (res.ok) {
        alert('Workflow created successfully!');
        setShowWorkflowModal(false);
        setNewWorkflowName('');
        setSelectedRegion('');
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to create workflow');
    }
  };

  const filteredManagers = managers.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingNotifications = notifications.filter(n => 
    n.type === 'INTERNET_REQUEST' || n.type === 'RENT_REQUEST'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">System Overview & Management</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowWorkflowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
            
            <div className="relative">
              <button 
                onClick={() => document.getElementById('notifications-panel')?.classList.toggle('hidden')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 relative"
              >
                <Bell className="w-4 h-4" />
                <span className="font-medium text-sm">Pending: {pendingNotifications.length}</span>
                {pendingNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingNotifications.length}
                  </span>
                )}
              </button>
              
              <div id="notifications-panel" className="hidden absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">Pending Requests</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pendingNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No pending requests</div>
                  ) : (
                    pendingNotifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          document.getElementById('notifications-panel')?.classList.add('hidden');
                          navigate(`/workflow/draft-${notif.id}`, {
                            state: {
                              name: `Manager: ${notif.sender_name}`,
                              autoPopulateTrigger: true,
                              messageReceiveType: notif.type === 'INTERNET_REQUEST' ? 'internet_request' : 'rent_payment',
                              manager_id: notif.metadata?.manager_id,
                              manager_name: notif.sender_name,
                              manager_email: notif.metadata?.manager_email,
                              fromNotification: true
                            }
                          });
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            notif.type === 'INTERNET_REQUEST' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {notif.type === 'INTERNET_REQUEST' ? 'INTERNET' : 'RENT'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-gray-800">{notif.sender_name}</p>
                        <p className="text-xs text-gray-500">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{managers.length}</h3>
                <p className="text-xs text-gray-500">Total Managers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {managers.filter(m => m.is_rent_paid).length}
                </h3>
                <p className="text-xs text-gray-500">Rent Paid</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {managers.filter(m => !m.is_rent_paid).length}
                </h3>
                <p className="text-xs text-gray-500">Rent Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {managers.filter(m => m.is_internet_active).length}
                </h3>
                <p className="text-xs text-gray-500">Internet Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Communicate with Managers</h3>
              <p className="text-sm text-gray-500">Send rent reminders, internet decisions, or plan updates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/workflow/new', { 
                state: { name: `Rent Reminder - ${new Date().toLocaleDateString()}`, autoPopulateTrigger: true, messageReceiveType: 'rent_reminder', direction: 'to_manager' } 
              })}
              className="py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Rent Payment Reminder
            </button>
            
            <button 
              onClick={() => navigate('/workflow/new', { 
                state: { name: `Internet Decision - ${new Date().toLocaleDateString()}`, autoPopulateTrigger: true, messageReceiveType: 'internet_decision', direction: 'to_manager' } 
              })}
              className="py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Wifi className="w-5 h-5" />
              Internet Access Decision
            </button>
            
            <button 
              onClick={() => navigate('/workflow/new', { 
                state: { name: `Plan Update - ${new Date().toLocaleDateString()}`, autoPopulateTrigger: true, messageReceiveType: 'plan_update', direction: 'to_manager' } 
              })}
              className="py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Plan Update Notification
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('managers')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === 'managers' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Managers ({managers.length})
              </button>
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === 'workflows' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Copy className="w-4 h-4 inline mr-2" />
                Manager Workflows ({workflows.length})
              </button>
            </div>
            
            {activeTab === 'managers' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search managers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>
          
          {activeTab === 'managers' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredManagers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No managers found</td>
                    </tr>
                  ) : (
                    filteredManagers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold">{manager.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">{manager.name}</p>
                              <p className="text-xs text-gray-500">{manager.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            manager.region === 'India' ? 'bg-orange-100 text-orange-700' :
                            manager.region === 'US' ? 'bg-blue-100 text-blue-700' :
                            manager.region === 'Europe' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {manager.region}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                            manager.is_rent_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {manager.is_rent_paid ? (
                              <><CheckCircle className="w-3 h-3" /> Paid ${manager.rent_amount}</>
                            ) : (
                              <><AlertTriangle className="w-3 h-3" /> Pending</>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                            manager.is_internet_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Wifi className="w-3 h-3" />
                            {manager.is_internet_active ? 'Active' : 'Inactive'}
                          </div>
                          {!manager.is_rent_paid && manager.is_internet_active && (
                            <p className="text-xs text-red-500 mt-1">Cannot serve consumers</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800 dark:text-white">{manager.consumers_count}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setSelectedManager(manager);
                                setRentAmount(manager.rent_amount?.toString() || '500');
                                setIsRentPaid(manager.is_rent_paid);
                                setShowRentModal(true);
                              }}
                              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition"
                            >
                              Validate Rent
                            </button>
                            <button 
                              onClick={() => navigate(`/workflow/draft-${manager.id}`, { 
                                state: { name: `Manager: ${manager.name}`, manager_id: manager.id, manager_name: manager.name, manager_email: manager.email, fromNotification: true, autoOpenMessageReceive: true, messageReceiveType: 'internet_request' } 
                              })}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition"
                            >
                              View Workflow
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Copy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No workflows created yet</p>
                  <button onClick={() => setShowWorkflowModal(true)} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create First Workflow
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                      onClick={() => navigate(`/workflow/${wf.id}`, { state: { name: wf.name } })}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-white truncate">{wf.name}</h4>
                          <p className="text-xs text-gray-500">{wf.manager_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          wf.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {wf.status}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(wf.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRentModal && selectedManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Validate Rent for {selectedManager.name}
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800"><strong>Region:</strong> {selectedManager.region}</p>
                <p className="text-sm text-blue-800"><strong>Email:</strong> {selectedManager.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rent Amount ($)</label>
                <input 
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRentPaid} onChange={(e) => setIsRentPaid(e.target.checked)} className="w-5 h-5 rounded text-green-600" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Rent Paid</span>
                </label>
              </div>
              
              {!isRentPaid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ Internet access will be disabled. Manager cannot provide internet to consumers until rent is paid.
                </div>
              )}
              
              {isRentPaid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✅ Manager will be able to provide internet to consumers after enabling.
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRentModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={handleValidateRent}
                  className={`flex-1 py-2 rounded-lg text-white ${isRentPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isRentPaid ? 'Enable Internet' : 'Deny Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Create Manager Workflow</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Workflow Name</label>
                <input 
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
                <select 
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Select region</option>
                  <option value="India">India</option>
                  <option value="US">US</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowWorkflowModal(false); setNewWorkflowName(''); setSelectedRegion(''); }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button onClick={handleCreateWorkflow} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
