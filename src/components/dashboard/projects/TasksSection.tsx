"use client";
import { useCallback, useState } from "react";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  listTaskAssignees,
} from "@/services/tasksApi";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types/task";
import {
  listAllResources,
  type ResourceQuery,
} from "@/services/projectResources";
import { listMilestones } from "@/services/milestonesApi";
import {
  validateTask,
  validateTaskFilters,
  validateTaskStatus,
} from "@/lib/projectResourceRules";
import { useProjectData } from "./useProjectData";
import { isUuid } from "@/lib/projectRules";
import ResourceSection from "./ResourceSection";
import { Badge, Notice, date, label, buttonClass } from "./ProjectUI";

interface TaskSectionProps {
  projectId: string;
  canManage: boolean;
}

export default function TasksSection({
  projectId,
  canManage,
}: TaskSectionProps) {
  const load = useCallback(
    (query: ResourceQuery) => listTasks(projectId, query),
    [projectId],
  );
  const [revision, setRevision] = useState(0);
  const loadMilestones = useCallback(
    () => listAllResources((query) => listMilestones(projectId, query)),
    [projectId],
  );
  const loadAssignees = useCallback(
    () => listTaskAssignees(projectId),
    [projectId],
  );
  const milestones = useProjectData(loadMilestones, revision);
  const assignees = useProjectData(loadAssignees, revision);
  const refreshOptions = () => setRevision((value) => value + 1);
  const optionsLoading = milestones.loading || assignees.loading;
  const optionsError = milestones.error || assignees.error;
  const milestoneOptions = (milestones.data ?? []).map((item) => ({
    value: item.id,
    label: item.milestoneName,
  }));
  const assigneeOptions = (assignees.data ?? []).map((user) => ({
    value: user.id,
    label: user.fullName,
  }));
  const input = (v: Record<string, string>) => ({
    taskName: v.taskName.trim(),
    description: v.description?.trim() || null,
    dueDate: v.dueDate ? `${v.dueDate}T00:00:00.000Z` : null,
    milestoneId: v.milestoneId?.trim() || null,
  });
  return (
    <div className="space-y-4">
      {optionsLoading && (
        <p role="status" className="text-sm text-on-surface-muted">
          Loading milestones and team members...
        </p>
      )}
      {optionsError && (
        <Notice error>
          Task selection lists could not be loaded. {optionsError}{" "}
          <button
            type="button"
            className={buttonClass + " ml-2"}
            onClick={refreshOptions}
          >
            Try again
          </button>
        </Notice>
      )}
      <ResourceSection<Task>
        title="Tasks"
        singular="task"
        description="Manage day-to-day work. Completed tasks do not replace weighted milestone progress."
        canWrite={canManage}
        canDelete={canManage}
        load={load}
        onRefresh={refreshOptions}
        editorDisabled={optionsLoading || !!optionsError}
        fields={[
          {
            name: "taskName",
            label: "Task name",
            required: true,
            maxLength: 200,
          },
          { name: "dueDate", label: "Due date", type: "date" },
          {
            name: "milestoneId",
            label: "Milestone",
            type: "select",
            options: [
              { value: "", label: "No milestone (project task)" },
              ...milestoneOptions,
            ],
          },
          {
            name: "description",
            label: "Description",
            type: "textarea",
            maxLength: 2000,
          },
        ]}
        createFields={[
          {
            name: "assignedToId",
            label: "Assigned to",
            type: "select",
            options: [{ value: "", label: "Unassigned" }, ...assigneeOptions],
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: TASK_STATUSES.map((value) => ({
              value,
              label: label(value),
            })),
          },
        ]}
        initial={(item) => ({
          taskName: item?.taskName ?? "",
          dueDate: item?.dueDate?.slice(0, 10) ?? "",
          milestoneId: item?.milestoneId ?? "",
          description: item?.description ?? "",
          assignedToId: item?.assignedToId ?? "",
          status: item?.status ?? "TODO",
        })}
        validate={validateTask}
        create={(v) =>
          createTask({
            ...input(v),
            projectId,
            assignedToId: v.assignedToId || null,
            status: v.status as TaskStatus,
          })
        }
        update={(item, v) => updateTask(item.id, input(v))}
        remove={deleteTask}
        validateFilters={validateTaskFilters}
        filters={[
          { name: "search", label: "Search tasks" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "", label: "All statuses" },
              ...TASK_STATUSES.map((value) => ({ value, label: label(value) })),
            ],
          },
          {
            name: "milestoneId",
            label: "Milestone",
            type: "select",
            disabled: milestones.loading || !!milestones.error,
            options: [
              { value: "", label: "All milestones" },
              ...milestoneOptions,
            ],
          },
          {
            name: "assignedToId",
            label: "Assigned to",
            type: "select",
            disabled: assignees.loading || !!assignees.error,
            options: [
              { value: "", label: "All team members" },
              ...assigneeOptions,
            ],
          },
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
              item.assignedTo?.fullName ??
              assignees.data?.find((user) => user.id === item.assignedToId)
                ?.fullName ??
              (item.assignedToId ? "Team member unavailable" : "Unassigned"),
          },
          {
            label: "Milestone",
            render: (item) => (
              <span className="break-all text-xs">
                {item.milestone?.milestoneName ??
                  milestones.data?.find(
                    (milestone) => milestone.id === item.milestoneId,
                  )?.milestoneName ??
                  (item.milestoneId ? "Milestone unavailable" : "Project task")}
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
            validate: validateTaskStatus,
            save: (item, v) =>
              updateTaskStatus(item.id, v.status as TaskStatus),
          },
          {
            label: "Assign",
            title: "Assign task",
            fields: [
              {
                name: "assignedToId",
                label: "Assign to",
                type: "select",
                options: [
                  { value: "", label: "Unassigned" },
                  ...assigneeOptions,
                ],
              },
            ],
            initial: (item) => ({ assignedToId: item.assignedToId ?? "" }),
            validate: (v) =>
              v.assignedToId && !isUuid(v.assignedToId.trim())
                ? "Select a valid team member."
                : null,
            save: (item, v) =>
              assignTask(item.id, v.assignedToId?.trim() || null),
          },
        ]}
      />
    </div>
  );
}
