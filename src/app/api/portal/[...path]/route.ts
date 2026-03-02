import { NextRequest, NextResponse } from "next/server";
import { getInternalApiUrl } from "@/lib/server-utils";

// BFF proxy: forwards all /api/portal/* calls to Django with JWT from cookie
async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const backendPath = path.join("/");
  const url = new URL(request.url);
  const queryString = url.search;
  const apiUrl = getInternalApiUrl();
  const backendUrl = `${apiUrl}/api/portal/${backendPath}/${queryString}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  // Forward content-type for POST/PUT
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const res = await fetch(backendUrl, fetchOptions);
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
