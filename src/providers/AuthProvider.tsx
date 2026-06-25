"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { getAccessToken, clearTokens } from "@/lib/token";
import apiClient from "@/lib/axios";
import type { User } from "@/types/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        // No token in storage, just remain logged out
        return;
      }

      try {
        // We have a token in storage, let's validate it and get the user profile.
        // Note: The apiClient automatically attaches the token from localStorage
        // via its request interceptor, so we don't need to pass headers manually.
        const res = await apiClient.get<User>("/auth/me");

        // The token is valid, fully restore the session
        dispatch(
          loginSuccess({
            user: res.data,
          }),
        );
      } catch (error) {
        // Token is invalid, expired, or user deleted. Wipe everything.
        console.error("Failed to initialize auth session", error);
        clearTokens();
        dispatch(logout());
      }
    };

    initializeAuth();
  }, [dispatch]);

  return <>{children}</>;
}
