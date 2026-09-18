import axios from "axios";
import type { ApiErrorResponse } from "../types/api";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
