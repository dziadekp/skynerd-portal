import { NextRequest, NextResponse } from "next/server";
import { getInternalApiUrl } from "@/lib/server-utils";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}/api/portal/auth/me/`, {
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
