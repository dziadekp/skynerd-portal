import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_API_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/portal/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 502 }
    );
  }
}
