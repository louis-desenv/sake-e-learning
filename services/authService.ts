// authService.ts - Integration with ASP.NET Core Identity API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-url.com/api';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiration: string;
  user: {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

class AuthService {
  private readonly baseUrl = API_BASE_URL;

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  /**
   * Logout user (optional - if API has logout endpoint)
   */
  async logout(token: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  /**
   * Get current user info
   */
  async getCurrentUser(token: string): Promise<AuthResponse['user']> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Validate token (check if still valid)
   */
  isTokenExpired(expiration: string): boolean {
    const expirationDate = new Date(expiration);
    return expirationDate.getTime() < Date.now();
  }

  /**
   * Get authorization header
   */
  getAuthHeader(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
}

export const authService = new AuthService();
