export interface AuthUser {
  id: string;
  userName: string;
  fullName: string;
}

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

export interface LoginRequest {
  userName: string;
  password: string;
}