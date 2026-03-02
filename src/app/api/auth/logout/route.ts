import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API_URL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Try to blacklist the token server-side (best effort)
  if (refreshToken) {
    try {
      await fetch(`${INTERNAL_API_URL}/api/portal/auth/logout/`, {
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
