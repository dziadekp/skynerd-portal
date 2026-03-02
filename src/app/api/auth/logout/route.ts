import { NextRequest, NextResponse } from "next/server";
import { getInternalApiUrl } from "@/lib/server-utils";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Try to blacklist the token server-side (best effort)
  if (refreshToken) {
    try {
      const apiUrl = getInternalApiUrl();
      await fetch(`${apiUrl}/api/portal/auth/logout/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Best effort — clear cookies regardless
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}
