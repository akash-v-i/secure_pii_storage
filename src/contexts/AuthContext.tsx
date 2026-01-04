import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';

interface RegisteredUser {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, captcha: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => { success: boolean; message?: string };
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Load registered users from localStorage
const getRegisteredUsers = (): Record<string, RegisteredUser> => {
  try {
    const stored = localStorage.getItem('vault_registered_users');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveRegisteredUsers = (users: Record<string, RegisteredUser>) => {
  localStorage.setItem('vault_registered_users', JSON.stringify(users));
};

// Default demo users
const defaultUsers: Record<string, RegisteredUser> = {
  'admin@vault.com': { email: 'admin@vault.com', password: 'Admin123!', role: 'admin', name: 'Admin User' },
  'user@vault.com': { email: 'user@vault.com', password: 'User1234!', role: 'user', name: 'Demo User' },
  'auditor@vault.com': { email: 'auditor@vault.com', password: 'Audit123!', role: 'auditor', name: 'Auditor User' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const getAllUsers = (): Record<string, RegisteredUser> => {
    const registered = getRegisteredUsers();
    return { ...defaultUsers, ...registered };
  };

  const register = (email: string, password: string, name: string): { success: boolean; message?: string } => {
    const normalizedEmail = email.toLowerCase();
    const allUsers = getAllUsers();
    
    if (allUsers[normalizedEmail]) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const registeredUsers = getRegisteredUsers();
    registeredUsers[normalizedEmail] = {
      email: normalizedEmail,
      password,
      name,
      role: 'user',
    };
    saveRegisteredUsers(registeredUsers);
    
    return { success: true };
  };

  const login = async (email: string, password: string, captcha: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (captcha.toLowerCase() !== 'secure') {
      return false;
    }
    
    const allUsers = getAllUsers();
    const user = allUsers[email.toLowerCase()];
    
    if (user && user.password === password) {
      setAuthState({
        user: {
          id: crypto.randomUUID(),
          username: user.name,
          email: email.toLowerCase(),
          role: user.role,
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
    <AuthContext.Provider value={{ ...authState, login, logout, register, hasRole }}>
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
