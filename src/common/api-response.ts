import { HttpException } from "@nestjs/common";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export function success<T>(message: string, data: T = {} as T): ApiResponse<T> {
  return { success: true, message, data };
}

export function dataOf<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function failure(message: string, status = 400): never {
  throw new HttpException({ success: false, message, data: {} }, status);
}
