// authService.ts - Integration with ASP.NET Core Identity API

// API URL from environment or default to local
let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5259';

// Remove aspas extras se existirem (comum em env vars mal configuradas)
apiUrl = apiUrl.replace(/['"]+/g, '');

const API_BASE_URL = apiUrl;

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Formato esperado pelo AuthContext.tsx
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

// Formato retornado pela API do Identity
interface IdentityLoginResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  title?: string;
  errors?: Record<string, string[]>;
}

class AuthService {
  private readonly baseUrl = API_BASE_URL;

  /**
   * Converte resposta do Identity para formato esperado pelo AuthContext
   */
  private convertResponse(response: IdentityLoginResponse, email: string): AuthResponse {
    // Calcula data de expiração
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + response.expiresIn);

    return {
      token: response.accessToken,
      refreshToken: response.refreshToken,
      expiration: expirationDate.toISOString(),
      user: {
        id: 'current', // API não retorna ID no login
        email: email,
        name: email.split('@')[0], // Usa parte do email como nome
      },
    };
  }

  /**
   * Register a new user
   * Endpoint nativo do Identity: POST /register
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

    // Após registro, faz login automático
    return this.login({ email: data.email, password: data.password });
  }

  /**
   * Login user
   * Endpoint nativo do Identity: POST /login
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
   * Logout user
   * Endpoint customizado: POST /logout
   */
  async logout(token?: string): Promise<void> {
    const authToken = token || localStorage.getItem('authToken');
    
    if (authToken) {
      try {
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  }

  /**
   * Refresh access token
   * Endpoint nativo: POST /refresh
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
    
    // Recupera email do localStorage
    const storedUser = localStorage.getItem('user');
    const email = storedUser ? JSON.parse(storedUser).email : 'user';
    
    return this.convertResponse(result, email);
  }

  /**
   * Check if token is expired
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
