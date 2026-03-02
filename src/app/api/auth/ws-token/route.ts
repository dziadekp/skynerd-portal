import { NextRequest, NextResponse } from "next/server";

// Return the raw access token for WebSocket connections
// The token is stored in httpOnly cookie and not accessible to JS,
// so we expose it through this BFF endpoint for WS auth only
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ token: accessToken });
}
