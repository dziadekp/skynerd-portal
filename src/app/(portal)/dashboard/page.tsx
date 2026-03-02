"use client";

import { useDashboard } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProgressTimeline } from "@/components/dashboard/progress-timeline";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="rounded-xl border bg-red-50 p-6 text-center">
        <p className="text-red-700">Failed to load dashboard. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <StatsCards stats={data.stats} />
          <ProgressTimeline timeline={data.timeline} />

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentTasks tasks={data.tasks} />

            {/* Active Projects */}
            <Card className="shadow-sm border-0">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {data.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active projects.</p>
                ) : (
                  <div className="space-y-3">
                    {data.projects.slice(0, 4).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          {project.tax_year && (
                            <p className="text-xs text-muted-foreground">
                              Tax Year: {project.tax_year}
                            </p>
                          )}
                        </div>
                        {project.status && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {project.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              href="/tasks"
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span className="text-sm font-medium">View Tasks</span>
            </Link>
            <Link
              href="/documents"
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
              <span className="text-sm font-medium">Documents</span>
            </Link>
            <Link
              href="/documents/upload"
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span className="text-sm font-medium">Upload Files</span>
            </Link>
            <Link
              href="/chat"
              className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              <span className="text-sm font-medium">Messages</span>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
