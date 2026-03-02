// API and app constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Internal (server-side) API URL — used by BFF proxy routes
export const INTERNAL_API_URL = process.env.API_URL || API_BASE_URL;

export const TIMELINE_STAGES = [
  { key: "engagement", label: "Engagement", icon: "FileText" },
  { key: "organizer", label: "Organizer Sent", icon: "Send" },
  { key: "documents", label: "Documents Received", icon: "FileCheck" },
  { key: "preparation", label: "In Preparation", icon: "Wrench" },
  { key: "review", label: "Under Review", icon: "Eye" },
  { key: "client_review", label: "Client Review", icon: "UserCheck" },
  { key: "filing", label: "Filing", icon: "Upload" },
  { key: "complete", label: "Complete", icon: "CheckCircle" },
] as const;

export const TASK_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
  overdue: "bg-red-100 text-red-800",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export const SOURCE_BADGES: Record<string, { label: string; className: string }> = {
  skynerd: { label: "S", className: "bg-indigo-100 text-indigo-700" },
  truss: { label: "T", className: "bg-emerald-100 text-emerald-700" },
};
