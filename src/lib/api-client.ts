// Fetch wrapper for portal API calls (browser-side, goes through BFF proxy)

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const config: RequestInit = {
    credentials: "include", // send httpOnly cookies
    ...rest,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    // All API calls go through /api/auth/* or /api/proxy/* BFF routes
    const response = await fetch(endpoint, config);

    if (response.status === 401) {
      // Try refresh
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        // Retry original request
        const retryResponse = await fetch(endpoint, config);
        const data = await retryResponse.json().catch(() => null);
        return {
          data: retryResponse.ok ? data : null,
          error: retryResponse.ok ? null : data?.detail || data?.error || "Request failed",
          status: retryResponse.status,
        };
      }

      // Refresh failed — redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return { data: null, error: "Session expired", status: 401 };
    }

    const data = await response.json().catch(() => null);
    return {
      data: response.ok ? data : null,
      error: response.ok ? null : data?.detail || data?.error || "Request failed",
      status: response.status,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) => apiRequest<T>(url, { method: "POST", body }),
  put: <T>(url: string, body?: unknown) => apiRequest<T>(url, { method: "PUT", body }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
};
