import Link from "next/link"
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  CheckCircle2Icon,
  FileTextIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { routes } from "@/lib/routes"
import type { CustomizationSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

export type StatusGroup = "done" | "working" | "failed"

export function groupOf(s: CustomizationSummary["status"]): StatusGroup {
  if (s === "completed") return "done"
  if (s === "failed") return "failed"
  return "working"
}

// Status is always a word plus an icon, never colour alone.
const STATUS = {
  done: {
    label: "Done",
    icon: CheckCircle2Icon,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  working: {
    label: "Working",
    icon: null,
    className: "bg-primary/10 text-primary",
  },
  failed: {
    label: "Failed",
    icon: TriangleAlertIcon,
    className: "bg-destructive/10 text-destructive",
  },
} as const

function band(pct: number) {
  if (pct >= 75) return "text-emerald-600 dark:text-emerald-400"
  if (pct >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function HistoryCard({ item }: { item: CustomizationSummary }) {
  const group = groupOf(item.status)
  const st =
    item.status === "review"
      ? { ...STATUS.working, label: "Ready to review", icon: FileTextIcon }
      : STATUS[group]
  const Icon = st.icon

  return (
    <Link
      href={routes.result(item.id)}
      className="group/card-link flex h-full flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium">{item.role || "Untitled role"}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <BriefcaseBusinessIcon className="size-3.5 shrink-0" />
            {item.company || "Company not stated"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            st.className
          )}
        >
          {Icon ? <Icon className="size-3" /> : <Spinner className="size-3" />}
          {st.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
        {group === "done" && item.matchAfter !== null ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground">Job match</p>
              <p className="mt-0.5 flex items-baseline gap-1.5 tabular-nums">
                {item.matchBefore !== null && (
                  <span className="text-sm text-muted-foreground">
                    {item.matchBefore}%
                    <span aria-hidden> →</span>
                    <span className="sr-only"> to</span>
                  </span>
                )}
                <span className={cn("text-lg font-semibold", band(item.matchAfter))}>
                  {item.matchAfter}%
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ATS score</p>
              <p
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  item.atsScore !== null && band(item.atsScore)
                )}
              >
                {item.atsScore ?? "-"}
                <span className="text-sm font-normal text-muted-foreground"> / 100</span>
              </p>
            </div>
          </>
        ) : (
          <p className="col-span-2 text-sm text-muted-foreground">
            {group === "failed"
              ? "Didn't finish. Open it to try again."
              : "Scores appear when it's done."}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <FileTextIcon className="size-3.5 shrink-0" />
          <span className="truncate">{item.fileName}</span>
          <span aria-hidden>&middot;</span>
          <span className="shrink-0">{formatDate(item.createdAt)}</span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 transition-transform group-hover/card-link:translate-x-0.5 motion-reduce:transition-none" />
      </div>
    </Link>
  )
}
