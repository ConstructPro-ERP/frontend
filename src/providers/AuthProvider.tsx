"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import { store, type AppDispatch, type RootState } from "@/store";
import {
  authInitializationComplete,
  loginSuccess,
  logout,
} from "@/store/slices/authSlice";
import { getAccessToken, clearTokens } from "@/lib/token";
import apiClient from "@/lib/axios";
import { normalizeAuthUser } from "@/services/googleAuth";
import type { User } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  isFetchingUser: boolean;
  getCurrentUser: (forceRefresh?: boolean) => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Access the shared authentication context.
 *
 * Use getCurrentUser() when a consumer needs the current profile.
 * It returns the Redux-cached user before making an API request.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

type PendingUserRequest = {
  version: number;
  request: Promise<User | null>;
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const { user, sessionVersion } = useSelector(
    (state: RootState) => state.auth,
  );

  const [fetchingVersion, setFetchingVersion] = useState<number | null>(null);

  // Store the in-flight promise so concurrent consumers share one request.
  const pendingRequest = useRef<PendingUserRequest | null>(null);

  const getCurrentUser = useCallback(
    (forceRefresh = false): Promise<User | null> => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        return Promise.resolve(null);
      }

      const authState = store.getState().auth;

      // Redux remains the single source of truth for the cached profile.
      if (authState.user && !forceRefresh) {
        return Promise.resolve(authState.user);
      }

      // Reuse an existing request for this exact session.
      if (pendingRequest.current?.version === authState.sessionVersion) {
        return pendingRequest.current.request;
      }

      const requestVersion = authState.sessionVersion;

      // We have a token in storage, let's validate it and get the user profile.
      // Note: The apiClient automatically attaches the token from localStorage
      // via its request interceptor, so we don't need to pass headers manually.
      const request = apiClient
        .get<unknown>("/auth/me")
        .then((response) => {
          const currentAuth = store.getState().auth;

          // Ignore responses from sessions that have since changed.
          if (
            currentAuth.sessionVersion !== requestVersion ||
            !getAccessToken()
          ) {
            return null;
          }

          const profile = normalizeAuthUser(response.data);

          // The token is valid, fully restore the session.
          dispatch(loginSuccess({ user: profile }));

          return profile;
        })
        .finally(() => {
          if (pendingRequest.current?.version === requestVersion) {
            pendingRequest.current = null;

            setFetchingVersion((current) =>
              current === requestVersion ? null : current,
            );
          }
        });

      pendingRequest.current = {
        version: requestVersion,
        request,
      };

      setFetchingVersion(requestVersion);

      return request;
    },
    [dispatch],
  );

  useEffect(() => {
    // The callback owns session initialization while exchanging accounts.
    // This check is only needed during initial mounting, not navigation.
    if (window.location.pathname === "/auth/callback") {
      return;
    }

    const accessToken = getAccessToken();
    const authState = store.getState().auth;

    if (!accessToken) {
      // No session exists; protected routes can now show their signed-out state.
      if (authState.user) {
        dispatch(logout());
      } else {
        dispatch(authInitializationComplete());
      }

      return;
    }

    // Password login, registration and Google login already store profiles.
    // Do not make an unnecessary /auth/me request for these sessions.
    if (authState.user) {
      dispatch(authInitializationComplete());
      return;
    }

    let active = true;
    const initializationVersion = authState.sessionVersion;

    void getCurrentUser()
      .then((profile) => {
        if (
          active &&
          !profile &&
          store.getState().auth.sessionVersion === initializationVersion
        ) {
          dispatch(authInitializationComplete());
        }
      })
      .catch((error: unknown) => {
        if (
          !active ||
          store.getState().auth.sessionVersion !== initializationVersion
        ) {
          return;
        }

        // Token is invalid, expired, or user deleted. Wipe everything.
        // Preserve the existing fail-closed restoration behavior.
        console.error("Failed to initialize auth session", error);
        clearTokens();
        dispatch(logout());
      });

    return () => {
      active = false;
    };
  }, [dispatch, getCurrentUser]);

  const contextValue: AuthContextValue = {
    user,
    isFetchingUser: fetchingVersion === sessionVersion,
    getCurrentUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
