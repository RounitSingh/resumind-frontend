"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { FileSearchIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { flatten, useCustomizations } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { groupOf, HistoryCard, type StatusGroup } from "./history-card"

type Filter = "all" | StatusGroup

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "done", label: "Done" },
  { key: "working", label: "Working" },
  { key: "failed", label: "Failed" },
]

function NewButton({
  children,
  resumeId,
}: {
  children: React.ReactNode
  resumeId?: string
}) {
  return (
    <Link
      href={resumeId ? routes.withResume(resumeId) : routes.home}
      className={buttonVariants()}
    >
      <PlusIcon />
      {children}
    </Link>
  )
}

// All versions, or only those made from one resume.
export function HistoryList({ resumeId }: { resumeId?: string }) {
  const query = useCustomizations(resumeId)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [moreError, setMoreError] = useState<string | null>(null)

  const total = query.data?.pages[0]?.total ?? 0
  const loadingMore = query.isFetchingNextPage

  async function loadMore() {
    setMoreError(null)
    const r = await query.fetchNextPage()
    if (r.isError) setMoreError(getErrorMessage(r.error))
  }

  const data = query.data
  const items = useMemo(() => flatten(data), [data])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, done: 0, working: 0, failed: 0 }
    for (const i of items) c[groupOf(i.status)]++
    return c
  }, [items])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) =>
        (filter === "all" || groupOf(i.status) === filter) &&
        (!q || `${i.role} ${i.company}`.toLowerCase().includes(q))
    )
  }, [items, filter, search])

  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load your history</AlertTitle>
        <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <FileSearchIcon className="size-6 text-muted-foreground" />
        </span>
        <h2 className="text-lg font-medium">No tailored resumes yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your first one takes about 30 seconds. Each version you make will show up here.
        </p>
        <div className="mt-2">
          <NewButton resumeId={resumeId}>Tailor a resume</NewButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
              <span className="text-xs tabular-nums opacity-80">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role or company"
            aria-label="Search by role or company"
            className="pl-8"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center">
          <p className="font-medium">Nothing matches</p>
          <p className="text-sm text-muted-foreground">
            Try a different search or filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all")
              setSearch("")
            }}
            className={buttonVariants({ variant: "outline", className: "mt-2" })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <HistoryCard item={item} />
            </li>
          ))}
        </ul>
      )}

      {items.length < total && (
        <div className="flex flex-col items-center gap-2">
          {moreError && <p className="text-sm text-destructive">{moreError}</p>}
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Spinner />}
            Load more ({total - items.length} left)
          </Button>
        </div>
      )}
    </div>
  )
}
