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
  const field: Field = {
    name: "projectManagerId",
    label: "Project manager / Admin",
    required: true,
    type: "select",
    options: [
      {
        value: "",
        label: result.loading
          ? "Loading project managers and admins..."
          : result.error
            ? "Unable to load project managers and admins"
            : !result.data?.length
              ? "No active project managers or admins available"
              : "Select a project manager or admin",
      },
      ...(result.data ?? []).map((user) => ({
        value: user.id,
        label: user.fullName,
      })),
    ],
    hint: result.error
      ? `${result.error} Close and reopen this dialog to try again.`
      : undefined,
  };
  return { ...result, field };
}
