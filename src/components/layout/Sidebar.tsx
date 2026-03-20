// Updated Sidebar.tsx (integrate ContactsSidebar with the existing Users icon next to Home and Message icons)
import React, { useState } from 'react';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Bell, 
  Copy, 
  Settings, 
  Moon,
  Workflow,
  Search,
  ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ContactsSidebar from './Contacts/ContactsSidebar'; // Import ContactsSidebar

// Define the sections data (assuming this is part of the component or passed as props)
const sections = {
  // Example data; replace with actual sections
  'Actions': [
    { title: 'Send Message', desc: 'Send a message', icon: MessageSquare, onClick: () => console.log('Send Message') },
    // Add more items
  ],
  'Triggers': [
    { title: 'New Contact', desc: 'When a new contact is added', icon: Users, onClick: () => console.log('New Contact') },
    // Add more items
  ],
};

interface SidebarProps {
  onContactsToggle: () => void; // Handler for toggling contacts sidebar
  showContacts: boolean; // State for contacts sidebar visibility
  onWorkflowToggle: () => void; // Handler for toggling workflow panel
  showWorkflow: boolean; // State for workflow panel visibility
  currentView?: string; // Assuming currentView is passed as prop or from context
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onContactsToggle, 
  showContacts, 
  onWorkflowToggle, 
  showWorkflow, 
  currentView 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (section: string) => {
    setOpen(open === section ? null : section);
  };

  return (
    <>
      {/* Main Sidebar Content */}
      <nav className="flex flex-col gap-2 p-4 bg-white shadow">
        <button onClick={() => navigate('/')} className="flex items-center p-2 hover:bg-gray-100" title="Home">
          <Home className="w-4 h-4" />
        </button>
        <button onClick={() => console.log('Message action')} className="flex items-center p-2 hover:bg-gray-100" title="Send Message">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button onClick={onContactsToggle} className="flex items-center p-2 hover:bg-gray-100" title={showContacts ? 'Hide Contacts' : 'Show Contacts'}>
          <Users className="w-4 h-4" />
        </button>
        <button onClick={onWorkflowToggle} className="flex items-center p-2 hover:bg-gray-100" title={showWorkflow ? 'Hide Workflow' : 'Show Workflow'}>
          <Workflow className="w-4 h-4" />
        </button>
        {/* Add more navigation items as needed */}
      </nav>

      {/* Right Panel - Only show in workflow editor */}
      {currentView === "workflow" && showWorkflow && (
        <aside className="w-72 border-l bg-blue-50 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-lg border px-3 py-2 pl-10 text-sm focus:ring focus:ring-blue-200"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {Object.entries(sections).map(([section, items]) => (
            <div key={section} className="bg-white rounded-lg shadow">
              <div
                onClick={() => toggle(section)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer"
              >
                <span className="font-medium">
                  {section} ({items.length})
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    open === section ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open === section && (
                <div className="px-2 pb-2">
                  {items.map((item) => (
                    <div
                      key={item.title}
                      onClick={() => item.onClick?.()}
                      className={`flex items-start gap-3 px-2 py-2 rounded-md hover:bg-gray-50 ${
                        typeof item.onClick === 'function' ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <item.icon className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>
      )}

      {/* Contacts Sidebar - Render when showContacts is true */}
      {showContacts && (
        <ContactsSidebar onClose={onContactsToggle} />
      )}
    </>
  );
};

export default Sidebar;