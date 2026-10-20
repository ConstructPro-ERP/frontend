import apiClient from "@/lib/axios";
import type {
  DocumentCategory,
  DocumentDownloadResponse,
  DocumentMetadataInput,
  DocumentUploadAuthorization,
  DocumentUploadAuthorizationInput,
  ProjectDocument,
} from "@/types/document";
import {
  LEGACY_DOCUMENT_UPLOAD_THRESHOLD_BYTES,
  documentMimeType,
  safeDocumentDownloadUrl,
  validateDocumentFile,
  validateDocumentMetadata,
} from "@/lib/projectDocumentRules";
import { listResource, type ResourceQuery } from "./projectResources";
import { uploadSignedDocument } from "./cloudinaryDocumentUpload";

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
): Promise<ProjectDocument> {
  const error =
    validateDocumentFile(file) ??
    validateDocumentMetadata({ fileName: file.name, categoryId });

  if (error) {
    throw new Error(error);
  }

  if (file.size <= LEGACY_DOCUMENT_UPLOAD_THRESHOLD_BYTES) {
    return uploadMultipartDocument(projectId, file, categoryId, onProgress);
  }

  return uploadDirectDocument(projectId, file, categoryId, onProgress);
}

async function uploadMultipartDocument(
  projectId: string,
  file: File,
  categoryId: string,
  onProgress?: (percent: number) => void,
): Promise<ProjectDocument> {
  const body = new FormData();

  body.append(
    "file",
    new Blob([file], { type: documentMimeType(file) }),
    file.name,
  );
  body.append("categoryId", categoryId);

  const response = await apiClient.post<ProjectDocument>(
    `${projectPath(projectId)}/documents`,
    body,
    {
      skipNetworkRetry: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (event.total && event.total > 0) {
          onProgress?.(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        }
      },
    },
  );

  return response.data;
}

async function uploadDirectDocument(
  projectId: string,
  file: File,
  categoryId: string,
  onProgress?: (percent: number) => void,
): Promise<ProjectDocument> {
  const path = projectPath(projectId);

  const metadata: DocumentUploadAuthorizationInput = {
    categoryId,
    fileName: file.name,
    mimeType: documentMimeType(file),
    fileSize: file.size,
  };

  const authorizationResponse =
    await apiClient.post<DocumentUploadAuthorization>(
      `${path}/documents/upload-authorizations`,
      metadata,
      { skipNetworkRetry: true },
    );

  const authorization = authorizationResponse.data;

  await uploadSignedDocument(file, authorization, onProgress);

  const completionResponse = await apiClient.post<ProjectDocument>(
    `${path}/documents/${encodeURIComponent(authorization.documentId)}/complete`,
    {},
  );

  return completionResponse.data;
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
  const response = await apiClient.get<DocumentDownloadResponse>(
    `/documents/${encodeURIComponent(id)}/download`,
  );

  return safeDocumentDownloadUrl(response.data?.downloadUrl);
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.del(`/documents/${encodeURIComponent(id)}`);
}
