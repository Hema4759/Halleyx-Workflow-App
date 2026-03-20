import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Users, MessageSquare, Send, Bell, HelpCircle, CreditCard, Wifi, CheckCircle, Copy, FileText } from 'lucide-react';

interface ConsumerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  amount: number;
  days: number;
  is_internet_enabled: boolean;
  created_at: string;
}

interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  region: string;
  is_internet_active: boolean;
  rent_amount: number;
  is_rent_paid: boolean;
  date_of_rent_paid: string | null;
}

interface Workflow {
  id: string;
  name: string;
  consumer_name: string;
  status: string;
  created_at: string;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState<ConsumerInfo[]>([]);
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'consumers' | 'workflows'>('consumers');
  
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpConsumer, setHelpConsumer] = useState<ConsumerInfo | null>(null);
  const [helpIssueType, setHelpIssueType] = useState('');
  const [helpDescription, setHelpDescription] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchManagerData();
    }
  }, [user]);

  const fetchManagerData = async () => {
    try {
      const consumersRes = await fetch(`http://localhost:5000/workflows/consumers?manager_id=${user?.id}`);
      const consumersData = await consumersRes.json();
      
      if (Array.isArray(consumersData)) {
        setConsumers(consumersData.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          plan: c.selected_plan || 'Not selected',
          amount: c.amount_paid || 0,
          days: 30,
          is_internet_enabled: c.is_internet_active || false,
          created_at: c.created_at
        })));
      }
      
      // Fetch workflows for this manager
      const workflowsRes = await fetch('http://localhost:5000/workflows');
      const workflowsData = await workflowsRes.json();
      
      if (Array.isArray(workflowsData)) {
        const managerWorkflows = workflowsData
          .filter((w: any) => w.creator_id === user?.id)
          .map((w: any) => ({
            id: w.id,
            name: w.name || 'Unnamed Workflow',
            consumer_name: w.consumer_id || 'Unknown',
            status: w.is_active ? 'Active' : 'Inactive',
            created_at: w.created_at
          }));
        setWorkflows(managerWorkflows);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch manager data:', err);
      setLoading(false);
    }
  };

  const handleEnableInternet = async (consumerId: string) => {
    try {
      const res = await fetch('http://localhost:5000/workflows/enable-consumer-internet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id: consumerId,
          manager_id: user?.id
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Internet access enabled for consumer!');
        fetchManagerData();
      } else {
        alert(data.error || 'Failed to enable internet. ' + (data.hint || ''));
      }
    } catch (err) {
      alert('Failed to enable internet');
    }
  };

  const handleRequestInternetFromAdmin = async () => {
    try {
      const res = await fetch('http://localhost:5000/workflows/internet-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: user?.id,
          admin_id: 'admin1'
        })
      });
      
      if (res.ok) {
        alert('Internet request sent to Admin. You will be notified once approved.');
      }
    } catch (err) {
      alert('Failed to send request');
    }
  };

  const handleSubmitRent = async () => {
    const amount = prompt('Enter rent amount to submit:');
    if (!amount) return;
    
    try {
      const res = await fetch('http://localhost:5000/workflows/rent-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: user?.id,
          admin_id: 'admin1',
          rent_amount: parseFloat(amount)
        })
      });
      
      if (res.ok) {
        alert('Rent payment submitted to Admin!');
      }
    } catch (err) {
      alert('Failed to submit rent');
    }
  };

  const handleHelpRequest = async () => {
    if (!helpConsumer || !helpIssueType || !helpDescription) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/workflows/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer_id: helpConsumer.id,
          issue_type: helpIssueType,
          description: helpDescription,
          manager_id: user?.id
        })
      });
      
      if (res.ok) {
        alert('Help response sent to consumer!');
        setShowHelpModal(false);
        setHelpIssueType('');
        setHelpDescription('');
      }
    } catch (err) {
      alert('Failed to send help response');
    }
  };

  const filteredConsumers = consumers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Manager Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Rent Status Badge */}
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              true // TODO: Check actual rent status
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <CreditCard className="w-4 h-4" />
              <span className="font-medium text-sm">Rent: Paid</span>
            </div>
            
            {/* Internet Status */}
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              true // TODO: Check actual internet status
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              <Wifi className="w-4 h-4" />
              <span className="font-medium text-sm">Internet: Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">{consumers.length}</h3>
                <p className="text-xs text-gray-500">Total Consumers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">
                  {consumers.filter(c => c.is_internet_enabled).length}
                </h3>
                <p className="text-xs text-gray-500">Active Connections</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">0</h3>
                <p className="text-xs text-gray-500">Pending Issues</p>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Communicate with Admin */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Communicate with Admin</h3>
                <p className="text-sm text-gray-500">Send rent payment or internet request</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/workflow/new', { 
                  state: { 
                    name: `Admin Communication - ${new Date().toLocaleDateString()}`,
                    autoPopulateTrigger: true,
                    messageReceiveType: 'rent_payment',
                    direction: 'to_admin'
                  } 
                })}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Submit Rent Payment
              </button>
              
              <button 
                onClick={() => navigate('/workflow/new', { 
                  state: { 
                    name: `Internet Request - ${new Date().toLocaleDateString()}`,
                    autoPopulateTrigger: true,
                    messageReceiveType: 'internet_request',
                    direction: 'to_admin'
                  } 
                })}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Wifi className="w-5 h-5" />
                Request Internet Access
              </button>
            </div>
          </div>

          {/* Communicate with Consumers */}
          <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Communicate with Consumers</h3>
                <p className="text-sm text-gray-500">Send plan updates or help responses</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/workflow/new', { 
                  state: { 
                    name: `Consumer Communication - ${new Date().toLocaleDateString()}`,
                    autoPopulateTrigger: true,
                    direction: 'to_consumer'
                  } 
                })}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message to Consumer
              </button>
              
              <button 
                onClick={() => alert('Select a consumer from the list below to send help response')}
                className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Reply to Help Request
              </button>
            </div>
          </div>
        </div>

        {/* Tabs for Consumers and Workflows */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('consumers')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === 'consumers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Consumers ({consumers.length})
              </button>
              <button
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  activeTab === 'workflows'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Copy className="w-4 h-4 inline mr-2" />
                Consumer Workflows ({workflows.length})
              </button>
            </div>
            
            {activeTab === 'consumers' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search consumers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>
          
          {activeTab === 'consumers' ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredConsumers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No consumers found
                </div>
              ) : (
                filteredConsumers.map((consumer) => (
                  <div key={consumer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">
                            {consumer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-white">{consumer.name}</h3>
                          <p className="text-sm text-gray-500">{consumer.email}</p>
                          <p className="text-xs text-gray-400">{consumer.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{consumer.plan}</p>
                          <p className="text-xs text-gray-500">${consumer.amount} / {consumer.days} days</p>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        consumer.is_internet_enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {consumer.is_internet_enabled ? 'Internet Active' : 'No Internet'}
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEnableInternet(consumer.id)}
                          disabled={!true /* TODO: Check rent status */}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            true /* TODO: Check rent status */
                              ? consumer.is_internet_enabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {consumer.is_internet_enabled ? 'Enabled' : 'Enable Internet'}
                        </button>
                        
                        <button 
                          onClick={() => {
                            setHelpConsumer(consumer);
                            setShowHelpModal(true);
                          }}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition"
                        >
                          Help
                        </button>
                        
                        <button 
                          onClick={() => navigate(`/workflow/draft-${consumer.id}`, { 
                            state: { 
                              name: `Consumer: ${consumer.name}`,
                              consumer_id: consumer.id,
                              consumer_name: consumer.name,
                              consumer_email: consumer.email,
                              consumer_phone: consumer.phone,
                              fromNotification: true,
                              autoOpenMessageReceive: true,
                              messageReceiveType: 'payment'
                            } 
                          })}
                          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition"
                        >
                          View Workflow
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-6">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Copy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No workflows created yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((wf) => (
                    <div key={wf.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition cursor-pointer"
                      onClick={() => navigate(`/workflow/${wf.id}`, { state: { 
                        name: wf.name,
                        consumer_id: wf.consumer_name, // This is actually the consumer_id
                        manager_id: user?.id,
                        fromNotification: true
                      } })}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-white truncate">{wf.name}</h4>
                          <p className="text-xs text-gray-500">{wf.consumer_name}</p>
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

      {/* Help Modal */}
      {showHelpModal && helpConsumer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              Send Help to {helpConsumer.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Type</label>
                <select 
                  value={helpIssueType}
                  onChange={(e) => setHelpIssueType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Select issue type</option>
                  <option value="Low Internet Speed">Low Internet Speed</option>
                  <option value="Network Disconnection">Network Disconnection</option>
                  <option value="Billing Issue">Billing Issue</option>
                  <option value="Plan Inquiry">Plan Inquiry</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  value={helpDescription}
                  onChange={(e) => setHelpDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Enter your response to the consumer..."
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleHelpRequest}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Send via SMS/Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
