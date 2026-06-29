/**
 * API Client Service
 *
 * Axios-based HTTP client for backend API communication.
 * Provides typed methods for authentication operations and Google OAuth integration.
 *
 * @fileoverview This module creates a configured Axios instance and provides
 * authentication services including login, registration, and Google OAuth redirect.
 *
 * @dependencies axios, ../types
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import axios from 'axios';
import { AuthResponse } from '../types';
import { getAuthApiUrl } from '../utils/apiUrl';
import { GOOGLE_LOGIN_TOUR_PENDING_KEY } from '../utils/featureTourState';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for the backend API.
 * Uses VITE_API_URL env var, falling back to localhost in development.
 *
 * @constant {string}
 */
const API_URL = getAuthApiUrl();

/**
 * Configured Axios instance for API requests.
 * Pre-configured with base URL and JSON headers.
 *
 * @constant {AxiosInstance}
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// AUTHENTICATION SERVICES
// ============================================================================

/**
 * Authentication service object containing auth-related API methods.
 *
 * @namespace authService
 */
export const authService = {
  /**
   * Authenticates a user with email and password.
   *
   * @async
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} Authentication response with token and user data
   * @throws {AxiosError} When authentication fails
   *
   * @example
   * ```ts
   * try {
   *   const authData = await authService.login('user@example.com', 'password123');
   *   console.log('Logged in:', authData.user);
   * } catch (error) {
   *   console.error('Login failed:', error);
   * }
   * ```
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', { email, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const token = localStorage.getItem('auth_token');
    const response = await api.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      success: true,
      message: 'User loaded',
      user: response.data,
    };
  },

  /**
   * Registers a new user account.
   *
   * @async
   * @param {string} name - User's display name
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} Authentication response for the new user
   * @throws {AxiosError} When registration fails (duplicate email, validation, etc.)
   *
   * @example
   * ```ts
   * try {
   *   const authData = await authService.register('John Doe', 'john@example.com', 'SecurePass123!');
   *   console.log('Account created:', authData.user);
   * } catch (error) {
   *   console.error('Registration failed:', error);
   * }
   * ```
   */
  register: async (
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/forgot-password', {
      email,
      returnUrl: window.location.origin,
    }, {
      timeout: 20000,
    });
    return response.data;
  },

  resetPassword: async (email: string, token: string, newPassword: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/reset-password', {
      email,
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Initiates Google OAuth login flow.
   * Redirects the browser to the backend's Google OAuth endpoint.
   *
   * @remarks This method performs a browser redirect and does not return.
   * The user will be redirected back to the app after Google authentication.
   *
   * @example
   * ```ts
   * // User clicks "Sign in with Google" button
   * authService.googleLogin();
   * // Browser redirects to Google, then back to app
   * ```
   */
  googleLogin: () => {
    // Redirect browser to backend Google login endpoint with return URL
    sessionStorage.setItem(GOOGLE_LOGIN_TOUR_PENDING_KEY, 'true');
    const returnUrl = window.location.origin;
    window.location.href = `${API_URL}/google/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  },

  /**
   * Saves onboarding data to the backend API.
   *
   * @async
   * @param {any} data - Onboarding data
   * @returns {Promise<AuthResponse>} Authentication response with updated user data
   */
  saveOnboarding: async (data: any): Promise<AuthResponse> => {
    // Requires authorization header. We'll add it using the token in localStorage
    const token = localStorage.getItem('auth_token');
    const response = await api.put<AuthResponse>('/onboarding', data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  completeFeatureTour: async (): Promise<AuthResponse> => {
    const token = localStorage.getItem('auth_token');
    const response = await api.post<AuthResponse>('/feature-tour/complete', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

/**
 * Default export of the configured Axios instance.
 * Use for making additional API requests beyond the auth service.
 *
 * @example
 * ```ts
 * import api from './services/api';
 *
 * const response = await api.get('/user/profile');
 * ```
 */
export default api;
