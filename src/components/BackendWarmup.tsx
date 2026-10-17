"use client";

import { useEffect } from "react";
import { warmBackendServices } from "@/services/backendWarmup";

export default function BackendWarmup() {
  useEffect(() => {
    warmBackendServices();
  }, []);

  return null;
}
