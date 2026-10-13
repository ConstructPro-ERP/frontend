import { isUuid } from "./projectRules";
import type { DocumentMetadataInput } from "@/types/document";

// Proposed upload contract; the backend must enforce these limits too.
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];
export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.join(",");

export function validateDocumentMetadata(
  input: DocumentMetadataInput,
): string | null {
  if (!input.fileName.trim() || input.fileName.trim().length > 255)
    return "Enter a file name of 1 to 255 characters.";
  if (/[\\/\u0000-\u001f]/.test(input.fileName))
    return "File names cannot contain paths or control characters.";
  if (!isUuid(input.categoryId)) return "Select a document category.";
  return null;
}

export function validateDocumentFile(
  file: Pick<File, "name" | "size"> | null,
): string | null {
  if (!file) return "Choose a file to upload.";
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Files must be 20 MB or smaller.";
  if (
    !DOCUMENT_EXTENSIONS.some((extension) =>
      file.name.toLowerCase().endsWith(extension),
    )
  )
    return "Choose a PDF, Word, Excel, CSV, text, PNG, JPEG, or WebP file.";
  return null;
}

export function safeDocumentDownloadUrl(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("No download link was returned.");
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("The document download link is invalid.");
  return url.href;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Not available";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
