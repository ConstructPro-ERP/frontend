// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "@/types/auth";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  // Keep protected routes in a loading state until AuthProvider restores the
  // session from storage (or confirms that no session exists).
  isLoading: true,
  error: null,
  sessionVersion: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      // Starting a new login invalidates the previous user's cached identity.
      state.sessionVersion += 1;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = true;
      state.error = null;
    },

    loginSuccess(state, action: PayloadAction<{ user: User }>) {
      state.sessionVersion += 1;
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.sessionVersion += 1;
      state.user = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
    },

    authInitializationComplete(state) {
      state.isLoading = false;
    },

    logout(state) {
      // Invalidate pending profile requests whenever the session ends.
      state.sessionVersion += 1;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  authInitializationComplete,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
