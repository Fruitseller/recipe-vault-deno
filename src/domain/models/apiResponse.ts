export interface ApiResponse<T> {
  data: T;
  metadata?: {
    timestamp: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    timestamp: string;
  };
}
