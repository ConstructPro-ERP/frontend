import { isUuid } from "./projectRules";
import type { DocumentMetadataInput } from "@/types/document";

// Keep this validation aligned with the Document Service direct-upload policy.
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".docx",
  ".dwg",
  ".dxf",
  ".dwt",
  ".dws",
  ".dgn",
  ".sat",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".rvt",
  ".rfa",
  ".rte",
  ".rft",
  ".ifc",
  ".ifcxml",
  ".ifczip",
  ".nwd",
  ".nwc",
  ".nwf",
  ".max",
  ".3ds",
  ".fbx",
  ".obj",
  ".stl",
  ".dae",
  ".skp",
  ".3dm",
  ".blend",
  ".blend1",
  ".glb",
  ".gltf",
  ".lsf",
  ...Array.from({ length: 12 }, (_, index) => `.ls${index + 1}`),
  ".pln",
  ".pla",
  ".las",
  ".laz",
  ".e57",
  ".rcp",
  ".rcs",
  ".doc",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
  ".zip",
  ".7z",
  ".rar",
  ".webp",
  ".tif",
  ".tiff",
];

export const DOCUMENT_ACCEPT = DOCUMENT_EXTENSIONS.join(",");

const STRICT_MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const IMAGE_MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
};

const MIME_TYPE_PATTERN = /^[a-z][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+_-]*$/i;

function fileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(index).toLowerCase() : "";
}

export function documentMimeType(file: {
  name: string;
  type?: string;
}): string {
  const extension = fileExtension(file.name);
  const declared = (file.type ?? "").trim().toLowerCase();

  if (!declared || declared === "application/octet-stream") {
    return (
      STRICT_MIME_TYPES[extension] ??
      IMAGE_MIME_TYPES[extension] ??
      "application/octet-stream"
    );
  }

  return declared;
}

export function validateDocumentMetadata(
  input: DocumentMetadataInput,
): string | null {
  const name = input.fileName;

  if (
    !name ||
    name.length > 255 ||
    name !== name.trim() ||
    /[\\/\u0000-\u001f\u007f]/.test(name)
  ) {
    return "Enter a valid file name of 1 to 255 characters without paths or control characters.";
  }

  if (!isUuid(input.categoryId)) {
    return "Select a document category.";
  }

  if (input.description !== undefined && input.description !== null) {
    if (!input.description.trim() || input.description.length > 1000) {
      return "Description must contain text and be 1,000 characters or fewer.";
    }
  }

  return null;
}

export function validateDocumentFile(
  file: (Pick<File, "name" | "size"> & { type?: string }) | null,
): string | null {
  if (!file) return "Choose a file to upload.";

  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    return "The selected file is empty or has an invalid size.";
  }

  if (file.size > MAX_DOCUMENT_BYTES) {
    return "Files must be 50 MiB or smaller.";
  }

  if (
    !file.name ||
    file.name.length > 255 ||
    file.name !== file.name.trim() ||
    /[\\/\u0000-\u001f\u007f]/.test(file.name)
  ) {
    return "The selected file name is invalid.";
  }

  const extension = fileExtension(file.name);

  if (!DOCUMENT_EXTENSIONS.includes(extension)) {
    return "This file format is not supported.";
  }

  const mimeType = documentMimeType(file);
  const strictMimeType = STRICT_MIME_TYPES[extension];
  const imageMimeType = IMAGE_MIME_TYPES[extension];

  if (strictMimeType && mimeType !== strictMimeType) {
    return "The file type does not match its extension.";
  }

  if (
    imageMimeType &&
    mimeType !== imageMimeType &&
    mimeType !== "application/octet-stream"
  ) {
    return "The image type does not match its extension.";
  }

  if (!MIME_TYPE_PATTERN.test(mimeType)) {
    return "The selected file has an invalid MIME type.";
  }

  return null;
}

export function safeDocumentDownloadUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("No download link was returned.");
  }

  const url = new URL(value);

  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("The document download link is invalid.");
  }

  return url.href;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "Not available";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
