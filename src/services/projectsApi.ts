import apiClient from "@/lib/axios";
import type {
  Project,
  ProjectListParams,
  ProjectListResult,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
} from "@/types/project";

/**
 * Retrieve projects using backend-side filtering,
 * sorting, pagination, and role-based access.
 *
 * The backend automatically restricts Project Managers
 * to projects assigned to their authenticated user.
 */
export async function listProjects(
  params: ProjectListParams = {},
): Promise<ProjectListResult> {
  const response = await apiClient.get<ProjectListResult>("/projects", {
    params,
  });

  const result = response.data;

  // Do not silently replace malformed responses with
  // empty lists, which would hide integration failures.
  if (
    !result ||
    !Array.isArray(result.data) ||
    !result.meta ||
    typeof result.meta.total !== "number" ||
    typeof result.meta.page !== "number" ||
    typeof result.meta.totalPages !== "number"
  ) {
    throw new Error("Unexpected projects API response.");
  }

  return result;
}

/**
 * Retrieve one project, including the manager and
 * associated quotation information.
 *
 * This will also be used by the project details page.
 */
export async function getProjectById(projectId: string): Promise<Project> {
  const response = await apiClient.get<Project>(
    `/projects/${encodeURIComponent(projectId)}`,
  );

  return response.data;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  return (await apiClient.post<Project>("/projects", input)).data;
}
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return (
    await apiClient.patch<Project>(`/projects/${encodeURIComponent(id)}`, input)
  ).data;
}
export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<Project> {
  return (
    await apiClient.patch<Project>(
      `/projects/${encodeURIComponent(id)}/status`,
      { status },
    )
  ).data;
}
export async function assignProjectManager(
  id: string,
  projectManagerId: string,
): Promise<Project> {
  return (
    await apiClient.patch<Project>(
      `/projects/${encodeURIComponent(id)}/manager`,
      { projectManagerId },
    )
  ).data;
}
export async function deleteProject(id: string): Promise<void> {
  await apiClient.del(`/projects/${encodeURIComponent(id)}`);
}
