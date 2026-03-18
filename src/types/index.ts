// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================
// Pagination Types
// ============================================================

export interface PaginationParams {
  cursor?: string;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null; // null means no more pages
  hasMore: boolean;
}

// ============================================================
// URL Types
// ============================================================

export interface IUrl {
  shortCode: string;
  originalUrl: string;
  userId: string;
  clicks: number;
  expiresAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUrlInput = Pick<IUrl, "originalUrl" | "userId"> & {
  customAlias?: string;
  expiresAt?: Date;
};

export type UpdateUrlInput = Partial<Pick<IUrl, "originalUrl" | "expiresAt">>;

export interface IClick {
  shortCode: string;
  timestamp: Date;
  hashedIp: string;
  referrer: string | null;
  userAgent: string | null;
}

// ============================================================
// Idempotency Types
// ============================================================

export interface IIdempotencyKey {
  key: string;
  response: Record<string, unknown>;
  expiresAt: Date;
  createdAt: Date;
}
