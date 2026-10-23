import apiClient from "@/lib/axios";
import { safeDocumentDownloadUrl } from "@/lib/projectDocumentRules";
import type { DocumentDownloadResponse } from "@/types/document";
import type {
  PortalDocument,
  PortalMilestone,
  PortalPage,
  PortalProject,
  PortalQuotation,
} from "@/types/portal";

// Every request goes through the client-scoped gateway routes. Ownership is
// enforced by the backend; the identity comes from the bearer token, never from
// a client-supplied id.
const projectPath = (projectId: string) =>
  `/client-portal/projects/${encodeURIComponent(projectId)}`;

export const PORTAL_PAGE_SIZE = 10;

const malformed = () =>
  new Error("Unexpected response. Please try again or contact support.");

async function getPage<T>(
  path: string,
  page: number,
  limit: number,
): Promise<PortalPage<T>> {
  const response = await apiClient.get<T[]>(path, { params: { page, limit } });
  if (!Array.isArray(response.data)) throw malformed();
  const items = response.data;
  const meta = response.meta;
  return {
    items,
    total: meta?.total ?? items.length,
    page: meta?.page ?? page,
    limit: meta?.limit ?? limit,
    totalPages: meta?.totalPages ?? 1,
  };
}

export const listPortalProjects = (page = 1, limit = PORTAL_PAGE_SIZE) =>
  getPage<PortalProject>("/client-portal/projects", page, limit);

export const listPortalQuotations = (page = 1, limit = PORTAL_PAGE_SIZE) =>
  getPage<PortalQuotation>("/client-portal/quotations", page, limit);

export const listPortalDocuments = (
  projectId: string,
  page = 1,
  limit = PORTAL_PAGE_SIZE,
) =>
  getPage<PortalDocument>(`${projectPath(projectId)}/documents`, page, limit);

export async function getPortalProject(
  projectId: string,
): Promise<PortalProject> {
  const response = await apiClient.get<PortalProject>(projectPath(projectId));
  if (!response.data || typeof response.data !== "object") throw malformed();
  return response.data;
}

export async function listPortalMilestones(
  projectId: string,
): Promise<PortalMilestone[]> {
  const response = await apiClient.get<PortalMilestone[]>(
    `${projectPath(projectId)}/milestones`,
  );
  if (!Array.isArray(response.data)) throw malformed();
  return response.data;
}

/** Resolves to a short-lived signed URL for a document the client owns. */
export async function getPortalDocumentDownloadUrl(
  documentId: string,
): Promise<string> {
  const response = await apiClient.get<DocumentDownloadResponse>(
    `/client-portal/documents/${encodeURIComponent(documentId)}/download`,
  );
  return safeDocumentDownloadUrl(response.data?.downloadUrl);
}
