"use client";

import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("dashboard-theme", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("dashboard-theme", listener);
  };
}
let fallbackTheme = "light";
function readTheme() {
  try {
    return localStorage.getItem("cp-theme") === "dark" ? "dark" : "light";
  } catch {
    return fallbackTheme;
  }
}
export function useHomeTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");
  const toggleTheme = () => {
    fallbackTheme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("cp-theme", fallbackTheme);
    } catch {
      /* Storage may be disabled. */
    }
    window.dispatchEvent(new Event("dashboard-theme"));
  };
  return { theme, toggleTheme };
}
