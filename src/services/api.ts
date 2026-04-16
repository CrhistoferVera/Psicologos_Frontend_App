import { API_URL } from "../config";
import { getAccessToken } from "../storage/authStorage";

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers, ...rest } = options;
  const token = skipAuth ? null : await getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  let payload: any = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    payload = text || null;
  }

  if (!response.ok) {
    const message =
      (typeof payload?.message === "string" && payload.message) ||
      (Array.isArray(payload?.message) ? payload.message.join(", ") : null) ||
      (typeof payload === "string" && payload) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
