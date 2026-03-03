"use client";

import { useMemo, useState } from "react";
import { useDocuments } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.includes("pdf")) return "PDF";
  if (contentType.includes("image")) return "IMG";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "XLS";
  if (contentType.includes("document") || contentType.includes("word")) return "DOC";
  return "FILE";
}

function getFileIconColor(contentType: string) {
  if (contentType.includes("pdf")) return "bg-red-50 text-red-600";
  if (contentType.includes("image")) return "bg-green-50 text-green-600";
  if (contentType.includes("spreadsheet") || contentType.includes("excel")) return "bg-emerald-50 text-emerald-600";
  if (contentType.includes("document") || contentType.includes("word")) return "bg-blue-50 text-blue-600";
  return "bg-gray-50 text-gray-600";
}

export default function DocumentsPage() {
  const { data: documents, isLoading } = useDocuments();
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const groupedDocs = useMemo(() => {
    if (!documents) return {};
    const groups: Record<string, typeof documents> = {};
    documents.forEach((doc) => {
      const key = doc.folder || "Other Documents";
      (groups[key] ??= []).push(doc);
    });
    // Sort files within each group by date (newest first)
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return groups;
  }, [documents]);

  const folderNames = useMemo(() => Object.keys(groupedDocs).sort(), [groupedDocs]);

  function toggleFolder(folder: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground">Your tax documents and files</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : documents?.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <p className="text-muted-foreground">No documents yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {folderNames.map((folderName) => {
            const docs = groupedDocs[folderName];
            const isCollapsed = collapsedFolders.has(folderName);

            return (
              <div key={folderName} className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* Folder header */}
                <button
                  onClick={() => toggleFolder(folderName)}
                  className="flex w-full items-center gap-3 px-4 py-3 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-500 shrink-0"
                  >
                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                  </svg>
                  <span className="font-medium text-sm flex-1">{folderName}</span>
                  <span className="text-xs text-muted-foreground mr-2">
                    {docs.length} file{docs.length !== 1 ? "s" : ""}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-muted-foreground transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Files in folder */}
                {!isCollapsed && (
                  <div className="divide-y">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${getFileIconColor(doc.content_type)}`}>
                          {getFileIcon(doc.content_type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)}
                            {doc.created_at && (
                              <> &middot; {new Date(doc.created_at).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        {doc.download_url && (
                          <a
                            href={doc.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-sm text-primary hover:underline"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
