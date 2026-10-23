import { ApiError } from "@/lib/ApiError";

export const portalLabel = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const portalMoney = (value?: number | string | null) => {
  const amount = value == null || value === "" ? NaN : Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-LK", {
        style: "currency",
        currency: "LKR",
      }).format(amount)
    : "Not available";
};

export const portalDate = (value?: string | null) =>
  !value
    ? "Not set"
    : !Number.isFinite(Date.parse(value))
      ? "Invalid date"
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(value));

export interface PortalErrorInfo {
  message: string;
  /** Retrying cannot help when the account itself lacks access. */
  retryable: boolean;
}

export function describePortalError(error: unknown): PortalErrorInfo {
  if (error instanceof ApiError) {
    if (error.code === "CLIENT_PROFILE_NOT_LINKED") {
      return {
        message:
          "Your account is not linked to a client profile yet. Please contact ConstructPro to finish setting up portal access.",
        retryable: false,
      };
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        message: "Your account does not have access to this information.",
        retryable: false,
      };
    }
    if (error.statusCode === 404) {
      return {
        message: "This record could not be found.",
        retryable: false,
      };
    }
    if (error.statusCode === 0) {
      return {
        message:
          "We could not reach the server. Check your connection and try again.",
        retryable: true,
      };
    }
  }
  return {
    message: "Something went wrong while loading this section.",
    retryable: true,
  };
}
