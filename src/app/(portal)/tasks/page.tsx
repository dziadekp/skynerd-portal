"use client";

import { useState } from "react";
import { useTasks, useTaskSummary } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SOURCE_BADGES, PRIORITY_COLORS, TASK_STATUS_COLORS } from "@/lib/constants";

type FilterType = "all" | "overdue" | "skynerd" | "truss";

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: summary } = useTaskSummary();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTasks = tasks?.filter((task) => {
    if (filter === "overdue") return task.is_overdue;
    if (filter === "skynerd") return task.source === "skynerd";
    if (filter === "truss") return task.source === "truss";
    return true;
  });

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

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks?.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No tasks found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks?.map((task) => {
              const source = SOURCE_BADGES[task.source];
              return (
                <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
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
                          "rounded px-2 py-0.5 text-[10px] font-medium capitalize",
                          TASK_STATUS_COLORS[task.status] || "bg-gray-100 text-gray-700"
                        )}>
                          {task.status.replace("_", " ")}
                        </span>
                        {task.is_overdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Overdue
                          </Badge>
                        )}
                        {task.priority && (
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
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
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
