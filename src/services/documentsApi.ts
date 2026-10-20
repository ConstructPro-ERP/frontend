import apiClient from "@/lib/axios";
import type {
  DocumentCategory,
  DocumentDownloadResponse,
  DocumentMetadataInput,
  DocumentUploadAuthorization,
  DocumentUploadAuthorizationInput,
  DocumentUploadOptions,
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
  options: DocumentUploadOptions = {},
): Promise<ProjectDocument> {
  options.onStage?.("validating");

  const error =
    validateDocumentFile(file) ??
    validateDocumentMetadata({
      fileName: file.name,
      categoryId,
    });

  if (error) {
    throw new Error(error);
  }

  if (options.signal?.aborted) {
    throw new Error("Document upload was canceled.");
  }

  if (file.size <= LEGACY_DOCUMENT_UPLOAD_THRESHOLD_BYTES) {
    return uploadMultipartDocument(
      projectId,
      file,
      categoryId,
      onProgress,
      options,
    );
  }

  return uploadDirectDocument(projectId, file, categoryId, onProgress, options);
}

async function uploadMultipartDocument(
  projectId: string,
  file: File,
  categoryId: string,
  onProgress?: (percent: number) => void,
  options: DocumentUploadOptions = {},
): Promise<ProjectDocument> {
  options.onStage?.("uploading");

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
      signal: options.signal,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (event.total && event.total > 0) {
          const percent = Math.min(
            100,
            Math.round((event.loaded / event.total) * 100),
          );

          onProgress?.(percent);
        }
      },
    },
  );

  if (options.signal?.aborted) {
    throw new Error("Document upload was canceled.");
  }

  options.onStage?.("completed");

  return response.data;
}

async function uploadDirectDocument(
  projectId: string,
  file: File,
  categoryId: string,
  onProgress?: (percent: number) => void,
  options: DocumentUploadOptions = {},
): Promise<ProjectDocument> {
  const path = projectPath(projectId);

  options.onStage?.("authorizing");

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
      {
        skipNetworkRetry: true,
        signal: options.signal,
      },
    );

  if (options.signal?.aborted) {
    throw new Error("Document upload was canceled.");
  }

  const authorization = authorizationResponse.data;

  options.onStage?.("uploading");

  await uploadSignedDocument(file, authorization, onProgress, {
    signal: options.signal,
    onRetry: () => options.onStage?.("retrying"),
    onResume: () => options.onStage?.("uploading"),
  });

  if (options.signal?.aborted) {
    throw new Error("Document upload was canceled.");
  }

  options.onStage?.("verifying");

  const completionResponse = await apiClient.post<ProjectDocument>(
    `${path}/documents/${encodeURIComponent(authorization.documentId)}/complete`,
    {},
    { signal: options.signal },
  );

  if (options.signal?.aborted) {
    throw new Error("Document upload was canceled.");
  }

  options.onStage?.("completed");

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
