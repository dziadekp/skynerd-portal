import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API_URL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${INTERNAL_API_URL}/api/portal/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Set tokens in httpOnly cookies, return user data
    const response = NextResponse.json({
      user: data.user,
      accounts: data.accounts,
      requires_account_selection: data.requires_account_selection,
    });

    response.cookies.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // 30 minutes
    });

    response.cookies.set("refresh_token", data.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to server" },
      { status: 502 }
    );
  }
}
