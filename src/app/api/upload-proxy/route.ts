import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/upload-proxy
 *
 * Proxies file uploads to a signed S3/Truss URL server-side,
 * avoiding CORS issues with direct browser-to-S3 PUT requests.
 *
 * Body: FormData with:
 *   - file: The file to upload
 *   - upload_url: The signed S3 URL
 *   - upload_headers: JSON string of required headers
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadUrl = formData.get("upload_url") as string | null;
    const headersJson = formData.get("upload_headers") as string | null;

    if (!file || !uploadUrl) {
      return NextResponse.json(
        { error: "Missing file or upload_url" },
        { status: 400 }
      );
    }

    const uploadHeaders: Record<string, string> = headersJson
      ? JSON.parse(headersJson)
      : {};

    // PUT the file to the signed URL from the server (no CORS issues)
    const arrayBuffer = await file.arrayBuffer();
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: uploadHeaders,
      body: arrayBuffer,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Storage upload failed: ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload proxy failed" },
      { status: 500 }
    );
  }
}
