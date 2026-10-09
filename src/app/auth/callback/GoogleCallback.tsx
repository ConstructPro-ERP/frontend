"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/slices/authSlice";
import { clearTokens, setAccessToken } from "@/lib/token";
import { completeGoogleLogin } from "@/services/googleAuth";
import { needsRoleSelection } from "@/services/roles";

export default function GoogleCallback() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const request = useRef<ReturnType<typeof completeGoogleLogin> | null>(null);

  useEffect(() => {
    let active = true;
    if (!request.current) {
      const hash = window.location.hash;
      // Remove credentials from browser history before making any requests.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
      dispatch(loginStart());
      request.current = completeGoogleLogin(hash);
    }
    request.current
      .then(({ accessToken, user }) => {
        if (!active) return;
        // This backend returns no Google refresh token. Discard any old account's token.
        clearTokens();
        setAccessToken(accessToken);
        dispatch(loginSuccess({ user }));
        router.replace(
          needsRoleSelection(user) ? "/auth/select-role" : "/modules",
        );
      })
      .catch(() => {
        if (!active) return;
        const message =
          "Google sign-in could not be completed. Please try again.";
        clearTokens();
        dispatch(loginFailure(message));
        setError(message);
      });
    return () => {
      active = false;
    };
  }, [dispatch, router]);

  return (
    <div className="text-center">
      <h1 className="mb-4 text-3xl font-bold text-on-background">
        {error ? "Unable to sign in" : "Completing your sign in"}
      </h1>
      {error ? (
        <>
          <p role="alert" className="mb-6 text-sm text-error">
            {error}
          </p>
          <Link href="/login" className="font-bold text-action hover:underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <p role="status" className="text-sm text-on-surface-muted">
          Verifying your Google sign-in. Please wait...
        </p>
      )}
    </div>
  );
}
