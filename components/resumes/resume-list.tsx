"use client"

import { useState } from "react"
import Link from "next/link"
import { FileTextIcon, PlusIcon, Trash2Icon, UploadCloudIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { flatten, useDeleteResume, useResumes } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import { routes } from "@/lib/routes"
import type { ResumeSummary } from "@/lib/types"
import { formatBytes } from "@/lib/utils"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export function ResumeList() {
  const query = useResumes()
  const del = useDeleteResume()
  const [toDelete, setToDelete] = useState<ResumeSummary | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const items = flatten(query.data)
  const total = query.data?.pages[0]?.total ?? 0
  const loadingMore = query.isFetchingNextPage
  const deleting = del.isPending

  async function loadMore() {
    setActionError(null)
    const r = await query.fetchNextPage()
    if (r.isError) setActionError(getErrorMessage(r.error))
  }

  async function confirmDelete() {
    if (!toDelete) return
    setActionError(null)
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch (e) {
      setActionError(getErrorMessage(e))
    }
  }

  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load your resumes</AlertTitle>
        <AlertDescription>{getErrorMessage(query.error)}</AlertDescription>
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <UploadCloudIcon className="size-6 text-muted-foreground" />
        </span>
        <h2 className="text-lg font-medium">No resumes yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Upload a resume when you tailor one. It will be saved here so you can reuse it.
        </p>
        <Link href={routes.home} className={buttonVariants({ className: "mt-2" })}>
          <PlusIcon />
          Tailor a resume
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex h-full flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10"
          >
            <div className="flex items-start gap-3">
              <FileTextIcon className="mt-0.5 size-8 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">{r.fileName}</h2>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(r.fileSize)} &middot; uploaded {formatDate(r.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${r.fileName}`}
                onClick={() => setToDelete(r)}
              >
                <Trash2Icon />
              </Button>
            </div>

            <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {r.customizationCount}
              </span>{" "}
              {r.customizationCount === 1 ? "version" : "versions"}
              {r.lastUsedAt && <> &middot; last on {formatDate(r.lastUsedAt)}</>}
            </p>

            <div className="mt-auto flex gap-2">
              <Link
                href={routes.resume(r.id)}
                className={buttonVariants({ variant: "outline", className: "flex-1" })}
              >
                History
              </Link>
              <Link
                href={routes.withResume(r.id)}
                className={buttonVariants({ className: "flex-1" })}
              >
                <PlusIcon />
                Tailor
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {items.length < total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Spinner />}
            Load more ({total - items.length} left)
          </Button>
        </div>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.fileName} and all{" "}
              {toDelete?.customizationCount ?? 0} tailored{" "}
              {toDelete?.customizationCount === 1 ? "version" : "versions"} made from it will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault() // keep the dialog open until the request finishes
                void confirmDelete()
              }}
            >
              {deleting && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
