export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  bio?: string | null;
  avatarUrl: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}
export type { LoginCredentials as LoginCredentialsType, RegisterData as RegisterDataType };
