export interface GenericResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}