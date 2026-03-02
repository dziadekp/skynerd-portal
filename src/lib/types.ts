// Portal API TypeScript interfaces

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  contact_id: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  role?: string;
}

export interface AccountWithPermissions extends Account {
  permissions: {
    can_login: boolean;
    can_view_documents: boolean;
    can_upload_documents: boolean;
    can_sign: boolean;
  };
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  accounts: Account[];
  requires_account_selection: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  due_date: string | null;
  completed: boolean;
  priority: string | null;
  project_id: string | null;
  source: "skynerd" | "truss";
  action_url: string | null;
  action_type?: "upload" | "sign" | "view";
  is_overdue: boolean;
}

export interface TaskSummary {
  total: number;
  overdue: number;
  due_today: number;
  from_skynerd: number;
  from_truss: number;
}

export interface Project {
  id: string;
  name: string;
  status: string | null;
  tax_year: string | null;
  project_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  truss_url: string;
  source: string;
}

export interface TimelineStage {
  id: number;
  key: string;
  label: string;
  icon: string;
  description: string;
  next_action: string | null;
}

export interface Timeline {
  project: Project | null;
  current_stage: TimelineStage | null;
  all_stages: TimelineStage[];
}

export interface Document {
  id: string;
  name: string;
  folder: string;
  folder_id: string | null;
  size: number | null;
  content_type: string;
  created_at: string | null;
  download_url: string | null;
  source: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface DashboardData {
  account: Account;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  stats: {
    tasks_total: number;
    tasks_overdue: number;
    tasks_due_today: number;
    projects_count: number;
    documents_count: number;
  };
  tasks: Task[];
  projects: Project[];
  timeline: Timeline | null;
}

export interface ChatRoom {
  id: string;
  uuid: string;
  name: string;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_portal_user: boolean;
  };
  is_own: boolean;
  timestamp: string;
}

export interface UploadUrlResponse {
  signed_id: string;
  upload_url: string;
  upload_headers: Record<string, string>;
  folder_id: string | null;
}
