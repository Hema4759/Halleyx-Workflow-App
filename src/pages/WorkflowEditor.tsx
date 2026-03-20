import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus, Search, ChevronDown, Hand, Crop, ZoomIn, ZoomOut,
  AlignJustify, X, Pencil, Undo2, Redo2, Moon, Sun,
  MousePointer, StickyNote, Check, Settings,
  Inbox, Send, Clock, Filter, ListFilter, CopyMinus,
  GitBranch, MessageCircle, Mail, Link2, Webhook,
} from 'lucide-react';
import MessageReceiveModal from '../components/modals/MessageReceiveModal';
import MessageSendModal from '../components/modals/MessageSendModal';
import ScheduleModal from '../components/modals/ScheduleModal';
import ConditionLimitModal from '../components/modals/ConditionLimitModal';
import SmsModal from '../components/modals/SmsModal';
import EmailModal from '../components/modals/EmailModal';
import { updateWorkflow, addWorkflow, deleteWorkflow } from '../store/workflowSlice';
import { AppDispatch } from '../store';
import { useAuth } from '../contexts/AuthContext';

// ── Sidebar step definitions ──────────────────────────
const workflowSteps = {
  Trigger: [
    { title: 'Message Receive', desc: 'Trigger on receiving a message', icon: <Inbox className="w-4 h-4 text-blue-500" /> },
    { title: 'Message Send', desc: 'Trigger on sending a message', icon: <Send className="w-4 h-4 text-purple-500" /> },
    { title: 'Schedule', desc: 'Time limit for the subscription plan', icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { title: 'Webhook', desc: 'Trigger for the Webhook', icon: <Link2 className="w-4 h-4 text-gray-500" /> },
  ],
  Conditions: [
    { title: 'Limit', desc: 'Condition based on used limit', icon: <ListFilter className="w-4 h-4 text-red-400" /> },
    { title: 'Filter', desc: 'Remove items matching a condition', icon: <Filter className="w-4 h-4 text-yellow-500" /> },
  ],
  Actions: [
    { title: 'SMS', desc: 'Send an SMS message', icon: <MessageCircle className="w-4 h-4 text-green-500" /> },
    { title: 'Email', desc: 'Send an email', icon: <Mail className="w-4 h-4 text-blue-400" /> },
  ],
};

// ── Canvas node type ──────────────────────────────────
interface CanvasNode {
  id: string; type: string; label: string; icon: React.ReactNode; config: any; rules?: any[];
}

type Tool = 'select' | 'pan' | 'frame';

const ZOOM_MIN = 25;
const ZOOM_MAX = 200;
const ZOOM_STEP = 15;

// ── Component ─────────────────────────────────────────
const WorkflowEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  
  // Try mapping an existing workflow
  const workflows = useSelector((state: any) => state.workflow.workflows);
  const existingWorkflow = workflows.find((w: any) => w.id === id);

  const consumerId = (location.state as any)?.consumer_id || existingWorkflow?.consumer_id;
  const consumerName = (location.state as any)?.consumer_name;
  const fromNotification = (location.state as any)?.fromNotification;

  const initialName = existingWorkflow 
    ? existingWorkflow.name 
    : ((location.state as any)?.name || (consumerName ? consumerName : `Workflow ${id}`));

  // ── header state ──────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [localName, setLocalName] = useState(initialName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isActive, setIsActive] = useState(existingWorkflow ? existingWorkflow.status === 'Active' : false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Track existing backend workflow ID for updating
  const [backendWorkflowId, setBackendWorkflowId] = useState<string | null>(null);
  const [existingNodes, setExistingNodes] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState<string>(initialName);

  // ── undo / redo history ───────────────────────────
  const autoPopulate = (location.state as any)?.autoPopulateTrigger;
  const shouldAutoPopulate = autoPopulate || fromNotification;
  const autoOpenMessageReceive = (location.state as any)?.autoOpenMessageReceive;
  const messageReceiveType = (location.state as any)?.messageReceiveType;
  
  // Extract all notification data from location state
  const notificationData = {
    consumer_id: (location.state as any)?.consumer_id,
    consumer_name: (location.state as any)?.consumer_name,
    consumer_email: (location.state as any)?.consumer_email,
    consumer_phone: (location.state as any)?.consumer_phone,
    manager_id: (location.state as any)?.manager_id,
    manager_name: (location.state as any)?.manager_name,
    manager_email: (location.state as any)?.manager_email,
    plan: (location.state as any)?.plan,
    amount: (location.state as any)?.amount,
    days: (location.state as any)?.days,
    notification_type: (location.state as any)?.notification_type,
  };

  // Fetch existing workflow from backend when consumer_id or manager_id is present
  useEffect(() => {
    const fetchExistingWorkflow = async () => {
      const targetId = consumerId || (location.state as any)?.manager_id;
      if (!targetId || !user?.id) return;

      try {
        // Try to find existing workflow for this consumer/manager and this manager
        const workflowsRes = await fetch('http://localhost:5000/workflows');
        const workflowsData = await workflowsRes.json();
        
        if (Array.isArray(workflowsData)) {
          // Find workflow where creator is this manager and consumer_id matches
          const existingWf = workflowsData.find((w: any) => 
            w.creator_id === user?.id && w.consumer_id === targetId
          );

          if (existingWf) {
            setBackendWorkflowId(existingWf.id);
            setWorkflowName(existingWf.name);
            
            // Fetch existing steps for this workflow
            const stepsRes = await fetch(`http://localhost:5000/steps/${existingWf.id}`);
            const stepsData = await stepsRes.json();
            
            if (Array.isArray(stepsData) && stepsData.length > 0) {
              const nodesFromSteps = stepsData.map((s: any) => ({
                id: `node-${s.id}`,
                type: s.step_type,
                label: s.name,
                config: s.metadata || {}
              }));
              setExistingNodes(nodesFromSteps);
            }
          }
        }
      } catch (err) {
        console.log('No existing workflow found, will create new');
      }
    };

    fetchExistingWorkflow();
  }, [consumerId, user?.id, shouldAutoPopulate]);
  
  // Auto-open Message Receive modal when coming from notification
  useEffect(() => {
    if (autoOpenMessageReceive && shouldAutoPopulate) {
      setShowMessageReceiveModal(true);
    }
  }, [autoOpenMessageReceive, shouldAutoPopulate]);
  
  // Combine existing nodes from backend with new trigger if from notification
  const initialNodes: CanvasNode[] = existingWorkflow 
    ? existingWorkflow.actions 
    : (existingNodes.length > 0 
      ? existingNodes 
      : (shouldAutoPopulate ? [{
        id: `node-${Date.now()}`, type: 'Message Receive',
        label: 'Message Receive Trigger',
        icon: <Inbox className="w-7 h-7 text-blue-500" />, config: notificationData,
      }] : [])
    );

  const [nodeHistory, setNodeHistory] = useState<CanvasNode[][]>([initialNodes]);
  const [historyPtr, setHistoryPtr] = useState(0);
  const canvasNodes = nodeHistory[historyPtr];

  const pushNodes = useCallback((nodes: CanvasNode[]) => {
    setNodeHistory(prev => {
      const sliced = prev.slice(0, historyPtr + 1);
      return [...sliced, nodes];
    });
    setHistoryPtr(prev => prev + 1);
  }, [historyPtr]);

  const undo = () => { if (historyPtr > 0) setHistoryPtr(p => p - 1); };
  const redo = () => { if (historyPtr < nodeHistory.length - 1) setHistoryPtr(p => p + 1); };

  // ── canvas tool + zoom ────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = canvasNodes.find(n => n.id === selectedNodeId);
  
  const [zoom, setZoom] = useState(100);

  const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  const tidyUp = () => { setZoom(100); };   // reset zoom to 100%

  // cursor maps to tool
  const cursorMap: Record<Tool, string> = {
    select: 'default',
    pan: 'grab',
    frame: 'crosshair',
  };

  // ── dark mode ─────────────────────────────────────
  const toggleDark = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    setIsDark(html.classList.contains('dark'));
  };

  // ── sticky notes ──────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');

  // ── sidebar / modals ──────────────────────────────
  const [showSidebar, setShowSidebar] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('Trigger');
  const [showMessageReceiveModal, setShowMessageReceiveModal] = useState(false);
  const [showMessageSendModal, setShowMessageSendModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const toggleSection = (s: string) => setOpenSection(openSection === s ? null : s);

  const handleItemClick = (title: string) => {
    if (title === 'Message Receive') setShowMessageReceiveModal(true);
    else if (title === 'Message Send') setShowMessageSendModal(true);
    else if (title === 'Schedule') setShowScheduleModal(true);
    else if (title === 'Limit') setShowLimitModal(true);
    else if (title === 'SMS') setShowSmsModal(true);
    else if (title === 'Email') setShowEmailModal(true);
  };

  // ── node save handlers ────────────────────────────
  const handleMessageReceiveSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'Message Receive',
      label: 'Message Receive Trigger',
      icon: <Inbox className="w-7 h-7 text-blue-500" />, config: data,
    }]);
    setShowSidebar(false);
  };

  const handleMessageSendSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'Message Send',
      label: 'Send Message',
      icon: <Send className="w-7 h-7 text-purple-500" />, config: data,
    }]);
    setShowSidebar(false);
  };

  const handleScheduleSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'Schedule',
      label: 'Schedule Trigger',
      icon: <Clock className="w-7 h-7 text-orange-500" />, config: data,
    }]);
    setShowSidebar(false);
  };

  const handleLimitSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'Limit',
      label: 'Limit Condition',
      icon: <ListFilter className="w-7 h-7 text-red-400" />, config: data,
    }]);
    setShowSidebar(false);
  };

  const handleSmsSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'SMS',
      label: 'Send SMS',
      icon: <MessageCircle className="w-7 h-7 text-green-500" />, config: data,
    }]);
    setShowSidebar(false);
  };

  const handleEmailSave = (data: any) => {
    pushNodes([...canvasNodes, {
      id: `node-${Date.now()}`, type: 'Email',
      label: 'Send Email',
      icon: <Mail className="w-7 h-7 text-blue-400" />, config: data,
    }]);
    setShowSidebar(false);
  };

  // ── edit name ─────────────────────────────────────
  const startEditName = () => {
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };
  const commitName = () => {
    setEditingName(false);
    if (id) dispatch(updateWorkflow({ id, updates: { name: localName } }));
  };

  // ── save & go home ────────────────────────────────
  const handleSave = async () => {
    const nameTrimmed = localName.trim();
    if (!nameTrimmed) {
      alert("Workflow name cannot be empty.");
      return;
    }
    const isDuplicate = workflows.some((w: any) => w.name.toLowerCase() === nameTrimmed.toLowerCase() && w.id !== id);
    if (isDuplicate) {
      alert("Workflow Name must be strictly unique! This name already exists.");
      return;
    }

    const serializableNodes = canvasNodes.map((n) => ({ ...n, icon: undefined }));

    // If we have an existing backend workflow ID, update it instead of creating new
    if (backendWorkflowId) {
      const newId = `wf-${Date.now()}`;
      if (id?.startsWith('draft-')) {
        dispatch(deleteWorkflow(id));
      }
      dispatch(addWorkflow({
        id: newId,
        name: localName.trim(),
        createdBy: user?.name || 'You',
        status: 'Active',
        actions: serializableNodes,
        createdAt: new Date().toISOString(),
        consumer_id: consumerId
      }));

      try {
        // Update existing workflow
        const wfRes = await fetch(`http://localhost:5000/workflows/${backendWorkflowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localName.trim(),
            input_schema: { nodes: serializableNodes },
            creator_id: user?.id,
            consumer_id: consumerId,
            is_active: true
          }),
        });
        
        if (wfRes.ok) {
          // Add new steps to existing workflow
          for (let i = 0; i < serializableNodes.length; i++) {
            const n = serializableNodes[i];
            await fetch(`http://localhost:5000/steps/${backendWorkflowId}/steps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: n.label || n.type,
                step_type: n.type,
                order: i,
                metadata: n.config || {}
              })
            });
          }
          alert('Workflow updated successfully!');
        }
      } catch (err) {
        console.warn("Backend workflow save skipped:", err);
      }
    } else if (id?.startsWith('draft-')) {
      // No existing workflow, create new one
      const newId = `wf-${Date.now()}`;
      dispatch(deleteWorkflow(id));
      dispatch(addWorkflow({
        id: newId,
        name: localName.trim(),
        createdBy: user?.name || 'You',
        status: 'Active',
        actions: serializableNodes,
        createdAt: new Date().toISOString(),
        consumer_id: consumerId
      }));

      try {
        const wfRes = await fetch('http://localhost:5000/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localName.trim(),
            input_schema: { nodes: serializableNodes },
            creator_id: user?.id,
            consumer_id: consumerId,
            is_active: true
          }),
        });
        const createdWf = await wfRes.json();
        
        if (createdWf && createdWf.id) {
          setBackendWorkflowId(createdWf.id); // Store the new workflow ID
          for (let i = 0; i < serializableNodes.length; i++) {
            const n = serializableNodes[i];
            await fetch(`http://localhost:5000/steps/${createdWf.id}/steps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: n.label || n.type,
                step_type: n.type,
                order: i,
                metadata: n.config || {}
              })
            });
          }
          alert('Workflow saved successfully!');
        }
      } catch (err) {
        console.warn("Backend workflow save skipped:", err);
      }
    } else if (id) {
       dispatch(updateWorkflow({
         id,
         updates: { name: localName, status: 'Active', actions: serializableNodes, consumer_id: consumerId },
       }));
       
       try {
         const wfRes = await fetch(`http://localhost:5000/workflows/${id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
             name: localName, 
             input_schema: { nodes: serializableNodes },
             creator_id: user?.id,
             consumer_id: consumerId,
             is_active: true
           })
         });
         const updatedWf = await wfRes.json();
         if (updatedWf && updatedWf.id) {
           for (let i = 0; i < serializableNodes.length; i++) {
             const n = serializableNodes[i];
             await fetch(`http://localhost:5000/steps/${updatedWf.id}/steps`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 name: n.label || n.type,
                 step_type: n.type,
                 order: i,
                 metadata: n.config || {}
               })
             });
           }
         }
       } catch(err) {
         console.warn("Backend workflow update skipped:", err);
       }
    }
    navigate('/');
  };

  // ── filtered sidebar items ────────────────────────
  const filteredSteps = Object.fromEntries(
    Object.entries(workflowSteps).map(([section, items]) => [
      section,
      items.filter(
        ({ title, desc }) =>
          title.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          desc.toLowerCase().includes(sidebarSearch.toLowerCase())
      ),
    ])
  ) as typeof workflowSteps;

  // ── tool button helper ────────────────────────────
  const toolBtn = (tool: Tool, icon: React.ReactNode, label: string) => (
    <button
      key={label}
      title={label}
      onClick={() => setActiveTool(tool)}
      className={`p-1.5 rounded transition ${activeTool === tool
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600'
        }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── Header ── */}
      <header className="flex justify-between items-center px-4 py-2 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm z-10">
        {/* Left: avatar + editable name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0].toUpperCase() || 'W'}
          </div>
          <div>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={localName}
                onChange={e => setLocalName(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
                className="text-base font-semibold dark:text-white leading-tight border-b border-blue-500 focus:outline-none bg-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold dark:text-white leading-tight">{localName}</h1>
                {user?.role === 'ADMIN' && notificationData.manager_name && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full border border-purple-200">
                    Manager: {notificationData.manager_name}
                  </span>
                )}
                {user?.role === 'MANAGER' && consumerName && (
                  <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full border border-blue-200">
                    Consumer: {consumerName}
                  </span>
                )}
                {user?.role === 'CONSUMER' && (
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full border border-green-200">
                    Plan: {user?.plan || 'Active'}
                  </span>
                )}
              </div>
            )}
            <p className="text-gray-400 dark:text-gray-500 text-xs leading-tight">Here's an edit section of your workflow</p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5">
          {/* Edit name */}
          <button
            onClick={startEditName}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Edit name"
          >
            {editingName ? <Check className="w-4 h-4 text-blue-600" /> : <Pencil className="w-4 h-4" />}
          </button>

          {/* Active toggle */}
          <label className="flex items-center cursor-pointer gap-2 text-sm text-gray-600 dark:text-gray-300 select-none px-1">
            <span className="text-xs">{isActive ? 'Active' : 'Inactive'}</span>
            <input type="checkbox" checked={isActive} onChange={() => setIsActive(!isActive)} className="hidden" />
            <div className={`w-9 h-5 flex items-center rounded-full px-0.5 duration-300 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-300 ${isActive ? 'translate-x-4' : ''}`} />
            </div>
          </label>

          {/* Undo */}
          <button
            onClick={undo}
            disabled={historyPtr === 0}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={historyPtr === nodeHistory.length - 1}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${isDark ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium ml-1"
          >
            Save
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Canvas ── */}
        <main
          className="flex-1 flex justify-center items-center bg-white dark:bg-gray-800 relative overflow-hidden"
          style={{ cursor: cursorMap[activeTool] }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const title = e.dataTransfer.getData('application/reactflow');
            if (title) {
              handleItemClick(title);
            }
          }}
        >
          {/* Zoomed canvas content */}
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.15s ease' }}>
            {canvasNodes.length === 0 ? (
              /* Empty state */
              <button
                type="button"
                onClick={() => setShowSidebar(true)}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-10 cursor-pointer text-gray-400 dark:text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all"
              >
                <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Create new workflow</span>
              </button>
            ) : (
              /* Nodes chain */
              <div className="flex flex-col items-center gap-0">
                {canvasNodes.map((node, idx) => (
                  <React.Fragment key={node.id}>
                    <div className="flex flex-col items-center">
                      <div 
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          handleItemClick(node.type);
                        }}
                        onDoubleClick={() => handleItemClick(node.type)}
                        className={`bg-white border ${selectedNodeId === node.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} rounded-xl shadow-md px-6 py-4 flex flex-col items-center gap-2 min-w-[140px] hover:shadow-lg transition cursor-pointer`}
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          {node.icon || (
                             node.type === 'Message Receive' ? <Inbox className="w-7 h-7 text-blue-500" /> :
                             node.type === 'Message Send' ? <Send className="w-7 h-7 text-purple-500" /> :
                             node.type === 'Schedule' ? <Clock className="w-7 h-7 text-orange-500" /> :
                             node.type === 'Limit' ? <ListFilter className="w-7 h-7 text-red-400" /> :
                             node.type === 'SMS' ? <MessageCircle className="w-7 h-7 text-green-500" /> :
                             node.type === 'Email' ? <Mail className="w-7 h-7 text-blue-400" /> : null
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-600 text-center">{node.label}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-gray-300" />
                        {idx === canvasNodes.length - 1 && (
                          <button
                            onClick={() => setShowSidebar(true)}
                            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition"
                            title="Add next step"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* ── Top-right canvas buttons ── */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setShowSidebar(true)}
              className="w-8 h-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition"
              title="Add node"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`w-8 h-8 border rounded-lg shadow-sm flex items-center justify-center transition ${showNotes
                  ? 'bg-yellow-100 border-yellow-300 text-yellow-600'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                }`}
              title="Notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          </div>

          {/* ── Sticky notes panel ── */}
          {showNotes && (
            <div className="absolute bottom-16 right-4 w-56 bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg overflow-hidden z-20">
              <div className="flex items-center justify-between px-3 py-2 bg-yellow-100 border-b border-yellow-200">
                <span className="text-xs font-semibold text-yellow-800">📝 Notes</span>
                <button onClick={() => setShowNotes(false)} className="text-yellow-600 hover:text-yellow-800">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                autoFocus
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type your notes here..."
                className="w-full h-32 px-3 py-2 text-xs text-gray-700 bg-yellow-50 resize-none focus:outline-none placeholder-yellow-400"
              />
            </div>
          )}

          {/* ── Zoom indicator ── */}
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-500 dark:text-gray-400 shadow select-none">
            {zoom}%
          </div>

          {/* ── Bottom-center toolbar ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow px-2 py-1.5">
            {toolBtn('select', <MousePointer className="w-3.5 h-3.5" />, 'Select')}
            {toolBtn('pan', <Hand className="w-3.5 h-3.5" />, 'Pan')}
            {toolBtn('frame', <Crop className="w-3.5 h-3.5" />, 'Frame')}

            {/* Divider */}
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

            <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom In"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded transition disabled:opacity-30">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom Out"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded transition disabled:opacity-30">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

            <button onClick={tidyUp} title="Tidy Up (reset zoom)"
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded transition">
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        {showSidebar && (
          <aside className="w-72 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search"
                  autoFocus
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1 leading-4">⌘K</span>
              </div>
            </div>

            {/* Accordion */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {(Object.entries(filteredSteps) as [string, typeof workflowSteps.Trigger][]).map(([section, items]) => (
                <div key={section} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section)}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition"
                  >
                    <span>{section} ({items.length})</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openSection === section ? 'rotate-180' : ''}`} />
                  </button>
                  {openSection === section && (
                    <ul className="border-t border-gray-100 dark:border-gray-600 divide-y divide-gray-50 dark:divide-gray-600">
                      {items.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-gray-400 text-center">No results</li>
                      ) : items.map(({ title, desc, icon }) => (
                        <li
                          key={title}
                          draggable
                          onDragStart={(e) => {
                             e.dataTransfer.setData('application/reactflow', title);
                             e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => handleItemClick(title)}
                          className="flex items-start gap-3 cursor-grab px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-600 transition active:cursor-grabbing"
                        >
                          <div className="mt-0.5 flex-shrink-0">{icon}</div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Close */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowSidebar(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Close panel
              </button>
            </div>
          </aside>
        )}

        {/* ── Right Inspector Panel ── */}
        {selectedNode && (
          <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col z-10 shadow-xl transition-transform animate-slideInRight h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" /> Inspector
              </h2>
              <button onClick={() => setSelectedNodeId(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Node Type</p>
                 <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 font-medium">
                   {selectedNode.icon} {selectedNode.type}
                 </div>
              </div>
              
              <div>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Step Rules</p>
                 <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 space-y-1">
                   Define priority-based rules determining the next step.
                   Uses JavaScript evaluation. Example: <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">amount {'>'} 100 && country == 'US'</code>
                 </div>
                 
                 <div className="space-y-2">
                   {/* Dummy rule rendering for now - in reality this would map over selectedNode.rules */}
                   <div className="border border-gray-200 rounded p-2 bg-gray-50 relative">
                      <div className="absolute -top-2 -left-2 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[10px] font-bold border border-blue-200">1</div>
                      <input type="text" defaultValue="amount > 100 && country == 'US'" className="w-full text-xs font-mono p-1 border border-gray-300 rounded mb-2" />
                      <select className="w-full text-xs p-1 border border-gray-300 rounded">
                         <option>Finance Notification</option>
                         <option>Task Rejection</option>
                      </select>
                      <button className="text-[10px] text-red-500 mt-2 font-medium">Remove Rule</button>
                   </div>
                   <div className="border border-gray-200 rounded p-2 bg-gray-50 relative">
                      <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-300">2</div>
                      <input type="text" readOnly value="DEFAULT" className="w-full text-xs font-mono p-1 border border-gray-300 bg-gray-100 rounded mb-2" />
                      <select className="w-full text-xs p-1 border border-gray-300 rounded">
                         <option>Task Rejection</option>
                         <option>Finance Notification</option>
                      </select>
                   </div>
                   <button className="w-full py-1.5 border border-dashed border-gray-400 text-gray-500 rounded text-xs hover:bg-gray-50 hover:text-gray-700 transition">
                     + Add Rule
                   </button>
                 </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button onClick={() => setSelectedNodeId(null)} className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">Done</button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Modals ── */}
      {showMessageReceiveModal && (
        <MessageReceiveModal
          onClose={() => setShowMessageReceiveModal(false)}
          onSave={handleMessageReceiveSave}
        />
      )}
      {showMessageSendModal && (
        <MessageSendModal
          onClose={() => setShowMessageSendModal(false)}
          onSave={handleMessageSendSave}
        />
      )}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSave={handleScheduleSave}
        />
      )}
      {showLimitModal && (
        <ConditionLimitModal
          onClose={() => setShowLimitModal(false)}
          onSave={handleLimitSave}
        />
      )}
      {showSmsModal && (
        <SmsModal
          onClose={() => setShowSmsModal(false)}
          onSave={handleSmsSave}
        />
      )}
      {showEmailModal && (
        <EmailModal
          onClose={() => setShowEmailModal(false)}
          onSave={handleEmailSave}
        />
      )}
    </div>
  );
};

export default WorkflowEditorPage;