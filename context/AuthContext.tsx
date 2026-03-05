/**
 * Authentication Context
 *
 * React Context provider for managing application-wide authentication state.
 * Handles login, logout, registration, token management, and automatic token refresh.
 *
 * @fileoverview This context provides authentication state and functions to all
 * child components, integrating with the auth service for API communication and
 * localStorage for session persistence.
 *
 * @dependencies react, ../services/authService
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthResponse, LoginRequest, RegisterRequest } from '../services/authService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Authentication context type definition.
 * Contains all auth state values and functions exposed to consumers.
 *
 * @interface AuthContextType
 */
interface AuthContextType {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether auth status is being checked */
  isLoading: boolean;
  /** Current authenticated user data */
  user: AuthResponse['user'] | null;
  /** Current JWT access token */
  token: string | null;
  /** Function to log in with email/password */
  login: (data: LoginRequest) => Promise<void>;
  /** Function to register a new account */
  register: (data: RegisterRequest) => Promise<void>;
  /** Function to log out current user */
  logout: () => Promise<void>;
  /** Function to refresh the access token */
  refreshAuth: () => Promise<void>;
}

/**
 * Props for the AuthProvider component.
 *
 * @interface AuthProviderProps
 */
interface AuthProviderProps {
  /** Child components to wrap with auth context */
  children: ReactNode;
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

/**
 * Authentication context object.
 * Create context with undefined default value (validated by useAuth hook).
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Authentication context provider component.
 *
 * Manages authentication state across the application, handling login/logout/registration,
 * token management, automatic token refresh, and localStorage persistence.
 *
 * @component AuthProvider
 * @param {AuthProviderProps} props - Component props
 * @returns {JSX.Element} Context provider wrapping children
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 *
 * @remarks
 * - Automatically initializes auth state from localStorage on mount
 * - Attempts to refresh expired tokens automatically
 * - Stores token, expiration, and user data in localStorage
 * - All auth errors are thrown (not caught internally) for handling by UI
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /**
   * Initialize auth state from localStorage on mount.
   * Checks for stored token and validates expiration.
   * Attempts token refresh if expired but refresh token available.
   */
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

  /**
   * Sets authentication data from a successful auth response.
   * Updates state and persists to localStorage.
   *
   * @param {AuthResponse} response - Auth response with token and user data
   */
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

  /**
   * Clears all authentication data.
   * Resets state and removes from localStorage.
   */
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

  /**
   * Logs in a user with email and password.
   *
   * @async
   * @param {LoginRequest} data - Login credentials
   * @throws {Error} When login fails (invalid credentials, server error, etc.)
   */
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

  /**
   * Registers a new user account and logs them in.
   *
   * @async
   * @param {RegisterRequest} data - Registration details
   * @throws {Error} When registration fails (validation error, duplicate email, etc.)
   */
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

  /**
   * Logs out the current user.
   * Notifies backend to invalidate session and clears local data.
   *
   * @async
   */
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

  /**
   * Refreshes the access token using the stored refresh token.
   *
   * @async
   * @throws {Error} When refresh token is invalid or expired
   */
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

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Custom hook for consuming the authentication context.
 *
 * Provides access to authentication state and functions throughout the application.
 * Must be used within an AuthProvider component.
 *
 * @function useAuth
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} When used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginPage onLogin={login} />;
 *   }
 *
 *   return <Welcome user={user} onLogout={logout} />;
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
