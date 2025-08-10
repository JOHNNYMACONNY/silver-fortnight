export interface ServiceError {
  code: string;
  message: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: ServiceError | null;
}