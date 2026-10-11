"use client";
import { useCallback } from "react";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
} from "@/services/tasksApi";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";
import type { ResourceQuery } from "@/services/projectResources";
import { isUuid } from "@/lib/projectRules";
import ResourceSection from "./ResourceSection";
import { Badge, date, label } from "./ProjectUI";
export default function TasksSection({
  projectId,
  canManage,
}: {
  projectId: string;
  canManage: boolean;
}) {
  const load = useCallback(
    (query: ResourceQuery) => listTasks(projectId, query),
    [projectId],
  );
  const input = (v: Record<string, string>) => ({
    taskName: v.taskName.trim(),
    description: v.description?.trim(),
    dueDate: v.dueDate || null,
    milestoneId: v.milestoneId?.trim() || null,
  });
  return (
    <ResourceSection<Task>
      title="Tasks"
      singular="task"
      description="Manage day-to-day work. Completed tasks do not replace weighted milestone progress."
      canWrite={canManage}
      canDelete={canManage}
      load={load}
      fields={[
        { name: "taskName", label: "Task name", required: true },
        { name: "dueDate", label: "Due date", type: "date" },
        {
          name: "milestoneId",
          label: "Milestone ID (optional)",
          hint: "Use a milestone UUID from this project.",
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      initial={(item) => ({
        taskName: item?.taskName ?? "",
        dueDate: item?.dueDate?.slice(0, 10) ?? "",
        milestoneId: item?.milestoneId ?? "",
        description: item?.description ?? "",
      })}
      validate={(v) =>
        !v.taskName?.trim()
          ? "Task name is required."
          : v.milestoneId && !isUuid(v.milestoneId.trim())
            ? "Enter a valid milestone UUID."
            : null
      }
      create={(v) => createTask({ ...input(v), projectId })}
      update={(item, v) => updateTask(item.id, input(v))}
      remove={deleteTask}
      filters={[
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "", label: "All statuses" },
            ...TASK_STATUSES.map((value) => ({ value, label: label(value) })),
          ],
        },
        { name: "milestoneId", label: "Milestone UUID" },
        { name: "assignedToId", label: "Assigned user UUID" },
        {
          name: "sortBy",
          label: "Sort by",
          type: "select",
          options: [
            { value: "", label: "Default" },
            { value: "createdAt", label: "Created date" },
            { value: "dueDate", label: "Due date" },
            { value: "taskName", label: "Task name" },
          ],
        },
        {
          name: "sortOrder",
          label: "Order",
          type: "select",
          options: [
            { value: "", label: "Default" },
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ],
        },
      ]}
      columns={[
        {
          label: "Task",
          render: (item) => (
            <>
              <p className="font-semibold">
                {item.status === "COMPLETED" ? "✓ " : ""}
                {item.taskName}
              </p>
              <p className="mt-1 max-w-xs text-xs text-on-surface-muted">
                {item.description}
              </p>
            </>
          ),
        },
        {
          label: "Assigned to",
          render: (item) =>
            item.assignedTo?.fullName ?? item.assignedToId ?? "Unassigned",
        },
        {
          label: "Milestone",
          render: (item) => (
            <span className="break-all text-xs">
              {item.milestoneId ?? "Project task"}
            </span>
          ),
        },
        { label: "Due date", render: (item) => date(item.dueDate) },
        { label: "Status", render: (item) => <Badge status={item.status} /> },
      ]}
      actions={[
        {
          label: "Status",
          title: "Update task status",
          fields: [
            {
              name: "status",
              label: "Status",
              type: "select",
              options: TASK_STATUSES.map((value) => ({
                value,
                label: label(value),
              })),
            },
          ],
          initial: (item) => ({ status: item.status }),
          save: (item, v) => updateTaskStatus(item.id, v.status as TaskStatus),
        },
        {
          label: "Assign",
          title: "Assign task",
          fields: [
            {
              name: "assignedToId",
              label: "Assigned user UUID",
              hint: "Leave blank to unassign this task.",
            },
          ],
          initial: (item) => ({ assignedToId: item.assignedToId ?? "" }),
          validate: (v) =>
            v.assignedToId && !isUuid(v.assignedToId.trim())
              ? "Enter a valid user UUID."
              : null,
          save: (item, v) =>
            assignTask(item.id, v.assignedToId?.trim() || null),
        },
      ]}
    />
  );
}
