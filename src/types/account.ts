export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  auth_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  auth_level: number;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  auth_level?: number;
  is_active?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
} 