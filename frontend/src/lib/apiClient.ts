import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/authStorage";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: string };
      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch {
      // Keep default message when body is empty/non-json.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });
      if (!response.ok) {
        clearTokens();
        return null;
      }
      const payload = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
        activeCommunityId: number;
        activeCommunitySlug: string;
        activeCommunityName: string;
      };
      setTokens(payload.accessToken, payload.refreshToken, {
        id: payload.activeCommunityId,
        slug: payload.activeCommunitySlug,
        name: payload.activeCommunityName
      });
      return payload.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performRequest(path: string, options: ApiOptions, tokenOverride?: string | null): Promise<Response> {
  const { method = "GET", body, headers = {}, auth = true } = options;

  const requestHeaders: Record<string, string> = {
    ...headers
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = tokenOverride ?? getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  return fetch(path, {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body)
  });
}

export async function apiClient<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await performRequest(path, options);
  if (response.status === 401 && options.auth !== false) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      const retryResponse = await performRequest(path, options, refreshedToken);
      return parseResponse<T>(retryResponse);
    }
  }
  return parseResponse<T>(response);
}
