// src/types/api.ts
export interface ApiResponse<T = any> {
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
