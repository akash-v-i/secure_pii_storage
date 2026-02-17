import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types/auth';
import { authAPI, isTokenExpired } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: number;
  role: string;
  exp: number;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, captcha: string, captcha_id?: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string, captcha: string, captcha_id?: string) => Promise<{ success: boolean; message?: string }>;
  hasRole: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        if (isTokenExpired(token)) {
          // Token expired, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setIsLoading(false);
          return;
        }

        try {
          // Get user info from API
          const userData = await authAPI.getCurrentUser();
          setAuthState({
            user: {
              id: userData.id.toString(),
              username: userData.username,
              email: userData.email,
              role: userData.role as UserRole,
              lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
            },
            isAuthenticated: true,
          });
        } catch (error: unknown) {
          // Token invalid or expired - log for debugging
          const apiError = error as { response?: { status?: number }, message?: string };
          console.error('Failed to get current user:', apiError.response?.status, apiError.message);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const register = async (
    email: string,
    password: string,
    name: string,
    captcha: string,
    captcha_id?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.register(email, password, name, captcha, captcha_id);

      if (response.success && response.access_token) {
        // Store token
        localStorage.setItem('access_token', response.access_token);

        // Decode token to get user info
        const decoded = jwtDecode<DecodedToken>(response.access_token);

        // Get full user data
        const userData = await authAPI.getCurrentUser();

        setAuthState({
          user: {
            id: userData.id.toString(),
            username: userData.username,
            email: userData.email,
            role: userData.role as UserRole,
            lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
          },
          isAuthenticated: true,
        });

        return { success: true, message: response.message };
      }

      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } }, message?: string };
      const message =
        apiError.response?.data?.detail || apiError.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const login = async (email: string, password: string, captcha: string, captcha_id?: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password, captcha, captcha_id);

      // Store token
      localStorage.setItem('access_token', response.access_token);

      // Set user state
      setAuthState({
        user: {
          id: response.user.id.toString(),
          username: response.user.username,
          email: response.user.email,
          role: response.user.role as UserRole,
          lastLogin: response.user.lastLogin ? new Date(response.user.lastLogin) : undefined,
        },
        isAuthenticated: true,
      });

      return true;
    } catch (error: unknown) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, register, hasRole, isLoading }}>
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
