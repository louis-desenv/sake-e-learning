import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types';
import { authService } from '../services/authService';

// ========================================
// Contexto do Usuário
// ========================================
interface UserContextType {
  user: UserProfile;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

// ========================================
// Provider
// ========================================
interface UserProviderProps {
  children: React.ReactNode;
  value: UserProfile | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, value }) => {
  if (!value) {
    return null;
  }

  const logout = async () => {
    await authService.logout();
    window.location.hash = '/login';
  };

  return (
    <UserContext.Provider value={{ user: value, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// ========================================
// Hooks
// ========================================
export const useUser = (): UserProfile => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider with a valid user');
  }
  return context.user;
};

// useAuth exportado para MyProfile.tsx
export const useAuth = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return {
    user: context.user,
    isLoggedIn: true,
    logout: context.logout,
  };
};
