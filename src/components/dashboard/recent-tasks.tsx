"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { SOURCE_BADGES, PRIORITY_COLORS } from "@/lib/constants";

interface RecentTasksProps {
  tasks: Task[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const displayTasks = tasks.slice(0, 5);

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Recent Tasks</h3>
        <Link
          href="/tasks"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="divide-y">
        {displayTasks.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No tasks found.</p>
        ) : (
          displayTasks.map((task) => {
            const source = SOURCE_BADGES[task.source];
            return (
              <div key={task.id} className="flex items-start gap-3 p-4">
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-[10px] px-1.5", source?.className)}
                >
                  {source?.label}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {task.is_overdue && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Overdue
                      </Badge>
                    )}
                    {task.priority && (
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
