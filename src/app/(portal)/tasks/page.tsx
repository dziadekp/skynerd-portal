"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTasks, useTaskSummary } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SOURCE_BADGES, PRIORITY_COLORS, TASK_STATUS_COLORS } from "@/lib/constants";
import type { Task } from "@/lib/types";

type FilterType = "all" | "overdue" | "skynerd" | "truss";

const REVIEW_STATUSES = new Set(["under_review", "review", "client_review"]);
const COMPLETED_STATUSES = new Set(["completed", "approved", "filed", "cancelled"]);

function groupTasks(tasks: Task[]) {
  const todo: Task[] = [];
  const review: Task[] = [];
  const completed: Task[] = [];

  for (const task of tasks) {
    if (task.completed || COMPLETED_STATUSES.has(task.status)) {
      completed.push(task);
    } else if (REVIEW_STATUSES.has(task.status)) {
      review.push(task);
    } else {
      todo.push(task);
    }
  }

  return { todo, review, completed };
}

function TaskCard({ task }: { task: Task }) {
  const source = SOURCE_BADGES[task.source];

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="flex items-start gap-4 p-4">
        {/* Completion indicator */}
        <div className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          task.completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300"
        )}>
          {task.completed && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px]", source?.className)}
            >
              {source?.label}
            </Badge>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize",
              TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-700 border border-gray-200"
            )}>
              {task.status.replace(/_/g, " ")}
            </span>
            {task.is_overdue && (
              <Badge variant="destructive" className="text-xs px-2.5 py-1 font-semibold">
                Overdue
              </Badge>
            )}
            {task.priority && (
              <span className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                PRIORITY_COLORS[task.priority]
              )}>
                {task.priority}
              </span>
            )}
            {task.due_date && (
              <span className="text-xs text-muted-foreground">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Action buttons for tasks */}
          {!task.completed && task.action_url && (
            <div className="mt-3 flex flex-wrap gap-2">
              {task.action_type === "upload" ? (
                task.action_url.startsWith("http") ? (
                  <a href={task.action_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="default" className="h-7 text-xs gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      Upload Documents
                    </Button>
                  </a>
                ) : (
                  <Link href={task.action_url}>
                    <Button size="sm" variant="default" className="h-7 text-xs gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      Upload Documents
                    </Button>
                  </Link>
                )
              ) : task.action_type === "sign" ? (
                <a href={task.action_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z"/></svg>
                    Sign in Truss
                  </Button>
                </a>
              ) : task.source === "truss" ? (
                <a href={task.action_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    View in Truss
                  </Button>
                </a>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  headerColor: string;
  icon: React.ReactNode;
}

function TaskSection({ title, tasks, headerColor, icon }: TaskSectionProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", headerColor)}>
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium">
          {tasks.length}
        </span>
      </div>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: summary } = useTaskSummary();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      if (filter === "overdue") return task.is_overdue;
      if (filter === "skynerd") return task.source === "skynerd";
      if (filter === "truss") return task.source === "truss";
      return true;
    });
  }, [tasks, filter]);

  const groups = useMemo(() => groupTasks(filteredTasks), [filteredTasks]);

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All", count: summary?.total },
    { key: "overdue", label: "Overdue", count: summary?.overdue },
    { key: "skynerd", label: "SkyNerd", count: summary?.from_skynerd },
    { key: "truss", label: "Truss", count: summary?.from_truss },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">Your combined task list</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-white text-muted-foreground hover:bg-gray-100 border"
            )}
          >
            {f.label}
            {f.count !== undefined && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                filter === f.key ? "bg-white/20" : "bg-gray-100"
              )}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task sections */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tasks found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <TaskSection
            title="To Do"
            tasks={groups.todo}
            headerColor="bg-blue-50 text-blue-800"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
          />
          <TaskSection
            title="Under Review"
            tasks={groups.review}
            headerColor="bg-purple-50 text-purple-800"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          />
          <TaskSection
            title="Completed"
            tasks={groups.completed}
            headerColor="bg-green-50 text-green-800"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
          />
        </div>
      )}
    </div>
  );
}
