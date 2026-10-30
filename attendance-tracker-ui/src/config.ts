const DEFAULT_API_BASE_URL =
  "http://localhost:5266";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  DEFAULT_API_BASE_URL;