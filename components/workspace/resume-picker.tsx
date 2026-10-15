"use client"

import { useState } from "react"
import { FileTextIcon, Trash2Icon } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useDeleteResume, useRecentResumes } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import type { ResumeSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/store/workspace-store"

// An account holds at most 20 resumes (the backend cap), so one request covers them all.
const LIMIT = 20

// The user's uploaded resumes, so a returning user doesn't upload the same file again, with a
// delete icon on each. The list is a box two rows tall that scrolls vertically. Hidden while a
// resume is selected (the dropzone then shows it) and when there are none. A failed load is
// ignored: uploading still works.
export function ResumePicker() {
  const selected = useWorkspaceStore((s) => s.resume)
  const select = useWorkspaceStore((s) => s.setResume)
  const items = useRecentResumes(LIMIT).data?.items ?? []
  const del = useDeleteResume()
  const [toDelete, setToDelete] = useState<ResumeSummary | null>(null)

  async function confirmDelete() {
    if (!toDelete) return
    try {
      await del.mutateAsync(toDelete.id)
      setToDelete(null)
    } catch {
      // the error shows in the dialog below via del.error
    }
  }

  if (selected || items.length === 0) return null

  return (
    <div className="mb-3 flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">Your resumes</p>
      <ul className="flex max-h-[7.125rem] flex-col gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {items.map((r) => (
          <li key={r.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => select(r)}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg border p-2 text-left text-sm outline-none transition-colors",
                "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
            >
              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.fileName}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.customizationCount} {r.customizationCount === 1 ? "version" : "versions"}
                </span>
              </span>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${r.fileName}`}
              onClick={() => {
                del.reset()
                setToDelete(r)
              }}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted-foreground">or upload a new one</p>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.fileName} and all {toDelete?.customizationCount ?? 0} tailored{" "}
              {toDelete?.customizationCount === 1 ? "version" : "versions"} made from it will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {del.error && (
            <Alert variant="destructive">
              <AlertDescription>{getErrorMessage(del.error)}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault() // keep the dialog open until the request finishes
                void confirmDelete()
              }}
            >
              {del.isPending && <Spinner />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
