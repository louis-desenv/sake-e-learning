// AuthContext.tsx - Authentication state management

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedExpiration = localStorage.getItem('tokenExpiration');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedExpiration && storedUser) {
          // Check if token is expired
          if (authService.isTokenExpired(storedExpiration)) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              try {
                const response = await authService.refreshToken(refreshToken);
                setAuthData(response);
              } catch (error) {
                console.error('Token refresh failed:', error);
                clearAuthData();
              }
            } else {
              clearAuthData();
            }
          } else {
            // Token is still valid
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setAuthData = (response: AuthResponse) => {
    setToken(response.token);
    setUser(response.user);
    setIsAuthenticated(true);

    // Store in localStorage
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('tokenExpiration', response.expiration);
    localStorage.setItem('user', JSON.stringify(response.user));
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
  };

  const clearAuthData = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.login(data);
      setAuthData(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      setAuthData(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      setAuthData(response);
    } catch (error) {
      clearAuthData();
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    token,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
