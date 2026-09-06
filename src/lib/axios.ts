// src/lib/axios.ts
import axios, { AxiosRequestConfig } from "axios";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";
import {
  getRefreshToken,
  setRefreshToken,
  setAccessToken,
  getAccessToken,
  clearTokens,
} from "./token";
import { ApiError } from "./ApiError";
import type { ApiResponse } from "@/types/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let refreshPromise: Promise<string> | null = null;

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;
    const status = error.response?.status;
    const code = responseData?.code;

    // Retry Logic for Network / 5xx Errors
    if (
      !error.response ||
      (status >= 500 && status < 600) ||
      error.code === "ECONNABORTED" ||
      error.message === "Network Error"
    ) {
      originalRequest.retryCount = originalRequest.retryCount || 0;
      const maxRetries = 3;

      if (originalRequest.retryCount < maxRetries) {
        originalRequest.retryCount += 1;
        const delay = Math.pow(2, originalRequest.retryCount - 1) * 1000;
        await new Promise((res) => setTimeout(res, delay));
        return axiosInstance(originalRequest);
      }
    }

    // 401 Refresh Logic
    const isAuthRoute =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register");

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (
        code === "TOKEN_EXPIRED" ||
        code === "TOKEN_INVALID" ||
        code === "TOKEN_MISSING"
      ) {
        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const refreshToken = getRefreshToken();
              const refreshRes = await axios.post(
                `${API_URL}/auth/refresh`,
                { refreshToken },
                { withCredentials: true },
              );

              const refreshData = refreshRes.data?.success
                ? refreshRes.data.data
                : refreshRes.data;
              const newToken: string = refreshData.accessToken;
              const newRefreshToken: string | undefined =
                refreshData.refreshToken;

              setAccessToken(newToken);
              if (newRefreshToken) {
                setRefreshToken(newRefreshToken);
              }

              return newToken;
            } catch (refreshError) {
              clearTokens();
              store.dispatch(logout());
              throw refreshError;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        try {
          const token = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
    }

    // Standardize error as ApiError
    if (responseData) {
      const apiError = new ApiError(
        responseData.message || error.message || "An unknown error occurred",
        responseData.statusCode || status || 500,
        responseData.code || "UNKNOWN_ERROR",
        responseData.details,
        responseData.traceId,
      );
      return Promise.reject(apiError);
    }

    return Promise.reject(
      new ApiError(error.message || "Network Error", 0, "NETWORK_ERROR"),
    );
  },
);

const apiClient = {
  get: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.get<ApiResponse<T>>(url, config);
    return res.data;
  },
  post: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return res.data;
  },
  patch: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return res.data;
  },
  put: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return res.data;
  },
  del: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return res.data;
  },
};

export default apiClient;
