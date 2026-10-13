import apiClient from "@/lib/axios";
import type { Task, TaskInput, TaskStatus, TaskAssignee } from "@/types/task";
import {
  listResource,
  listAllResources,
  type ResourceQuery,
} from "./projectResources";
export const listTaskAssignees = (projectId: string) =>
  listAllResources((query) =>
    listResource<TaskAssignee>(
      `/projects/${encodeURIComponent(projectId)}/task-assignees`,
      query,
    ),
  );
export const listTasks = (projectId: string, query?: ResourceQuery) =>
  listResource<Task>(`/projects/${encodeURIComponent(projectId)}/tasks`, query);
export const createTask = async (input: TaskInput) =>
  (await apiClient.post<Task>("/tasks", input)).data;
export const updateTask = async (
  id: string,
  input: Omit<TaskInput, "projectId" | "assignedToId">,
) =>
  (await apiClient.patch<Task>(`/tasks/${encodeURIComponent(id)}`, input)).data;
export const assignTask = async (id: string, assignedToId: string | null) =>
  (
    await apiClient.patch<Task>(`/tasks/${encodeURIComponent(id)}/assign`, {
      assignedToId,
    })
  ).data;
export const updateTaskStatus = async (id: string, status: TaskStatus) =>
  (
    await apiClient.patch<Task>(`/tasks/${encodeURIComponent(id)}/status`, {
      status,
    })
  ).data;
export const deleteTask = async (id: string) => {
  await apiClient.del(`/tasks/${encodeURIComponent(id)}`);
};
