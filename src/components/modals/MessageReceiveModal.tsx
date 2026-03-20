import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { saveMessageReceive } from '../../store/workflowSlice';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose: () => void;
  onSave?: (data: any) => void;
}

interface DropdownProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ value, options, placeholder = 'Select', onChange }) => {
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
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <span>{opt}</span>
              {value === opt && <Check className="w-4 h-4 text-blue-600" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const MessageReceiveModal: React.FC<Props> = ({ onClose, onSave }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const location = useLocation();
  const messageSendData = useSelector((state: any) => state.workflow.messageSendData) || {};
  
  // Get data from location state (passed from Homepage notification click)
  const locState = (location.state as any) || {};
  const notificationData = locState.notificationData || {};
  const notificationType = locState.notification_type || notificationData.notification_type || '';
  const messageReceiveType = locState.messageReceiveType || notificationType.toLowerCase();
  
  // Consumer details from location state
  const locConsumerName = locState.consumer_name || notificationData.consumer_name || '';
  const locConsumerEmail = locState.consumer_email || notificationData.consumer_email || '';
  const locConsumerPhone = locState.consumer_phone || notificationData.consumer_phone || '';
  const locPlan = locState.plan || notificationData.plan || '';
  const locAmount = locState.amount || notificationData.amount || 0;
  const locDays = locState.days || notificationData.days || 30;
  
  // Manager details for Admin view
  const locManagerId = locState.manager_id || notificationData.manager_id || '';
  const locManagerName = locState.manager_name || notificationData.manager_name || '';
  const locManagerEmail = locState.manager_email || notificationData.manager_email || '';
  const locRentAmount = notificationData.rent_amount || 0;
  const locIsRentPaid = notificationData.is_rent_paid || false;
  
  // Help request details
  const locIssueType = notificationData.issue_type || '';
  const locDescription = notificationData.description || '';
  
  const [channel, setChannel] = useState('SMS');
  
  // Manager state - Consumer Payment Details
  const [consumerName, setConsumerName] = useState(locConsumerName || messageSendData.consumerName || '');
  const [consumerEmail, setConsumerEmail] = useState(locConsumerEmail || '');
  const [consumerPhone, setConsumerPhone] = useState(locConsumerPhone || '');
  const [amount, setAmount] = useState(locAmount?.toString() || messageSendData.amount || '');
  const [plan, setPlan] = useState(locPlan || messageSendData.plan || '');
  const [days, setDays] = useState(locDays?.toString() || messageSendData.days?.toString() || '30');
  const [managerAccessGiven, setManagerAccessGiven] = useState(false);
  
  // Help request state
  const [issueType, setIssueType] = useState(locIssueType || '');
  const [description, setDescription] = useState(locDescription || '');
  
  // Admin state - Manager Rent Validation
  const [regionalManagerName, setRegionalManagerName] = useState(locManagerName || messageSendData.managerName || '');
  const [managerEmail, setManagerEmail] = useState(locManagerEmail || '');
  const [rentAmount, setRentAmount] = useState(locRentAmount?.toString() || '');
  const [isRentPaid, setIsRentPaid] = useState(locIsRentPaid || false);
  const [internetEnabled, setInternetEnabled] = useState(false);
  const [adminDecision, setAdminDecision] = useState<string | null>(null);

  const handleManagerSendToAdmin = async () => {
    if (!consumerName || !plan) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/workflows/internet-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: user?.id,
          admin_id: user?.adminId || 'admin1'
        })
      });
      
      if (res.ok) {
        setManagerAccessGiven(true);
        alert(`Internet Provision Request sent to Admin.\nConsumer: ${consumerName}\nPlan: ${plan}\nAmount: $${amount || 0}`);
      }
    } catch (err) {
      alert('Failed to send request to admin');
    }
  };

  const handleAdminValidate = async (enable: boolean) => {
    if (!regionalManagerName) {
      alert('Please fill manager name');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/workflows/validate-rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager_id: locManagerId || user?.id,
          admin_id: user?.id,
          is_rent_paid: isRentPaid,
          internet_enabled: enable,
          rent_amount: parseFloat(rentAmount) || 500
        })
      });
      
      if (res.ok) {
        setInternetEnabled(enable);
        setAdminDecision(enable ? 'enabled' : 'denied');
        alert(enable 
          ? `Internet Access ENABLED for ${regionalManagerName}. Confirmation sent via SMS/Email.`
          : `Internet Access DENIED for ${regionalManagerName}. Reminder sent via SMS/Email.`
        );
      }
    } catch (err) {
      alert('Failed to validate rent payment');
    }
  };

  const handleSave = () => {
    const data = { 
      roleConfigured: user?.role,
      channel, 
      messageReceiveType,
      consumerName,
      consumerEmail,
      consumerPhone,
      amount, 
      plan, 
      days, 
      regionalManagerName,
      managerEmail,
      rentAmount,
      isRentPaid,
      internetEnabled,
      adminDecision,
      managerAccessGiven,
      issueType,
      description
    };
    dispatch(saveMessageReceive(data));
    onSave?.(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Message Receive Trigger</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {user?.role === 'MANAGER' && (
            <>
              {/* Payment Request Section */}
              {messageReceiveType === 'payment' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">PAYMENT RECEIVED</span>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg">Consumer Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Consumer Name">
                      <input type="text" value={consumerName} onChange={(e) => setConsumerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="John Doe" />
                    </Field>
                    <Field label="Phone Number">
                      <input type="tel" value={consumerPhone} onChange={(e) => setConsumerPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="+1234567890" />
                    </Field>
                  </div>
                  
                  <Field label="Email">
                    <input type="email" value={consumerEmail} onChange={(e) => setConsumerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="john@example.com" />
                  </Field>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Plan Selected">
                      <input type="text" value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Pro Plan" />
                    </Field>
                    <Field label="Amount Paid ($)">
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="40" />
                    </Field>
                    <Field label="Duration (Days)">
                      <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="30" />
                    </Field>
                  </div>
                  
                  <div className="pt-3 border-t border-green-200">
                    <button 
                      onClick={handleManagerSendToAdmin}
                      disabled={managerAccessGiven}
                      className={`w-full py-3 text-sm font-bold rounded-lg transition ${
                        managerAccessGiven 
                          ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {managerAccessGiven ? '✓ Request Sent to Admin' : 'Send Internet Provision Request to Admin'}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Action will be sent to Admin via SMS and Email
                    </p>
                  </div>
                </div>
              )}
              
              {/* Help Request Section */}
              {messageReceiveType === 'help' && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">HELP REQUEST</span>
                  </div>
                  
                  <h3 className="font-bold text-gray-800 text-lg">Consumer Issue Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Consumer Name">
                      <input type="text" value={consumerName} onChange={(e) => setConsumerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="John Doe" />
                    </Field>
                    <Field label="Phone Number">
                      <input type="tel" value={consumerPhone} onChange={(e) => setConsumerPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="+1234567890" />
                    </Field>
                  </div>
                  
                  <Field label="Email">
                    <input type="email" value={consumerEmail} onChange={(e) => setConsumerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="john@example.com" />
                  </Field>
                  
                  <Field label="Issue Type">
                    <input type="text" value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="Low Internet Speed / Network Disconnection" />
                  </Field>
                  
                  <Field label="Issue Description">
                    <textarea 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none" 
                      rows={3}
                      placeholder="Describe the issue..."
                    />
                  </Field>
                  
                  <div className="pt-3 border-t border-orange-200">
                    <button 
                      onClick={() => alert(`Help response sent to consumer via SMS and Email.\n\nConsumer: ${consumerName}\nIssue: ${issueType}\n\nThis help request will be addressed shortly.`)}
                      className="w-full py-3 text-sm font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    >
                      Send Help Response to Consumer
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Response will be sent to Consumer via SMS and Email
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {user?.role === 'ADMIN' && (
            <div className={`border rounded-xl p-5 space-y-4 ${
              notificationType === 'INTERNET_REQUEST' 
                ? isRentPaid 
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' 
                  : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  messageReceiveType === 'internet_request' 
                    ? isRentPaid 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {messageReceiveType === 'internet_request' ? 'INTERNET REQUEST' : 'RENT PAYMENT'}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-800 text-lg">Manager Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="Manager Name">
                  <input type="text" value={regionalManagerName} onChange={(e) => setRegionalManagerName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </Field>
                <Field label="Email">
                  <input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                </Field>
              </div>
              
              <Field label="Rent Amount ($)">
                <input type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" placeholder="500" />
              </Field>
              
              <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                <span className="font-medium text-gray-700">Rent Status:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isRentPaid} 
                    onChange={(e) => setIsRentPaid(e.target.checked)}
                    className="w-5 h-5 rounded text-green-600" 
                  />
                  <span className={`font-medium ${isRentPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {isRentPaid ? 'Rent Paid' : 'Rent Not Paid'}
                  </span>
                </label>
              </div>
              
              {!isRentPaid && (
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ Warning: Internet access requires rent payment.
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-200">
                {adminDecision ? (
                  <div className={`p-4 rounded-lg text-center font-bold ${
                    adminDecision === 'enabled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {adminDecision === 'enabled' 
                      ? '✓ Internet Access Enabled - SMS/Email Sent to Manager'
                      : '✗ Internet Access Denied - SMS/Email Reminder Sent to Manager'}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAdminValidate(true)}
                      disabled={internetEnabled}
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${
                        internetEnabled 
                          ? 'bg-green-200 text-green-700 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {internetEnabled ? '✓ Enabled' : 'Enable Internet'}
                    </button>
                    <button 
                      onClick={() => handleAdminValidate(false)}
                      disabled={adminDecision === 'denied'}
                      className={`flex-1 py-3 text-sm font-bold rounded-lg transition ${
                        adminDecision === 'denied'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {adminDecision === 'denied' ? '✓ Denied' : 'Deny Access'}
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center mt-2">
                  Action will be sent to Manager via SMS and Email
                </p>
              </div>
            </div>
          )}

          {user?.role === 'CONSUMER' && (
            <div className="border p-4 rounded-lg bg-gray-50 border-gray-200 text-center">
              <h3 className="font-bold text-sm text-gray-800 mb-2">Your Subscription Details</h3>
              <div className="text-sm text-gray-600 flex flex-col gap-1">
                <p><span className="font-medium">Selected Plan:</span> {user?.plan || 'Standard Plan'}</p>
                <p><span className="font-medium">Amount:</span> ${user?.rentAmount || '0'} / Mo</p>
                <p><span className="font-medium">Duration:</span> {user?.days || '30'} Days</p>
              </div>
            </div>
          )}

          <Field label="Channel">
            <Dropdown value={channel} options={['SMS', 'Email']} onChange={setChannel} />
          </Field>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Save Trigger
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageReceiveModal;
