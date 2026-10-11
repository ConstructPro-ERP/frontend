"use client";
import { useCallback } from "react";
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  updateMilestoneProgress,
} from "@/services/milestonesApi";
import {
  MILESTONE_STATUSES,
  type Milestone,
  type MilestoneInput,
  type MilestoneStatus,
} from "@/types/milestone";
import type { ResourceQuery } from "@/services/projectResources";
import ResourceSection from "./ResourceSection";
import { Badge, date, label } from "./ProjectUI";
export default function MilestonesSection({
  projectId,
  canManage,
  onChanged,
}: {
  projectId: string;
  canManage: boolean;
  onChanged: () => void;
}) {
  const load = useCallback(
    (query: ResourceQuery) => listMilestones(projectId, query),
    [projectId],
  );
  const input = (v: Record<string, string>): MilestoneInput => ({
    milestoneName: v.milestoneName.trim(),
    description: v.description?.trim(),
    dueDate: v.dueDate || null,
    weight: Number(v.weight),
    status: v.status as MilestoneStatus,
  });
  return (
    <ResourceSection<Milestone>
      title="Milestones"
      singular="milestone"
      description="Track delivery stages. Milestone weights determine overall project progress."
      canWrite={canManage}
      canDelete={canManage}
      load={load}
      onChanged={onChanged}
      fields={[
        { name: "milestoneName", label: "Milestone name", required: true },
        { name: "dueDate", label: "Due date", type: "date" },
        {
          name: "weight",
          label: "Weight (1–10)",
          type: "number",
          required: true,
          min: 1,
          max: 10,
          step: "1",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: MILESTONE_STATUSES.map((value) => ({
            value,
            label: label(value),
          })),
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      initial={(item) => ({
        milestoneName: item?.milestoneName ?? "",
        dueDate: item?.dueDate?.slice(0, 10) ?? "",
        weight: String(item?.weight ?? 1),
        status: item?.status ?? "PENDING",
        description: item?.description ?? "",
      })}
      validate={(v) =>
        !v.milestoneName?.trim()
          ? "Milestone name is required."
          : !Number.isInteger(Number(v.weight)) ||
              Number(v.weight) < 1 ||
              Number(v.weight) > 10
            ? "Weight must be an integer between 1 and 10."
            : null
      }
      create={(v) => createMilestone(projectId, input(v))}
      update={(item, v) => updateMilestone(item.id, input(v))}
      remove={deleteMilestone}
      deleteDescription="Milestones with associated tasks cannot be deleted. Delete or move their tasks first. This action cannot be undone."
      columns={[
        {
          label: "Milestone",
          render: (item) => (
            <>
              <p className="font-semibold">{item.milestoneName}</p>
              <p className="mt-1 max-w-xs text-xs text-on-surface-muted">
                {item.description}
              </p>
            </>
          ),
        },
        { label: "Due date", render: (item) => date(item.dueDate) },
        { label: "Weight", render: (item) => item.weight ?? "Not available" },
        {
          label: "Progress",
          render: (item) =>
            item.progress == null ? "Not available" : item.progress + "%",
        },
        { label: "Status", render: (item) => <Badge status={item.status} /> },
      ]}
      actions={[
        {
          label: "Progress",
          title: "Update milestone progress",
          fields: [
            {
              name: "progress",
              label: "Progress (%)",
              type: "number",
              required: true,
              min: 0,
              max: 100,
              step: "1",
            },
          ],
          initial: (item) => ({ progress: String(item.progress ?? 0) }),
          validate: (v) =>
            !Number.isFinite(Number(v.progress)) ||
            Number(v.progress) < 0 ||
            Number(v.progress) > 100
              ? "Progress must be between 0 and 100."
              : null,
          save: (item, v) =>
            updateMilestoneProgress(item.id, Number(v.progress)),
        },
      ]}
    />
  );
}
