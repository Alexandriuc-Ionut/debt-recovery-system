import { apiFetch } from './api';
import type { LoginResponse } from '@/types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  companyName: string;
  companyCui?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCounty?: string;
  companyPhone?: string;
  companyEmail?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(data: RegisterPayload): Promise<{ message: string }> {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
};
