import apiClient from "@/lib/axios";
import type {
  DocumentCategory,
  DocumentMetadataInput,
  ProjectDocument,
} from "@/types/document";
import {
  safeDocumentDownloadUrl,
  validateDocumentFile,
  validateDocumentMetadata,
} from "@/lib/projectDocumentRules";
import { listResource, type ResourceQuery } from "./projectResources";

// Frontend contract; see docs/project-resources-api.md for missing backend work.
const projectPath = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}`;
export const listDocuments = (projectId: string, query?: ResourceQuery) =>
  listResource<ProjectDocument>(`${projectPath(projectId)}/documents`, query);

export const listDocumentCategories = async () =>
  (await listResource<DocumentCategory>("/document-categories")).data;

export async function uploadDocument(
  projectId: string,
  file: File,
  categoryId: string,
  onProgress?: (percent: number) => void,
) {
  const error =
    validateDocumentFile(file) ??
    validateDocumentMetadata({ fileName: file.name, categoryId });
  if (error) throw new Error(error);
  const body = new FormData();
  body.append("file", file);
  body.append("categoryId", categoryId);
  return (
    await apiClient.post<ProjectDocument>(
      `${projectPath(projectId)}/documents`,
      body,
      {
        // Override the shared JSON default; Axios supplies the multipart boundary.
        // The shared client retries network failures: the server must deduplicate uploads.
        headers: {
          "Content-Type": "multipart/form-data",
          "Idempotency-Key": crypto.randomUUID(),
        },
        onUploadProgress: (event) => {
          if (event.total)
            onProgress?.(
              Math.min(100, Math.round((event.loaded / event.total) * 100)),
            );
        },
      },
    )
  ).data;
}

export async function updateDocument(id: string, input: DocumentMetadataInput) {
  const error = validateDocumentMetadata(input);
  if (error) throw new Error(error);
  return (
    await apiClient.patch<ProjectDocument>(
      `/documents/${encodeURIComponent(id)}`,
      input,
    )
  ).data;
}

export async function getDocumentDownloadUrl(id: string): Promise<string> {
  const response = await apiClient.get<{ url: string }>(
    `/documents/${encodeURIComponent(id)}/download`,
  );
  return safeDocumentDownloadUrl(response.data?.url);
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.del(`/documents/${encodeURIComponent(id)}`);
}
