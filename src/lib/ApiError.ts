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
    // Preserve every backend detail in the message consumed by form alerts.
    const detailMessages = Array.isArray(details)
      ? details.filter(
          (detail): detail is string =>
            typeof detail === "string" && detail.trim().length > 0,
        )
      : [];
    const message = detailMessages.length
      ? detailMessages.join("; ")
      : getErrorMessage(code, backendMessage);
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
  }
}
