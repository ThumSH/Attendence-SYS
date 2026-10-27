/* eslint-disable preserve-caught-error */
import {
  API_BASE_URL,
} from "../config";
import {
  clearAuthSession,
  getAuthToken,
} from "./authStorage";

export class ApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiRequestOptions
  extends RequestInit {
  timeout?: number;
}

export async function apiRequest<T>(
    
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    timeout = 15000,
    headers,
    ...requestOptions
  } = options;

  const controller =
    new AbortController();

  const timeoutId = window.setTimeout(
    () => {
      controller.abort();
    },
    timeout
  );

  const token =
  getAuthToken();

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...requestOptions,

        signal: controller.signal,

       headers: {
  Accept: "application/json",

  ...(token
    ? {
        Authorization:
          `Bearer ${token}`,
      }
    : {}),

  ...headers,
},
      }
    );

    if (response.status === 401) {
  clearAuthSession();
}

    if (!response.ok) {
      let message =
        `Request failed with status ${response.status}.`;

      try {
        const errorBody =
          await response.json();

        if (
          errorBody &&
          typeof errorBody.message ===
            "string"
        ) {
          message =
            errorBody.message;
        }
      } catch {
        // Response did not contain JSON.
      }

      throw new ApiError(
        message,
        response.status
      );
    }

    if (
      response.status === 204
    ) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (
      error instanceof ApiError
    ) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "The attendance server did not respond in time."
      );
    }

    throw new Error(
      "Unable to connect to the attendance server."
    );
  } finally {
    window.clearTimeout(
      timeoutId
    );
  }
}