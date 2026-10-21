import { createContext, useContext } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Resolves with the signed-in user so callers can route by role. */
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  isInstructor: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
