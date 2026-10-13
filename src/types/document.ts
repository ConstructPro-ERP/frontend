export interface DocumentCategory {
  id: string;
  categoryName: string;
  description?: string | null;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  categoryId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  category: DocumentCategory;
  uploadedBy?: { id: string; fullName: string } | null;
}

export interface DocumentMetadataInput {
  fileName: string;
  categoryId: string;
}
