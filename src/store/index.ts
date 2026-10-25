// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { dashboardQueryCache } from "@/lib/dashboardQueryCache";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

let cacheOwner = "";
store.subscribe(() => {
  const user = store.getState().auth.user;
  const owner = JSON.stringify([user?.id, user?.role]);
  if (owner !== cacheOwner) {
    cacheOwner = owner;
    dashboardQueryCache.clear();
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
