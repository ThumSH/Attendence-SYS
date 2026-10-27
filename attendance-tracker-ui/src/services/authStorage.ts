import type {
  AuthUser,
  LoginResponse,
} from "../types/auth";

const TOKEN_KEY =
  "attendance_auth_token";

const USER_KEY =
  "attendance_auth_user";

const EXPIRES_KEY =
  "attendance_auth_expires";

export function saveAuthSession(
  response: LoginResponse
) {
  localStorage.setItem(
    TOKEN_KEY,
    response.token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(response.user)
  );

  localStorage.setItem(
    EXPIRES_KEY,
    response.expiresAtUtc
  );
}

export function getAuthToken() {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

export function getAuthUser():
AuthUser | null {
  const value =
    localStorage.getItem(
      USER_KEY
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as AuthUser;
  } catch {
    return null;
  }
}

export function isSessionExpired() {
  const expires =
    localStorage.getItem(
      EXPIRES_KEY
    );

  if (!expires) {
    return true;
  }

  const expiresAt =
    new Date(expires)
      .getTime();

  return (
    Number.isNaN(expiresAt)
    ||
    Date.now() >= expiresAt
  );
}

export function clearAuthSession() {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );

  localStorage.removeItem(
    EXPIRES_KEY
  );
}

export function hasValidSession() {
  return (
    !!getAuthToken()
    &&
    !isSessionExpired()
  );
}