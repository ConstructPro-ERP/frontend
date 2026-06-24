// src/lib/ApiError.ts
import { getErrorMessage } from "./errorMessages";

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown[];
  public traceId?: string;

  constructor(
    backendMessage: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: unknown[],
    traceId?: string,
  ) {
    // If the error code exists in our frontend map, use the user-friendly message.
    // Otherwise, fall back to the backend's message.
    const message = getErrorMessage(code, backendMessage);
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
  }
}
