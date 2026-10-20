export interface DocumentCategory {
  id: string;
  categoryName: string;
  description?: string | null;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  categoryId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  description: string | null;
  uploadedById: string | null;
  uploadedBy: {
    id: string;
    fullName: string;
  } | null;
  category: DocumentCategory;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadataInput {
  fileName: string;
  categoryId: string;
  description?: string | null;
}

export interface DocumentUploadAuthorizationInput {
  categoryId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  description?: string | null;
}

export interface DocumentUploadAuthorization {
  documentId: string;
  cloudName: string;
  apiKey: string;
  publicId: string;
  resourceType: "raw" | "image";
  timestamp: number;
  signature: string;
  uploadParameters: {
    public_id: string;
    timestamp: number;
    type: "authenticated";
    overwrite: "false";
  };
}

export interface DocumentDownloadResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

export type DocumentUploadStage =
  | "validating"
  | "authorizing"
  | "uploading"
  | "retrying"
  | "verifying"
  | "completed";

export interface DocumentUploadOptions {
  signal?: AbortSignal;
  onStage?: (stage: DocumentUploadStage) => void;
}
