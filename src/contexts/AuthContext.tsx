import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'ADMIN' | 'MANAGER' | 'CONSUMER';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  role: Role;
  managerId?: string; // If consumer, the manager they're assigned to
  adminId?: string; // If manager, the admin they're assigned to
  plan?: string;
  days?: number;
  rentAmount?: number;
  dateOfRentPaid?: string;
  isInternetActive?: boolean;
}


interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
