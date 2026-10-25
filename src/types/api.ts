// src/types/api.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  path: string;
  timestamp: string;
}
