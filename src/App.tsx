// src/App.tsx
import React, { Suspense, lazy, useState,useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home as HomeIcon, MessageSquare, Users, Bell, Copy, Settings, Moon, LogOut, FileText } from 'lucide-react';
import ContactsSidebar from './components/layout/Contacts/ContactsSidebar';
import { store } from './store'; // Ensure this points to your store file (e.g., ./store/index or ./store)
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

const HomePage = lazy(() => import('./pages/Homepage'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WorkflowEditor = lazy(() => import('./pages/WorkflowEditor'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const queryClient = new QueryClient();

// Create a wrapper component to use useNavigate inside Router
function AppContent() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showContacts, setShowContacts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Sidebar */}
      <aside className="w-16 h-screen flex flex-col justify-between items-center py-4 border-r bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-4 items-center mt-2">
          <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-xs" title={user.name}>
             {user.name.substring(0,2).toUpperCase()}
          </div>
          <div title="Home">
            <HomeIcon 
              className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" 
              onClick={() => navigate('/')}
            />
          </div>
          {user?.role === 'MANAGER' && (
            <div title="Manager Dashboard">
              <Users 
                className="w-6 h-6 text-gray-500 cursor-pointer hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400" 
                onClick={() => navigate('/manager')}
              />
            </div>
          )}
          {user?.role === 'ADMIN' && (
            <div title="Admin Dashboard">
              <Settings 
                className="w-6 h-6 text-gray-500 cursor-pointer hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400" 
                onClick={() => navigate('/admin')}
              />
            </div>
          )}
          <div title="Messages">
            <MessageSquare className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
          </div>
          <div title="Contacts">
            <Users 
              className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" 
              onClick={() => setShowContacts(!showContacts)}
            />
          </div>
          <div title="Notifications" className="relative group">
            <Bell 
              className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" 
              onClick={() => setShowNotifications(!showNotifications)}
            />
            {showNotifications && (
              <div className="absolute left-10 top-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-xl p-3 z-50">
                {user?.role === 'ADMIN' && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition shadow-sm"
                       onClick={() => { setShowNotifications(false); navigate('/workflow/draft-manager-setup', { state: { name: 'Manager Regional Setup', autoPopulateTrigger: true, details: { managerName: 'Regional Manager 1', region: 'North America', added: '450', amount: '500', plan: 'Enterprise', days: '30' } } }); }}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-red-900">New Manager Request</p>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded text-red-600 font-medium">Just now</span>
                    </div>
                    <p className="text-[11px] text-red-800 mt-1">Manager requests Internet Access validation.</p>
                  </div>
                )}
                {user?.role === 'MANAGER' && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition shadow-sm"
                       onClick={() => { setShowNotifications(false); navigate('/workflow/draft-consumer-setup', { state: { name: 'Consumer Workflow Request', autoPopulateTrigger: true, details: { consumerName: 'John Doe', amount: '100', plan: 'Pro Plan', days: '30' } } }); }}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-blue-900">New Consumer Login</p>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded text-blue-600 font-medium">Just now</span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1">A consumer selected a plan and processed amount.</p>
                  </div>
                )}
                {user?.role === 'CONSUMER' && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg cursor-pointer hover:bg-green-100 transition shadow-sm"
                       onClick={() => { setShowNotifications(false); navigate('/', { state: { } }); }}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-green-900">Manager Update</p>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded text-green-600 font-medium">Just now</span>
                    </div>
                    <p className="text-[11px] text-green-800 mt-1">Your Internet Access has been approved!</p>
                  </div>
                )}
                {/* Fallback */}
                {(!user || !['ADMIN', 'MANAGER', 'CONSUMER'].includes(user.role)) && (
                   <p className="text-xs text-gray-500">No new notifications</p>
                )}
              </div>
            )}
          </div>
          {user?.role !== 'CONSUMER' && (
             <>
               <div title="Workflows">
                 <Copy className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" onClick={() => navigate('/')} />
               </div>
               <div title="Audit Logs">
                 <FileText className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" onClick={() => navigate('/executions')} />
               </div>
             </>
          )}
        </div>
        <div className="flex flex-col items-center gap-4">
          <Settings className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
          
          <div title="Toggle Dark Mode">
            <Moon 
              className="w-6 h-6 text-gray-500 cursor-pointer hover:text-blue-600 dark:text-gray-300"
              onClick={() => setIsDarkMode(!isDarkMode)}
            />
          </div>
          
          <div title="Logout">
            <LogOut 
               className="w-6 h-6 text-red-500 cursor-pointer hover:text-red-600 dark:text-red-400"
               onClick={handleLogout}
            />
          </div>
      </div>
      </aside>
      
      {/* Contacts Sidebar */}
      {showContacts && (
        <ContactsSidebar onClose={() => setShowContacts(false)} />
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden dark:bg-gray-800">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
          </div>
        }>
          <Routes>
            <Route path="/" element={
              user?.role === 'ADMIN' ? <AdminDashboard /> :
              user?.role === 'MANAGER' ? <ManagerDashboard /> :
              <HomePage />
            } />
            <Route path="/manager" element={user?.role === 'MANAGER' ? <ManagerDashboard /> : <Navigate to="/" replace />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/" replace />} />
            <Route path="/workflow/:id" element={<WorkflowEditor />} />
            <Route path="/executions" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;