// src/lib/errorMessages.ts
export enum ErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_MISSING = "TOKEN_MISSING",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  ROLE_NOT_FOUND = "ROLE_NOT_FOUND",
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]:
    "The email or password you entered is incorrect.",
  [ErrorCode.TOKEN_MISSING]: "You are not logged in.",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please log in again.",
  [ErrorCode.TOKEN_INVALID]: "Your session is invalid. Please log in again.",
  [ErrorCode.USER_ALREADY_EXISTS]: "An account with this email already exists.",
  [ErrorCode.ROLE_NOT_FOUND]: "The requested role could not be found.",
  [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action.",
  [ErrorCode.INSUFFICIENT_ROLE]: "Your role does not permit this action.",
  [ErrorCode.VALIDATION_ERROR]: "Please check your input for errors.",
  [ErrorCode.NOT_FOUND]: "The requested resource was not found.",
  [ErrorCode.INTERNAL_ERROR]:
    "An unexpected server error occurred. Please try again later.",
};

export const getErrorMessage = (
  code: string | undefined,
  fallback: string = "An unknown error occurred.",
): string => {
  if (!code) return fallback;
  if (code in ErrorCode) {
    return ErrorMessages[code as ErrorCode];
  }
  return fallback;
};
