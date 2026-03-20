import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../contexts/AuthContext';

const DUMMY_USERS: (User & { email?: string, password?: string })[] = [
  { id: 'admin1', name: 'Super Admin', role: 'ADMIN', email: 'admin@isp.com', password: 'admin' },
  { id: 'manager1', name: 'Regional Manager', role: 'MANAGER', email: 'manager@isp.com', password: 'password' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isConsumerReg, setIsConsumerReg] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: ''
  });

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');

  const handleLogin = (user: User) => {
    login(user);
    // Redirect based on role
    if (user.role === 'ADMIN') {
      navigate('/admin');
    } else if (user.role === 'MANAGER') {
      navigate('/manager');
    } else {
      navigate('/');
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, password: staffPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setStaffError(data.message || 'Error logging in');
        return;
      }
      setStaffError('');
      const userData: User = {
        ...data.user,
        managerId: data.user.manager_id,
        adminId: data.user.admin_id
      };
      handleLogin(userData);
    } catch (err) {
      setStaffError('Network error connecting to backend.');
    }
  };

  const handleConsumerReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.country) {
      alert('Please fill all fields including region');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/auth/consumer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          region: formData.country  // Send region to match with manager's region
        })
      });
      const data = await res.json();
      console.log('Full response:', data);
      
      if (res.ok && data.consumer) {
        // Use managerId from response or fallback to validManagerId
        const managerId = data.consumer.manager_id || data.consumer.managerId || data.validManagerId || data.debugManagerId;
        console.log('Resolved managerId:', managerId);
        
        const consumerUser: User = {
          id: data.consumer.id,
          name: data.consumer.name,
          email: data.consumer.email,
          phone: data.consumer.phone,
          country: data.consumer.country,
          role: 'CONSUMER' as const,
          managerId: managerId
        };
        console.log('Consumer registered:', consumerUser);
        handleLogin(consumerUser);
      } else {
        alert(data.message || data.error || 'Error occurred during registration');
      }
    } catch (err) {
      alert('Network error connecting to backend.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl max-w-md w-full relative">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-gray-100">ISP Workflow System</h1>
        
        {isConsumerReg ? (
          <div>
            <p className="mb-6 text-center text-gray-500 dark:text-gray-400 text-sm">Consumer Registration</p>
            <form onSubmit={handleConsumerReg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email ID</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                <select 
                  required 
                  value={formData.country} 
                  onChange={e => setFormData({ ...formData, country: e.target.value })} 
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select your region</option>
                  <option value="India">India</option>
                  <option value="US">US</option>
                  <option value="Europe">Europe</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Register & Login
              </button>
            </form>
            <button onClick={() => setIsConsumerReg(false)} className="mt-4 w-full text-sm text-blue-600 hover:underline">
              Switch to Staff Login
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-6 text-center text-gray-500 dark:text-gray-400 text-sm">Staff Access Portal</p>
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Email</label>
                <input required type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="manager@isp.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input required type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="password" />
              </div>
              {staffError && <p className="text-red-500 text-xs font-medium">{staffError}</p>}
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Staff Login
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">Consumer trying to access?</p>
              <button 
                onClick={() => setIsConsumerReg(true)} 
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Consumer Signup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
