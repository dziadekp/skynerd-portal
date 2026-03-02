"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatsProps {
  stats: {
    tasks_total: number;
    tasks_overdue: number;
    tasks_due_today: number;
    projects_count: number;
    documents_count: number;
  };
}

const statItems = [
  { key: "tasks_total", label: "Total Tasks", color: "text-blue-600", bg: "bg-blue-50" },
  { key: "tasks_overdue", label: "Overdue", color: "text-red-600", bg: "bg-red-50" },
  { key: "tasks_due_today", label: "Due Today", color: "text-amber-600", bg: "bg-amber-50" },
  { key: "projects_count", label: "Projects", color: "text-indigo-600", bg: "bg-indigo-50" },
  { key: "documents_count", label: "Documents", color: "text-emerald-600", bg: "bg-emerald-50" },
] as const;

export function StatsCards({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((item) => (
        <Card key={item.key} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className={`inline-flex rounded-lg ${item.bg} p-2 mb-2`}>
              <span className={`text-2xl font-bold ${item.color}`}>
                {stats[item.key]}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {item.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
