import { apiUrl } from "./authenticated-session";

export type Broker = { id: string; name: string; country: string };
export type Account = {
  id: string;
  broker_id: string;
  broker_name: string;
  name: string;
  currency: string;
};

export class AccountApiError extends Error {
  constructor(public readonly status: number) {
    super("Account request failed");
  }
}

export async function accountRequest<T>(
  path: string,
  token: string,
  signal: AbortSignal,
  method = "GET",
  body?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "omit",
    signal,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new AccountApiError(response.status);
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
