import type { AxiosRequestConfig } from "axios";
import apiClient from "../api/client";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Deprecated compatibility wrapper:
  // callers can keep using apiFetch while the app converges to src/api/* modules.
  const method = options.method ?? "GET";
  const config: AxiosRequestConfig = {
    url: path.startsWith("/") ? path : `/${path}`,
    method: method as AxiosRequestConfig["method"],
    headers: options.headers as Record<string, string> | undefined,
  };

  if (options.body != null) {
    if (typeof options.body === "string") {
      try {
        config.data = JSON.parse(options.body);
      } catch {
        config.data = options.body;
      }
    } else {
      config.data = options.body;
    }
  }

  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error: any) {
    const rawMessage = error?.response?.data?.message ?? error?.response?.data?.error ?? error?.message;
    let message = "Solicitud fallida";
    if (Array.isArray(rawMessage)) {
      message = rawMessage.join(", ");
    } else if (typeof rawMessage === "string" && rawMessage.trim().length > 0) {
      message = rawMessage;
    }
    throw new Error(message);
  }
}
