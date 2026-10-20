import axios from "axios";
import type { DocumentUploadAuthorization } from "@/types/document";

interface CloudinaryUploadResponse {
  public_id: string;
  resource_type: string;
  type: string;
  bytes: number;
  done?: boolean;
}

const cloudinaryClient = axios.create({
  withCredentials: false,
  timeout: 0,
});

export async function uploadSignedDocument(
  file: File,
  authorization: DocumentUploadAuthorization,
  onProgress?: (percent: number) => void,
): Promise<void> {
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

  const form = new FormData();

  form.append("file", file);

  for (const [key, value] of Object.entries(uploadParameters)) {
    form.append(key, String(value));
  }

  form.append("api_key", apiKey);
  form.append("signature", signature);

  const endpoint =
    `https://api.cloudinary.com/v1_1/${cloudName}/` + `${resourceType}/upload`;

  const response = await cloudinaryClient.post<CloudinaryUploadResponse>(
    endpoint,
    form,
    {
      onUploadProgress: (event) => {
        if (event.total && event.total > 0) {
          onProgress?.(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        }
      },
    },
  );

  const uploaded = response.data;

  if (
    uploaded.public_id !== publicId ||
    uploaded.resource_type !== resourceType ||
    uploaded.type !== "authenticated" ||
    uploaded.bytes !== file.size ||
    uploaded.done === false
  ) {
    throw new Error("Cloudinary returned unexpected document upload metadata.");
  }
}
