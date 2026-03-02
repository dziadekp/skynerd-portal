import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API_URL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/portal/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Clear invalid tokens
      const response = NextResponse.json(data, { status: res.status });
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    });

    // If a new refresh token was returned (rotation)
    if (data.refresh) {
      response.cookies.set("refresh_token", data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 502 }
    );
  }
}
