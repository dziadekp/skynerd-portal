import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getInternalApiUrl } from "@/lib/server-utils";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * POST /api/upload-proxy
 *
 * Consolidated upload handler. Receives file + folder_id from browser,
 * then server-side:
 *   1. Computes real MD5 checksum (required by S3)
 *   2. Requests signed URL from Django/Truss
 *   3. PUTs file to S3 with correct headers
 *   4. Attaches uploaded file to the Truss folder
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
    const taskId = (formData.get("task_id") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 413 }
      );
    }

    // Sanitize filename
    const sanitizedFilename = file.name
      .replace(/[^\w\s.\-()]/g, "_")
      .replace(/\.{2,}/g, ".")
      .slice(0, 255);

    const apiUrl = getInternalApiUrl();
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // 1. Read file into buffer and compute real MD5 checksum (Base64-encoded)
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    const md5Hash = createHash("md5").update(fileBytes).digest("base64");
    const contentType = file.type || "application/octet-stream";

    console.log(
      `[upload-proxy] File: "${sanitizedFilename}", size=${file.size}, ` +
      `buffer=${fileBytes.length}, type=${contentType}, folder=${folderId}, task=${taskId}`
    );

    // 2. Request signed upload URL from Django -> Truss ActiveStorage
    const urlRes = await fetch(`${apiUrl}/api/portal/documents/upload-url/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        filename: sanitizedFilename,
        content_type: contentType,
        byte_size: fileBytes.length,
        checksum: md5Hash,
        folder_id: folderId,
      }),
    });

    if (!urlRes.ok) {
      const err = await urlRes.json().catch(() => ({}));
      console.error("[upload-proxy] Django upload-url failed:", urlRes.status, err);
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

    // Validate upload URL is an S3 endpoint (SSRF protection)
    try {
      const urlObj = new URL(upload_url);
      const isS3 =
        urlObj.hostname.endsWith(".amazonaws.com") ||
        urlObj.hostname.endsWith(".r2.cloudflarestorage.com");
      if (!isS3) {
        console.error(`[upload-proxy] Rejected upload URL host: ${urlObj.hostname}`);
        return NextResponse.json({ error: "Invalid upload URL host" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Malformed upload URL" }, { status: 400 });
    }

    // 3. PUT file to S3 signed URL with correct headers
    // ActiveStorage returns headers like { "Content-Type": "...", "Content-MD5": "..." }
    // DO NOT set Content-Length manually -- undici calculates it from the body.
    // DO NOT use duplex: "half" -- that forces chunked encoding, which S3 rejects.
    const s3Headers: Record<string, string> = {
      ...(upload_headers || {}),
    };

    // Diagnostic: verify MD5 match between computed and header
    if (s3Headers["Content-MD5"] && s3Headers["Content-MD5"] !== md5Hash) {
      console.error(
        `[upload-proxy] MD5 mismatch! computed=${md5Hash}, header=${s3Headers["Content-MD5"]}`
      );
    }

    console.log(`[upload-proxy] S3 PUT headers: ${JSON.stringify(s3Headers)}`);

    const s3Controller = new AbortController();
    const s3Timeout = setTimeout(() => s3Controller.abort(), 120_000);

    try {
      const s3Res = await fetch(upload_url, {
        method: "PUT",
        headers: s3Headers,
        body: Buffer.from(fileBytes),
        signal: s3Controller.signal,
      });

      if (!s3Res.ok) {
        const errorText = await s3Res.text().catch(() => "Unknown S3 error");
        console.error(
          `[upload-proxy] S3 PUT failed: status=${s3Res.status}, ` +
          `statusText=${s3Res.statusText}, body=${errorText}`
        );
        return NextResponse.json(
          { error: "File upload to storage failed. Please try again." },
          { status: 502 }
        );
      }
    } finally {
      clearTimeout(s3Timeout);
    }

    console.log(`[upload-proxy] S3 PUT success`);

    // 4. Attach uploaded file to Truss folder (with optional task linkage)
    const attachFolderId = folderId || urlData.folder_id;
    if (attachFolderId && signed_id) {
      const attachPayload: Record<string, string> = {
        folder_id: attachFolderId,
        signed_id,
        filename: sanitizedFilename,
        content_type: contentType,
      };
      // When task_id is provided, the backend passes it to Truss
      // add_files_to_folder — this links the file as a task touchpoint
      if (taskId) {
        attachPayload.task_id = taskId;
      }

      const attachRes = await fetch(
        `${apiUrl}/api/portal/documents/attach/`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(attachPayload),
        }
      );

      if (!attachRes.ok) {
        const err = await attachRes.json().catch(() => ({}));
        console.error("[upload-proxy] Attach failed:", attachRes.status, err);
        return NextResponse.json(
          { error: err.error || "Failed to attach file to folder" },
          { status: attachRes.status }
        );
      }

      console.log("[upload-proxy] File attached to folder successfully");
    } else {
      console.warn(
        `[upload-proxy] No folder to attach to. folderId=${folderId}, ` +
        `urlData.folder_id=${urlData.folder_id}`
      );
    }

    return NextResponse.json({ ok: true, signed_id });
  } catch (err) {
    console.error("[upload-proxy] Unhandled error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
