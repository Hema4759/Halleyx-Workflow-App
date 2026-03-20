// src/components/layout/Layout.tsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import ContactsSidebar from './Contacts/ContactsSidebar';
import RightPanel from './RightPanel';
import MessageReceiveModal from '../modals/MessageReceiveModal';
import MessageSendModal from '../modals/MessageSendModal';
import AddWorkflowModal from '../modals/AddWorkflowModal';
import { selectWorkflows, Workflow } from '../../store/workflowSlice'; // Import Workflow type and updated selector

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showContactsSidebar, setShowContactsSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [showMessageReceiveModal, setShowMessageReceiveModal] = useState(false);
  const [showMessageSendModal, setShowMessageSendModal] = useState(false);
  
  // Fetch existing workflow names with safety checks
  const workflows = useSelector(selectWorkflows) as Workflow[]; // Explicitly type as Workflow[]
  const existingWorkflowNames = workflows?.map((w: Workflow) => w.name || 'Unnamed Workflow') || []; // Safe mapping with fallback
  
  const handleAddAction = (type: 'send' | 'receive') => {
    console.log(`Adding action: ${type}`);
    // Integrate with Redux if needed: e.g., dispatch(addAction({ type, content: '' }));
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Sidebar 
        onContactsToggle={() => setShowContactsSidebar(!showContactsSidebar)}
        showContacts={showContactsSidebar}
        onWorkflowToggle={() => setShowRightPanel(!showRightPanel)}
        showWorkflow={showRightPanel}
      />

      {showContactsSidebar && (
        <ContactsSidebar onClose={() => setShowContactsSidebar(false)} />
      )}

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {showRightPanel && (
        <RightPanel onAddAction={handleAddAction} />
      )}

      {showAddWorkflowModal && (
        <AddWorkflowModal 
          onClose={() => setShowAddWorkflowModal(false)} 
          existingWorkflowNames={existingWorkflowNames}
        />
      )}
      {showMessageReceiveModal && (
        <MessageReceiveModal onClose={() => setShowMessageReceiveModal(false)} />
      )}
      {showMessageSendModal && (
        <MessageSendModal onClose={() => setShowMessageSendModal(false)} />
      )}
    </div>
  );
};

export default Layout;