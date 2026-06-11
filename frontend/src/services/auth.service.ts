import apiClient from '../api/client';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/auth';

export interface SendOtpResponse {
  message: string;
  devCode?: string; // only in dev when SMTP not configured
}

export interface VerifyOtpData {
  email: string;
  code: string;
}

const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  async sendOtp(email: string, password: string): Promise<SendOtpResponse> {
    return apiClient.post<SendOtpResponse>('/auth/send-otp', { email, password });
  },

  async verifyOtp(email: string, code: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/verify-otp', { email, code });
  },

  async getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },
};

export default AuthService;

