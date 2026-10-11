"use client";
import { useCallback } from "react";
import { listProjectManagers } from "@/services/projectManagersApi";
import { useProjectData } from "./useProjectData";
import type { Field } from "./ProjectUI";

export function useProjectManagers(enabled: boolean) {
  const load = useCallback(
    () => (enabled ? listProjectManagers() : Promise.resolve([])),
    [enabled],
  );
  const result = useProjectData(load);
  const field: Field = result.data?.length
    ? {
        name: "projectManagerId",
        label: "Project manager",
        required: true,
        type: "select",
        options: [
          { value: "", label: "Select a project manager" },
          ...result.data.map((user) => ({
            value: user.id,
            label: `${user.fullName} (${user.email})`,
          })),
        ],
      }
    : {
        name: "projectManagerId",
        label: "Project manager ID",
        required: true,
        hint: result.loading
          ? "Loading managers. You may also enter an active manager's UUID."
          : "Enter an active project manager's UUID. The directory is currently unavailable or has no active managers.",
      };
  return { ...result, field };
}
