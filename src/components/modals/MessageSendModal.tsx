import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check, Upload } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { saveMessageSend } from '../../store/workflowSlice';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onClose: () => void;
  onSave?: (data: any) => void;
}

// ── Data ──────────────────────────────────────────────────────────
const CHANNELS = ['SMS', 'Email'];
const FROM_OPTIONS = ['Manager Email', 'Manager Phone Number'];
const TO_OPTIONS = ['Selected Workflow Person (Consumer)'];
const RECIPIENT_OPTS = ['Selected Workflow Person (Consumer)'];
const TEMPLATE_OPTS = ['Amount Received Detail', 'Access Limit', 'Deadline Alert'];
const SEND_TO_OPTS = ['Selected Workflow Person (Consumer)'];
const VAR_TYPE_OPTS = ['Dynamic', 'Static'];
const DYN_VAL_OPTS = ['First Name', 'Last Name', 'Email', 'Phone'];
const STA_VAL_OPTS = ['Customer', 'Default', 'Custom'];

// ── Reusable Dropdown ─────────────────────────────────────────────
interface DropdownProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  small?: boolean;
}
const Dropdown: React.FC<DropdownProps> = ({
  value, options, placeholder = 'Select', onChange, small,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${small ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
        <ChevronDown className={`flex-shrink-0 text-gray-400 ${small ? 'w-3 h-3' : 'w-4 h-4'}`} />
      </button>
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
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

// ── Toggle switch ─────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; }
const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
  >
    <span className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

// ── Field wrapper ─────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
    <p className="text-xs text-gray-400">This is a hint text to help user.</p>
  </div>
);

// ── Body variable row ─────────────────────────────────────────────
interface VarRow { type: string; value: string; }
const BodyVarRow: React.FC<{
  index: number;
  row: VarRow;
  onChange: (index: number, row: VarRow) => void;
}> = ({ index, row, onChange }) => {
  const valueOpts = row.type === 'Dynamic' ? DYN_VAL_OPTS : row.type === 'Static' ? STA_VAL_OPTS : [];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-gray-600 w-10 flex-shrink-0">
        {`{{${index + 1}}}`}
      </span>
      <div className="w-28 flex-shrink-0">
        <Dropdown
          value={row.type}
          options={VAR_TYPE_OPTS}
          placeholder="Select"
          small
          onChange={(v) => onChange(index, { ...row, type: v, value: '' })}
        />
      </div>
      <div className="flex-1">
        {valueOpts.length > 0 ? (
          <Dropdown
            value={row.value}
            options={valueOpts}
            placeholder="Select"
            small
            onChange={(v) => onChange(index, { ...row, value: v })}
          />
        ) : (
          <input
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Value"
            value={row.value}
            onChange={(e) => onChange(index, { ...row, value: e.target.value })}
          />
        )}
      </div>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────
const MessageSendModal: React.FC<Props> = ({ onClose, onSave }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step-1 state
  const [category, setCategory] = useState('');
  const [channel, setChannel] = useState('');
  const [from, setFrom] = useState('+91 99999 99999');
  const [recipient, setRecipient] = useState('');
  const [to, setTo] = useState('Original Contact');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  // Step-2 state
  const [template, setTemplate] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [headerFileName, setHeaderFileName] = useState('');
  const [bodyVars, setBodyVars] = useState<VarRow[]>([
    { type: '', value: '' },
    { type: '', value: '' },
  ]);

  const updateBodyVar = (index: number, row: VarRow) => {
    setBodyVars((prev) => prev.map((r, i) => (i === index ? row : r)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setHeaderFileName(e.target.files[0].name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) setHeaderFileName(e.dataTransfer.files[0].name);
  };

  const handleNext = () => {
    if (useTemplate) {
      setStep(2);
    } else {
      // save without template
      const roleData = user?.role === 'CONSUMER' ? { consumerName: user.name, amount: user.rentAmount, plan: user.plan, days: user.days } : user?.role === 'MANAGER' ? { managerName: user.name, requestedAmount: '500', region: 'North America' } : {};
      const data = { channel, from, recipient, to, subject, message, useTemplate, ...roleData };
      dispatch(saveMessageSend(data));
      onSave?.(data);
      onClose();
    }
  };

  const handleSave = () => {
    const roleData = user?.role === 'CONSUMER' ? { consumerName: user.name, amount: user.rentAmount, plan: user.plan, days: user.days } : user?.role === 'MANAGER' ? { managerName: user.name, requestedAmount: '500', region: 'North America' } : {};
    const data = { category, channel, from, recipient, to, subject, message, useTemplate, template, sendTo, bodyVars, ...roleData };
    dispatch(saveMessageSend(data));
    onSave?.(data);
    onClose();
  };

  const hasChannel = channel !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: 460, maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Send Message</h2>
            {/* Tabs — appear only after channel is selected */}
            {hasChannel && (
              <div className="flex gap-1 mt-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-medium text-gray-500 bg-gray-100">
                  {channel}
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-100">
                  Action
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {step === 1 && (
            <>
              {/* Category Options based on Role */}
              {user?.role === 'ADMIN' && (
                 <>
                   <Field label="To (Recipient)">
                     <Dropdown value={to} options={['Manager']} onChange={setTo} />
                   </Field>
                   <Field label="Message Send Category">
                     <Dropdown 
                       value={category} 
                       options={['Rent Payment Reminder', 'Internet Access Decision', 'Plan Update Notification']} 
                       onChange={setCategory} 
                     />
                   </Field>
                 </>
              )}
              {user?.role === 'MANAGER' && (
                 <>
                   <Field label="To (Recipient)">
                     <Dropdown 
                       value={to} 
                       options={['Admin', 'Consumer']} 
                       onChange={(v) => { setTo(v); setCategory(''); }} 
                     />
                   </Field>
                   <Field label="Message Send Category">
                     <Dropdown 
                       value={category} 
                       options={to === 'Admin' ? ['Rent Payment', 'Internet Access Request'] : ['Plan Confirmation', 'Help Query Response', 'Plan Expiry Warning']} 
                       onChange={setCategory} 
                     />
                   </Field>
                 </>
              )}
              {user?.role === 'CONSUMER' && (
                 <>
                   <Field label="Message Send Category">
                      <Dropdown value={category} options={['Query/Issue Report']} onChange={setCategory} />
                   </Field>
                   <Field label="Description">
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Describe your issue or query..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                   </Field>
                 </>
              )}

              {/* Channel - always show for SMS/Email */}
              <Field label="Send Via">
                <Dropdown
                  value={channel}
                  options={CHANNELS}
                  placeholder="Select channel (SMS/Email)"
                  onChange={setChannel}
                />
              </Field>

              {/* Dynamic content based on Manager's selection */}
              {user?.role === 'MANAGER' && to === 'Consumer' && category && (
                <div className="border p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 space-y-3 mt-4">
                  <h3 className="font-medium text-sm text-gray-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">SEND TO CONSUMER</span>
                  </h3>
                  <Field label="Consumer Name">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Consumer name" value={user?.name || ''} readOnly />
                  </Field>
                  <Field label="Email">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Email" value={user?.email || ''} readOnly />
                  </Field>
                  <Field label="Phone">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Phone" value={user?.phone || ''} readOnly />
                  </Field>
                  <Field label="Message">
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      placeholder={category === 'Plan Confirmation' ? 'Your internet plan has been confirmed...' : 
                                   category === 'Help Query Response' ? 'Regarding your help request...' :
                                   'Your plan expires in 2 days...'}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Field>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        if (!channel) {
                          alert('Please select a channel (SMS/Email)');
                          return;
                        }
                        alert(`${channel} sent to consumer:\n\n${message || 'Message sent successfully via ' + channel}`);
                      }}
                      className="w-full py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Send via {channel || 'SMS/Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Manager to Admin */}
              {user?.role === 'MANAGER' && to === 'Admin' && category && (
                <div className="border p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 space-y-3 mt-4">
                  <h3 className="font-medium text-sm text-gray-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">SEND TO ADMIN</span>
                  </h3>
                  <Field label="Manager Name">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={user?.name || 'Manager'} readOnly />
                  </Field>
                  <Field label="Manager Email">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={user?.email || ''} readOnly />
                  </Field>
                  <Field label="Message">
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      placeholder={category === 'Rent Payment' ? 'I am submitting rent payment of $...' :
                                   'I am requesting internet access for my consumers...'}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Field>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!channel) {
                          alert('Please select a channel (SMS/Email)');
                          return;
                        }
                        if (category === 'Rent Payment') {
                          const rentAmount = prompt('Enter rent amount:');
                          if (!rentAmount) return;
                          try {
                            await fetch('http://localhost:5000/workflows/rent-request', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                manager_id: user?.id,
                                admin_id: user?.adminId || 'admin1',
                                rent_amount: parseFloat(rentAmount)
                              })
                            });
                            alert(`Rent payment request sent to Admin via ${channel}.\nAmount: $${rentAmount}`);
                          } catch (err) {
                            alert('Failed to send rent request');
                          }
                        } else if (category === 'Internet Access Request') {
                          try {
                            await fetch('http://localhost:5000/workflows/internet-request', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                manager_id: user?.id,
                                admin_id: user?.adminId || 'admin1'
                              })
                            });
                            alert(`Internet access request sent to Admin via ${channel}.`);
                          } catch (err) {
                            alert('Failed to send internet request');
                          }
                        }
                      }}
                      className="w-full py-2.5 text-sm font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Send via {channel || 'SMS/Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Admin to Manager */}
              {user?.role === 'ADMIN' && category && (
                <div className="border p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 space-y-3 mt-4">
                  <h3 className="font-medium text-sm text-gray-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">SEND TO MANAGER</span>
                  </h3>
                  <Field label="Manager Name">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Manager name" />
                  </Field>
                  <Field label="Manager Email">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="manager@isp.com" />
                  </Field>
                  <Field label="Message">
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      placeholder={category === 'Rent Payment Reminder' ? 'Please pay your monthly rent...' :
                                   category === 'Internet Access Decision' ? 'Your internet access has been...' :
                                   'There is an update to your plan...'}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Field>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!channel) {
                          alert('Please select a channel (SMS/Email)');
                          return;
                        }
                        alert(`Message sent to Manager via ${channel}.\n\nCategory: ${category}\n${message}`);
                      }}
                      className="w-full py-2.5 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                    >
                      Send via {channel || 'SMS/Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Consumer to Manager */}
              {user?.role === 'CONSUMER' && category && (
                <div className="border p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border-green-200 space-y-3 mt-4">
                  <h3 className="font-medium text-sm text-gray-800 flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">REPORT ISSUE</span>
                  </h3>
                  <Field label="Your Name">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={user?.name || ''} readOnly />
                  </Field>
                  <Field label="Your Email">
                    <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={user?.email || ''} readOnly />
                  </Field>
                  <Field label="Issue Type">
                    <Dropdown
                      value={template}
                      options={['Low Internet Speed', 'Network Disconnection', 'Billing Issue', 'Other']}
                      placeholder="Select issue type"
                      onChange={setTemplate}
                    />
                  </Field>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!channel) {
                          alert('Please select a channel (SMS/Email)');
                          return;
                        }
                        try {
                          await fetch('http://localhost:5000/workflows/help-request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              consumer_id: user?.id,
                              issue_type: template || 'Other',
                              description: message || 'No description provided',
                              manager_id: user?.managerId
                            })
                          });
                          alert(`Your issue has been reported to the manager via ${channel}.\n\nIssue: ${template}\n${message}`);
                        } catch (err) {
                          alert('Failed to send help request');
                        }
                      }}
                      className="w-full py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Send via {channel || 'SMS/Email'}
                    </button>
                  </div>
                </div>
              )}

              {/* Use Template toggle */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Use Template</p>
                  <p className="text-xs text-gray-400 mt-0.5">Use pre-configured message templates</p>
                </div>
                <Toggle checked={useTemplate} onChange={setUseTemplate} />
              </div>
            </>
          )}

          {/* ── Step 2: Template config ── */}
          {step === 2 && (
            <>
              <Field label="Template">
                <Dropdown value={template} options={TEMPLATE_OPTS} placeholder="Select" onChange={setTemplate} />
              </Field>

              <Field label="Send To">
                <Dropdown value={sendTo} options={SEND_TO_OPTS} placeholder="Select contacts{(Original Sender)}" onChange={setSendTo} />
              </Field>

              {/* Header Variables - upload area */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Header Variables</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 transition"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('header-file-input')?.click()}
                >
                  <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  {headerFileName ? (
                    <p className="text-xs text-blue-600 font-medium">{headerFileName}</p>
                  ) : (
                    <>
                      <p className="text-xs text-center text-gray-500">
                        <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-gray-400">JPG, PNG, JPG or GIF (max.1MB)</p>
                    </>
                  )}
                  <input
                    id="header-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-gray-400">This is a hint text to help user.</p>
              </div>

              {/* Body Variables */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Body Variables</label>
                <div className="space-y-2">
                  {bodyVars.map((row, i) => (
                    <BodyVarRow key={i} index={i} row={row} onChange={updateBodyVar} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">This is a hint text to help user.</p>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={hasChannel ? handleNext : handleSave}
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              {hasChannel ? (useTemplate ? 'Next' : 'Next') : 'Save'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageSendModal;
