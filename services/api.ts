import axios from 'axios';
import { AuthResponse } from '../types';

const API_URL = 'http://localhost:8081/api/v1/auth';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/login', { email, password });
        return response.data;
    },

    register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/register', { name, email, password });
        return response.data;
    },

    googleLogin: () => {
        // Redireciona o navegador para o endpoint de login do Google no Backend
        window.location.href = `${API_URL}/google/login`;
    }
};

export default api;
