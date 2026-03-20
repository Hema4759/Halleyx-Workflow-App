import React, { useState, ReactNode } from 'react';
import { Home, Users } from 'lucide-react'; // Import icons
import { useNavigate } from 'react-router-dom';
import ContactsSidebar from './Contacts/ContactsSidebar'; // Your contact side panel

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [showContactsSidebar, setShowContactsSidebar] = useState(false);

  // Handle Home icon click - navigate to home page
  const handleHomeClick = () => {
    navigate('/'); // Change to your home route path
  };

  // Handle Contact icon click - toggle contacts sidebar visibility
  const handleContactClick = () => {
    setShowContactsSidebar(prev => !prev);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar with Home and Contact icons */}
      <nav className="w-16 bg-white border-r flex flex-col items-center py-6 space-y-6">
        <button
          onClick={handleHomeClick}
          aria-label="Home"
          title="Home"
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Home className="w-6 h-6 text-gray-600" />
        </button>
        <button
          onClick={handleContactClick}
          aria-label="Contacts"
          title="Contacts"
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Users className="w-6 h-6 text-gray-600" />
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Contacts sidebar panel - render conditionally */}
      {showContactsSidebar && (
        <ContactsSidebar onClose={() => setShowContactsSidebar(false)} />
      )}
    </div>
  );
};

export default MainLayout;