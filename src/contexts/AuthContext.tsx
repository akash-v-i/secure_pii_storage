import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, captcha: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const mockUsers: Record<string, { password: string; role: UserRole; name: string }> = {
  'admin@vault.com': { password: 'admin123', role: 'admin', name: 'Admin User' },
  'user@vault.com': { password: 'user123', role: 'user', name: 'Demo User' },
  'auditor@vault.com': { password: 'auditor123', role: 'auditor', name: 'Auditor User' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = async (email: string, password: string, captcha: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple captcha validation (in real app, this would be server-side)
    if (captcha.toLowerCase() !== 'secure') {
      return false;
    }
    
    const mockUser = mockUsers[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setAuthState({
        user: {
          id: crypto.randomUUID(),
          username: mockUser.name,
          email: email.toLowerCase(),
          role: mockUser.role,
          lastLogin: new Date(),
        },
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
