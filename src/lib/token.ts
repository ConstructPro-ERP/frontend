// src/lib/token.ts
const REFRESH_TOKEN_KEY = "construct_pro_refresh_token";
const ACCESS_TOKEN_KEY = "construct_pro_access_token";

/**
 * Get refresh token from localStorage safely
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to retrieve refresh token from localStorage", error);
    return null;
  }
};

/**
 * Get access token from localStorage safely
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to retrieve access token from localStorage", error);
    return null;
  }
};

/**
 * Set refresh token in localStorage safely
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.warn("Failed to save refresh token to localStorage", error);
    }
  }
};

/**
 * Set access token in localStorage safely
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.warn("Failed to save access token to localStorage", error);
    }
  }
};

/**
 * Clear refresh token from localStorage safely
 */
export const clearTokens = (): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.warn("Failed to remove refresh token from localStorage", error);
    }
  }
};
