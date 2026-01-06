
import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types';

const UserContext = createContext<UserProfile | null>(null);

export const UserProvider = UserContext.Provider;

export const useUser = (): UserProfile => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');  
  }
  return context;
};
