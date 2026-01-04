export type UserRole = 'user' | 'admin' | 'auditor';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
