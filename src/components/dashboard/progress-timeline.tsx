"use client";

import { cn } from "@/lib/utils";
import type { Timeline } from "@/lib/types";

interface ProgressTimelineProps {
  timeline: Timeline | null;
}

export function ProgressTimeline({ timeline }: ProgressTimelineProps) {
  if (!timeline || !timeline.all_stages.length) {
    return null;
  }

  const currentStageId = timeline.current_stage?.id ?? -1;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold">Tax Return Progress</h3>
      {timeline.project && (
        <p className="mb-4 text-sm text-muted-foreground">
          {timeline.project.name}
        </p>
      )}

      {/* Timeline steps */}
      <div className="relative">
        <div className="flex items-start justify-between">
          {timeline.all_stages.map((stage, index) => {
            const isPast = stage.id < currentStageId;
            const isCurrent = stage.id === currentStageId;

            return (
              <div
                key={stage.id}
                className="flex flex-col items-center text-center relative"
                style={{ width: `${100 / timeline.all_stages.length}%` }}
              >
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                      isPast || isCurrent ? "bg-primary" : "bg-gray-200"
                    )}
                    style={{ width: "100%", right: "50%" }}
                  />
                )}

                {/* Circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                    isPast && "border-primary bg-primary text-white",
                    isCurrent && "border-primary bg-primary/10 text-primary ring-4 ring-primary/20",
                    !isPast && !isCurrent && "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isPast ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-[10px] leading-tight font-medium sm:text-xs",
                    isCurrent ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage description */}
      {timeline.current_stage && (
        <div className="mt-6 rounded-lg bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary">
            Current: {timeline.current_stage.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {timeline.current_stage.description}
          </p>
          {timeline.current_stage.next_action && (
            <p className="mt-2 text-xs text-muted-foreground">
              Next: {timeline.current_stage.next_action}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
