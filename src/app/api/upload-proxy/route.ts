import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getInternalApiUrl } from "@/lib/server-utils";

/**
 * POST /api/upload-proxy
 *
 * Consolidated upload handler. Receives file + folder_id from browser,
 * then server-side:
 *   1. Computes real MD5 checksum (required by S3)
 *   2. Requests signed URL from Django/Truss
 *   3. PUTs file to S3 with correct headers
 *   4. Attaches uploaded file to the Truss folder
 *
 * This avoids both CORS issues AND the checksum mismatch that caused 400s.
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = (formData.get("folder_id") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const apiUrl = getInternalApiUrl();
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // 1. Read file and compute real MD5 checksum (Base64-encoded)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const md5Hash = createHash("md5").update(buffer).digest("base64");

    // 2. Request signed upload URL from Django
    const urlRes = await fetch(`${apiUrl}/api/portal/documents/upload-url/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        byte_size: file.size,
        checksum: md5Hash,
        folder_id: folderId,
      }),
    });

    if (!urlRes.ok) {
      const err = await urlRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error || `Failed to get upload URL (${urlRes.status})` },
        { status: urlRes.status }
      );
    }

    const urlData = await urlRes.json();
    const { signed_id, upload_url, upload_headers } = urlData;

    if (!signed_id || !upload_url) {
      return NextResponse.json(
        { error: "Invalid upload URL response from server" },
        { status: 500 }
      );
    }

    // 3. PUT file to S3 signed URL with correct headers
    const s3Headers: Record<string, string> = upload_headers || {};
    const s3Res = await fetch(upload_url, {
      method: "PUT",
      headers: s3Headers,
      body: buffer,
    });

    if (!s3Res.ok) {
      const errorText = await s3Res.text().catch(() => "Unknown S3 error");
      console.error(`[upload-proxy] S3 PUT failed: ${s3Res.status}`, errorText);
      return NextResponse.json(
        { error: `Storage upload failed: ${s3Res.status}` },
        { status: s3Res.status }
      );
    }

    // 4. Attach uploaded file to Truss folder
    const attachFolderId = folderId || urlData.folder_id;
    if (attachFolderId && signed_id) {
      const attachRes = await fetch(
        `${apiUrl}/api/portal/documents/attach/`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            folder_id: attachFolderId,
            signed_id,
            filename: file.name,
            content_type: file.type || "application/octet-stream",
          }),
        }
      );

      if (!attachRes.ok) {
        const err = await attachRes.json().catch(() => ({}));
        console.error("[upload-proxy] Attach failed:", err);
        return NextResponse.json(
          { error: err.error || "Failed to attach file to folder" },
          { status: attachRes.status }
        );
      }
    }

    return NextResponse.json({ ok: true, signed_id });
  } catch (err) {
    console.error("[upload-proxy] Error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
