"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFolders } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function UploadPageInner() {
  const searchParams = useSearchParams();
  const initialFolderId = searchParams.get("folder_id") || "";
  const taskId = searchParams.get("task_id") || "";
  const projectId = searchParams.get("project_id") || "";
  const isTaskUpload = Boolean(taskId && projectId);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [folderId, setFolderId] = useState<string>(initialFolderId);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const { data: folders } = useFolders();
  const router = useRouter();

  // Validate the URL-provided folder_id once folders load
  useEffect(() => {
    if (initialFolderId && folders) {
      const exists = folders.some((f) => String(f.id) === initialFolderId);
      if (!exists) {
        setFolderId("");
      }
    }
  }, [initialFolderId, folders]);

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

  async function uploadFile(uploadFile: UploadFile, index: number): Promise<boolean> {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading", progress: 10 } : f))
    );

    try {
      const proxyForm = new FormData();
      proxyForm.append("file", uploadFile.file);
      if (folderId) {
        proxyForm.append("folder_id", folderId);
      }
      // Pass task_id so the file gets linked as a touchpoint on the task
      if (taskId) {
        proxyForm.append("task_id", taskId);
      }

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 30 } : f))
      );

      const uploadRes = await fetch("/api/upload-proxy", {
        method: "POST",
        body: proxyForm,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: 100, status: "done" } : f
        )
      );
      return true;
    } catch (err) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : f
        )
      );
      return false;
    }
  }

  /**
   * After successful uploads, mark the Truss task as pending_review.
   * This tells the accountant the client has submitted their documents.
   */
  async function completeTask(): Promise<boolean> {
    if (!isTaskUpload) return false;

    try {
      setIsCompletingTask(true);
      const res = await fetch(
        `/api/portal/tasks/${projectId}/${taskId}/complete/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[upload] Task completion failed:", err);
        // Don't fail the whole flow — upload succeeded, task update is best-effort
        toast.error("Documents uploaded, but couldn't update task status. Your accountant will see the files.");
        return false;
      }

      return true;
    } catch (err) {
      console.error("[upload] Task completion error:", err);
      toast.error("Documents uploaded, but couldn't update task status.");
      return false;
    } finally {
      setIsCompletingTask(false);
    }
  }

  async function handleUploadAll() {
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        const ok = await uploadFile(files[i], i);
        if (ok) successCount++;
      }
    }

    if (successCount > 0) {
      // If this upload was triggered from a task, mark the task as pending_review
      if (isTaskUpload) {
        const taskCompleted = await completeTask();
        if (taskCompleted) {
          toast.success(
            `${successCount} file(s) uploaded and task marked for review!`
          );
        }
      } else {
        toast.success(`${successCount} file(s) uploaded successfully`);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground">
          {isTaskUpload
            ? "Upload the requested documents to complete your task"
            : "Upload files to your account"}
        </p>
      </div>

      {/* Task context banner */}
      {isTaskUpload && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-start gap-3 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-blue-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Task upload
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Once you upload the files, this task will automatically be marked as submitted for review.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                <SelectItem key={folder.id} value={String(folder.id)}>
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
              <div key={`${f.file.name}-${f.file.size}-${index}`} className="flex items-center gap-3 p-4">
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
          <Button
            onClick={handleUploadAll}
            disabled={!files.some((f) => f.status === "pending") || isCompletingTask}
          >
            {isCompletingTask
              ? "Completing task..."
              : `Upload ${files.filter((f) => f.status === "pending").length} file(s)`}
          </Button>
          <Button variant="outline" onClick={() => router.push(isTaskUpload ? "/tasks" : "/documents")}>
            {isTaskUpload ? "Back to Tasks" : "Back to Documents"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <UploadPageInner />
    </Suspense>
  );
}
