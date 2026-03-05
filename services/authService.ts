/**
 * Authentication Service
 *
 * Service layer for integrating with ASP.NET Core Identity API.
 * Handles user registration, login, logout, token refresh, and session management.
 *
 * @fileoverview This service provides methods for all authentication operations,
 * communicating with the backend API using fetch and handling token management.
 *
 * @dependencies None (pure service using native fetch)
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for the authentication API.
 * Falls back to production Railway URL if not specified in environment.
 *
 * @constant {string}
 */
let apiUrl =
  import.meta.env.VITE_API_URL ||
  'https://sakaeelearningwebapi-production-e2c8.up.railway.app/api/v1/auth';

/**
 * Removes extra quotes from environment variable if present.
 * Handles cases where environment variables are incorrectly formatted.
 *
 * @remarks This is a common issue with environment variable configuration
 * in various deployment platforms.
 */
apiUrl = apiUrl.replace(/['"]+/g, '');

/**
 * The final, cleaned API base URL.
 *
 * @constant {string}
 */
const API_BASE_URL = apiUrl;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request payload for user registration.
 *
 * @interface RegisterRequest
 */
export interface RegisterRequest {
  /** User's email address (used as username) */
  email: string;
  /** User's password (will be hashed server-side) */
  password: string;
}

/**
 * Request payload for user login.
 *
 * @interface LoginRequest
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Standard authentication response format expected by AuthContext.
 * Contains tokens, expiration, and user information.
 *
 * @interface AuthResponse
 */
export interface AuthResponse {
  /** JWT access token for API authentication */
  token: string;
  /** Optional refresh token for obtaining new access tokens */
  refreshToken?: string;
  /** ISO 8601 timestamp of token expiration */
  expiration: string;
  /** Authenticated user information */
  user: {
    /** Unique user identifier */
    id: string;
    /** User's email address */
    email: string;
    /** Optional display name */
    name?: string;
    /** Optional array of user roles/permissions */
    roles?: string[];
  };
}

/**
 * Raw response format from ASP.NET Core Identity API.
 * Represents the token data structure returned by the backend.
 *
 * @interface IdentityLoginResponse
 * @private
 */
interface IdentityLoginResponse {
  /** Type of token returned (typically "Bearer") */
  tokenType: string;
  /** The JWT access token */
  accessToken: string;
  /** Token validity duration in seconds */
  expiresIn: number;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
}

/**
 * Standard error response format from the API.
 *
 * @interface ApiError
 */
export interface ApiError {
  /** Human-readable error message */
  message: string;
  /** Optional error title/summary */
  title?: string;
  /** Optional field-specific validation errors */
  errors?: Record<string, string[]>;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Authentication service class.
 * Provides methods for all authentication operations with the backend API.
 *
 * @class AuthService
 */
class AuthService {
  /** Base URL for all authentication endpoints */
  private readonly baseUrl = API_BASE_URL;

  /**
   * Converts Identity API response to the format expected by AuthContext.
   * Calculates expiration date and derives user information.
   *
   * @private
   * @param {IdentityLoginResponse} response - Raw response from Identity API
   * @param {string} email - User's email for name derivation
   * @returns {AuthResponse} Formatted authentication response
   *
   * @example
   * ```ts
   * const formatted = this.convertResponse(identityResponse, 'user@example.com');
   * // Returns: { token: '...', user: { name: 'user', ... } }
   * ```
   */
  private convertResponse(response: IdentityLoginResponse, email: string): AuthResponse {
    // Calculate expiration date from expiresIn seconds
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + response.expiresIn);

    return {
      token: response.accessToken,
      refreshToken: response.refreshToken,
      expiration: expirationDate.toISOString(),
      user: {
        id: 'current', // API doesn't return ID on login
        email: email,
        name: email.split('@')[0], // Use email prefix as display name
      },
    };
  }

  /**
   * Registers a new user account.
   * Creates the account and automatically logs in the user.
   *
   * @async
   * @param {RegisterRequest} data - Registration credentials
   * @returns {Promise<AuthResponse>} Authentication data for the new user
   * @throws {Error} When registration fails (invalid email, weak password, etc.)
   *
   * @example
   * ```ts
   * try {
   *   const authData = await authService.register({
   *     email: 'user@example.com',
   *     password: 'SecurePass123!'
   *   });
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   * ```
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.title || error.message || 'Registration failed');
    }

    // Auto-login after successful registration
    return this.login({ email: data.email, password: data.password });
  }

  /**
   * Authenticates a user with email and password.
   *
   * @async
   * @param {LoginRequest} data - Login credentials
   * @returns {Promise<AuthResponse>} Authentication data including tokens
   * @throws {Error} When credentials are invalid or login fails
   *
   * @example
   * ```ts
   * try {
   *   const authData = await authService.login({
   *     email: 'user@example.com',
   *     password: 'SecurePass123!'
   *   });
   *   // Store token and navigate to app
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Login failed';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.title || error.message || 'Invalid credentials';
      } catch {
        errorMessage = errorText || 'Invalid credentials';
      }
      throw new Error(errorMessage);
    }

    const result: IdentityLoginResponse = await response.json();
    return this.convertResponse(result, data.email);
  }

  /**
   * Logs out the current user.
   * Notifies the backend to invalidate the session/token.
   *
   * @async
   * @param {string} [token] - Optional auth token (uses localStorage if not provided)
   * @returns {Promise<void>}
   *
   * @remarks Errors are logged but don't throw, allowing logout to complete
   * even if the backend call fails.
   *
   * @example
   * ```ts
   * await authService.logout();
   * // Clear local state and redirect to login
   * ```
   */
  async logout(token?: string): Promise<void> {
    const authToken = token || localStorage.getItem('authToken');

    if (authToken) {
      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }

  /**
   * Refreshes an expired or expiring access token using a refresh token.
   *
   * @async
   * @param {string} refreshToken - The refresh token from initial login
   * @returns {Promise<AuthResponse>} New authentication data with fresh tokens
   * @throws {Error} When refresh token is invalid or expired
   *
   * @example
   * ```ts
   * try {
   *   const newAuthData = await authService.refreshToken(refreshToken);
   *   // Update stored tokens
   * } catch (error) {
   *   // Force login - refresh token is also expired
   * }
   * ```
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const result: IdentityLoginResponse = await response.json();

    // Retrieve email from localStorage for user info
    const storedUser = localStorage.getItem('user');
    const email = storedUser ? JSON.parse(storedUser).email : 'user';

    return this.convertResponse(result, email);
  }

  /**
   * Checks if an authentication token has expired.
   *
   * @param {string} expiration - ISO 8601 timestamp of token expiration
   * @returns {boolean} True if token is expired, false otherwise
   *
   * @example
   * ```ts
   * if (authService.isTokenExpired(storedExpiration)) {
   *   // Refresh token or logout
   * }
   * ```
   */
  isTokenExpired(expiration: string): boolean {
    const expirationDate = new Date(expiration);
    return expirationDate.getTime() < Date.now();
  }

  /**
   * Constructs an Authorization header with Bearer token.
   *
   * @param {string} token - JWT access token
   * @returns {Record<string, string>} Headers object with Authorization
   *
   * @example
   * ```ts
   * const headers = authService.getAuthHeader(token);
   * fetch('/api/protected', { headers });
   * ```
   */
  getAuthHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

/**
 * Singleton instance of the authentication service.
 * Use this exported instance for all authentication operations.
 *
 * @constant {AuthService}
 */
export const authService = new AuthService();
