import axios from "axios";
import { documentMimeType } from "@/lib/projectDocumentRules";
import type { DocumentUploadAuthorization } from "@/types/document";

interface CloudinaryUploadResponse {
  public_id?: string;
  resource_type?: string;
  type?: string;
  bytes?: number;
  done?: boolean;
}

interface CloudinaryTransferOptions {
  signal?: AbortSignal;
  onRetry?: () => void;
  onResume?: () => void;
}

export const DOCUMENT_CHUNK_SIZE = 6 * 1024 * 1024;

const MAX_CHUNK_ATTEMPTS = 3;

const cloudinaryClient = axios.create({
  withCredentials: false,
  timeout: 0,
});

function uploadCanceledError(): Error {
  const error = new Error("Document upload was canceled.");
  error.name = "AbortError";
  return error;
}

function ensureNotCanceled(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw uploadCanceledError();
  }
}

function isRetryableUploadError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    response?: { status?: number };
  };

  if (candidate.code === "ERR_CANCELED") {
    return false;
  }

  const status = candidate.response?.status;

  if (typeof status === "number") {
    return status === 420 || status === 429 || status >= 500;
  }

  return (
    candidate.code === "ERR_NETWORK" ||
    candidate.code === "ECONNABORTED" ||
    candidate.code === "ETIMEDOUT" ||
    candidate.code === "ERR_CONNECTION_RESET" ||
    candidate.code === undefined
  );
}

function waitBeforeRetry(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  ensureNotCanceled(signal);

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(uploadCanceledError());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);

    signal?.addEventListener("abort", onAbort, { once: true });

    if (signal?.aborted) {
      onAbort();
    }
  });
}

function validateAuthorization(
  authorization: DocumentUploadAuthorization,
): void {
  const {
    cloudName,
    apiKey,
    publicId,
    resourceType,
    timestamp,
    signature,
    uploadParameters,
  } = authorization;

  if (
    !/^[a-zA-Z0-9_-]+$/.test(cloudName) ||
    !apiKey ||
    !signature ||
    !publicId ||
    (resourceType !== "raw" && resourceType !== "image")
  ) {
    throw new Error("Invalid Cloudinary upload authorization.");
  }

  if (
    uploadParameters.public_id !== publicId ||
    uploadParameters.timestamp !== timestamp ||
    uploadParameters.type !== "authenticated" ||
    uploadParameters.overwrite !== "false"
  ) {
    throw new Error("Cloudinary upload parameters are inconsistent.");
  }
}

function createUploadForm(
  file: File,
  start: number,
  end: number,
  authorization: DocumentUploadAuthorization,
): FormData {
  const form = new FormData();

  form.append(
    "file",
    file.slice(start, end, documentMimeType(file)),
    file.name,
  );

  for (const [key, value] of Object.entries(authorization.uploadParameters)) {
    form.append(key, String(value));
  }

  form.append("api_key", authorization.apiKey);
  form.append("signature", authorization.signature);

  return form;
}

export async function uploadSignedDocument(
  file: File,
  authorization: DocumentUploadAuthorization,
  onProgress?: (percent: number) => void,
  options: CloudinaryTransferOptions = {},
): Promise<void> {
  validateAuthorization(authorization);

  const { signal, onRetry, onResume } = options;

  ensureNotCanceled(signal);

  const endpoint =
    `https://api.cloudinary.com/v1_1/${authorization.cloudName}/` +
    `${authorization.resourceType}/upload`;

  const chunked = file.size > DOCUMENT_CHUNK_SIZE;
  const uploadId = chunked ? crypto.randomUUID() : null;

  let highestProgress = 0;

  const reportProgress = (bytes: number) => {
    const percent = Math.min(100, Math.round((bytes / file.size) * 100));

    if (percent > highestProgress) {
      highestProgress = percent;
      onProgress?.(percent);
    }
  };

  for (let start = 0; start < file.size; start += DOCUMENT_CHUNK_SIZE) {
    const end = Math.min(start + DOCUMENT_CHUNK_SIZE, file.size);
    const finalChunk = end === file.size;

    let uploaded: CloudinaryUploadResponse | undefined;

    for (let attempt = 0; attempt < MAX_CHUNK_ATTEMPTS; attempt++) {
      ensureNotCanceled(signal);

      const form = createUploadForm(file, start, end, authorization);

      try {
        const response = await cloudinaryClient.post<CloudinaryUploadResponse>(
          endpoint,
          form,
          {
            signal,
            headers: chunked
              ? {
                  "X-Unique-Upload-Id": uploadId!,
                  "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
                }
              : undefined,
            onUploadProgress: (event) => {
              if (event.total && event.total > 0) {
                const transferred = Math.min(
                  Math.max(event.loaded, 0),
                  end - start,
                );

                reportProgress(start + transferred);
              }
            },
          },
        );

        ensureNotCanceled(signal);

        uploaded = response.data;
        break;
      } catch (error) {
        ensureNotCanceled(signal);

        if (
          attempt === MAX_CHUNK_ATTEMPTS - 1 ||
          !isRetryableUploadError(error)
        ) {
          throw error;
        }

        onRetry?.();

        await waitBeforeRetry(500 * 2 ** attempt, signal);

        onResume?.();
      }
    }

    ensureNotCanceled(signal);

    if (!uploaded) {
      throw new Error("Cloudinary did not confirm the upload.");
    }

    if (chunked && !finalChunk) {
      if (
        uploaded.done !== false ||
        (uploaded.public_id !== undefined &&
          uploaded.public_id !== authorization.publicId)
      ) {
        throw new Error(
          "Cloudinary returned an unexpected intermediate chunk response.",
        );
      }
    } else if (
      uploaded.public_id !== authorization.publicId ||
      uploaded.resource_type !== authorization.resourceType ||
      uploaded.type !== "authenticated" ||
      uploaded.bytes !== file.size ||
      (chunked ? uploaded.done !== true : uploaded.done === false)
    ) {
      throw new Error(
        "Cloudinary returned unexpected document upload metadata.",
      );
    }

    reportProgress(end);
  }
}
