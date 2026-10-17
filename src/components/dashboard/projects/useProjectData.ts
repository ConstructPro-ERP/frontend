"use client";
import { useEffect, useState } from "react";
import { errorMessage } from "./ProjectUI";
export function useProjectData<T>(load: () => Promise<T>, revision = 0) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    async function run() {
      setState({ data: null, loading: true, error: "" });
      try {
        const data = await load();
        if (active) setState({ data, loading: false, error: "" });
      } catch (error) {
        if (active)
          setState({ data: null, loading: false, error: errorMessage(error) });
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [load, revision]);
  return state;
}
