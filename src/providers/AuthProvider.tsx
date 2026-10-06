"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { loginSuccess, logout } from "@/store/slices/authSlice";
import { getAccessToken, clearTokens } from "@/lib/token";
import apiClient from "@/lib/axios";
import { normalizeAuthUser } from "@/services/googleAuth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  useEffect(() => {
    // The callback owns session initialization while exchanging accounts.
    if (pathname === "/auth/callback") return;
    let active = true;
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
        const res = await apiClient.get<unknown>("/auth/me");
        if (!active) return;

        // The token is valid, fully restore the session
        dispatch(
          loginSuccess({
            user: normalizeAuthUser(res.data),
          }),
        );
      } catch (error) {
        if (!active) return;
        // Token is invalid, expired, or user deleted. Wipe everything.
        console.error("Failed to initialize auth session", error);
        clearTokens();
        dispatch(logout());
      }
    };

    initializeAuth();
    return () => {
      active = false;
    };
  }, [dispatch, pathname]);

  return <>{children}</>;
}
