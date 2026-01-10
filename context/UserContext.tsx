import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types';

interface UserContextType {
  user: UserProfile | null;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = UserContext.Provider;

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
