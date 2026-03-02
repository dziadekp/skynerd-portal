"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFolders } from "@/hooks/use-api";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { UploadUrlResponse } from "@/lib/types";

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [folderId, setFolderId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const { data: folders } = useFolders();
  const router = useRouter();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...fileArray]);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  async function uploadFile(uploadFile: UploadFile, index: number) {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
    );

    try {
      // 1. Get signed upload URL
      const checksum = btoa(String(uploadFile.file.size)); // simplified checksum
      const urlRes = await api.post<UploadUrlResponse>("/api/portal/documents/upload-url", {
        filename: uploadFile.file.name,
        content_type: uploadFile.file.type || "application/octet-stream",
        byte_size: uploadFile.file.size,
        checksum,
        folder_id: folderId || null,
      });

      if (urlRes.error || !urlRes.data) {
        throw new Error(urlRes.error || "Failed to get upload URL");
      }

      // 2. Upload directly to S3
      const { signed_id, upload_url, upload_headers } = urlRes.data;

      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: upload_headers,
        body: uploadFile.file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload to storage failed");
      }

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 80 } : f))
      );

      // 3. Attach file to folder
      await api.post("/api/portal/documents/attach", {
        folder_id: folderId || urlRes.data.folder_id,
        signed_id,
        filename: uploadFile.file.name,
        content_type: uploadFile.file.type || "application/octet-stream",
      });

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: 100, status: "done" } : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : f
        )
      );
    }
  }

  async function handleUploadAll() {
    const pending = files.filter((f) => f.status === "pending");
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadFile(files[i], i);
      }
    }
    const successCount = files.filter((f) => f.status === "done").length + pending.length;
    if (successCount > 0) {
      toast.success(`${successCount} file(s) uploaded successfully`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground">Upload files to your account</p>
      </div>

      {/* Folder selector */}
      {folders && folders.length > 0 && (
        <div className="space-y-2">
          <Label>Upload to folder</Label>
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/40"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <p className="mt-4 text-sm text-muted-foreground">
          Drag and drop files here, or{" "}
          <label className="cursor-pointer text-primary hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="divide-y p-0">
            {files.map((f, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.file.size / 1024).toFixed(1)} KB
                  </p>
                  {f.status === "uploading" && (
                    <Progress value={f.progress} className="mt-2 h-1" />
                  )}
                  {f.status === "error" && (
                    <p className="mt-1 text-xs text-red-600">{f.error}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {f.status === "done" && (
                    <span className="text-sm text-green-600 font-medium">Done</span>
                  )}
                  {f.status === "error" && (
                    <span className="text-sm text-red-600 font-medium">Failed</span>
                  )}
                  {f.status === "pending" && (
                    <span className="text-sm text-muted-foreground">Ready</span>
                  )}
                  {f.status === "uploading" && (
                    <span className="text-sm text-blue-600 font-medium">Uploading...</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <Button onClick={handleUploadAll} disabled={!files.some((f) => f.status === "pending")}>
            Upload {files.filter((f) => f.status === "pending").length} file(s)
          </Button>
          <Button variant="outline" onClick={() => router.push("/documents")}>
            Back to Documents
          </Button>
        </div>
      )}
    </div>
  );
}
