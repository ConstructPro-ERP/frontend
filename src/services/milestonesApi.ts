import apiClient from "@/lib/axios";
import type { Milestone, MilestoneInput } from "@/types/milestone";
import { listResource, type ResourceQuery } from "./projectResources";
export const listMilestones = (projectId: string, query?: ResourceQuery) =>
  listResource<Milestone>(
    `/projects/${encodeURIComponent(projectId)}/milestones`,
    query,
  );
export const createMilestone = async (
  projectId: string,
  input: MilestoneInput,
) =>
  (
    await apiClient.post<Milestone>(
      `/projects/${encodeURIComponent(projectId)}/milestones`,
      input,
    )
  ).data;
export const updateMilestone = async (id: string, input: MilestoneInput) =>
  (
    await apiClient.patch<Milestone>(
      `/milestones/${encodeURIComponent(id)}`,
      input,
    )
  ).data;
export const updateMilestoneProgress = async (id: string, progress: number) =>
  (
    await apiClient.patch<Milestone>(
      `/milestones/${encodeURIComponent(id)}/progress`,
      { progress },
    )
  ).data;
export const deleteMilestone = async (id: string) => {
  await apiClient.del(`/milestones/${encodeURIComponent(id)}`);
};
