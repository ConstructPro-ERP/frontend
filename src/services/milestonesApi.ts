import apiClient from "@/lib/axios";
import type {
  Milestone,
  MilestoneInput,
  MilestoneProgressInput,
} from "@/types/milestone";
import type { ResourceQuery } from "./projectResources";
import { paginateMilestones } from "./milestoneList";

/**
 * GET /projects/:id/milestones returns an unpaginated array.
 * Do not pass UI pagination controls to this endpoint.
 */
export async function listMilestones(
  projectId: string,
  query: ResourceQuery = {},
) {
  const response = await apiClient.get<Milestone[]>(
    `/projects/${encodeURIComponent(projectId)}/milestones`,
  );

  if (!Array.isArray(response.data)) {
    throw new Error("Unexpected milestone list response.");
  }

  return paginateMilestones(response.data, query);
}

export async function createMilestone(
  projectId: string,
  input: MilestoneInput,
) {
  const response = await apiClient.post<Milestone>(
    `/projects/${encodeURIComponent(projectId)}/milestones`,
    input,
  );

  return response.data;
}

export async function updateMilestone(id: string, input: MilestoneInput) {
  const response = await apiClient.patch<Milestone>(
    `/milestones/${encodeURIComponent(id)}`,
    input,
  );

  return response.data;
}

export async function updateMilestoneProgress(
  id: string,
  progressPercentage: number,
  status?: MilestoneProgressInput["status"],
) {
  const body: MilestoneProgressInput = {
    progressPercentage,
    ...(status ? { status } : {}),
  };

  const response = await apiClient.patch<Milestone>(
    `/milestones/${encodeURIComponent(id)}/progress`,
    body,
  );

  return response.data;
}

export async function deleteMilestone(id: string) {
  await apiClient.del(`/milestones/${encodeURIComponent(id)}`);
}
