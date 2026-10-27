import {
  apiRequest,
} from "./apiClient";

import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from "../types/auth";

export async function login(
  request: LoginRequest
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          request
        ),
    }
  );
}

export async function getCurrentUser():
Promise<AuthUser> {
  return apiRequest<AuthUser>(
    "/api/auth/me"
  );
}