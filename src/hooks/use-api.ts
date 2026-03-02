"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  DashboardData,
  Task,
  TaskSummary,
  Project,
  Document,
  Folder,
  ChatRoom,
  ChatMessage,
  Account,
  Timeline,
} from "@/lib/types";

// Dashboard
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<DashboardData>("/api/portal/dashboard");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Tasks
export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.get<Task[]>("/api/portal/tasks");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useTaskSummary() {
  return useQuery({
    queryKey: ["tasks", "summary"],
    queryFn: async () => {
      const res = await api.get<TaskSummary>("/api/portal/tasks/summary");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 3 * 60 * 1000,
  });
}

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<Project[]>("/api/portal/projects");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTimeline() {
  return useQuery({
    queryKey: ["timeline"],
    queryFn: async () => {
      const res = await api.get<Timeline>("/api/portal/projects/timeline");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Documents
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.get<Document[]>("/api/portal/documents");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFolders() {
  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await api.get<Folder[]>("/api/portal/documents/folders");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await api.get<Account[]>("/api/portal/accounts");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });
}

// Chat
export function useChatRooms() {
  return useQuery({
    queryKey: ["chat", "rooms"],
    queryFn: async () => {
      const res = await api.get<ChatRoom[]>("/api/portal/chat/rooms");
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 30 * 1000,
  });
}

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: ["chat", "messages", roomId],
    queryFn: async () => {
      const res = await api.get<ChatMessage[]>(
        `/api/portal/chat/rooms/${roomId}/messages`
      );
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!roomId,
    staleTime: 10 * 1000,
  });
}

export function useMarkRoomRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await api.post(`/api/portal/chat/rooms/${roomId}/read`);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "rooms"] });
    },
  });
}
