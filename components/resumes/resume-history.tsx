"use client"

import Link from "next/link"
import { ArrowLeftIcon, FileTextIcon, PlusIcon } from "lucide-react"

import { HistoryList } from "@/components/history/history-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useResume } from "@/hooks/use-api"
import { ApiError, getErrorMessage } from "@/lib/api"
import { routes } from "@/lib/routes"

// One resume and every version made from it.
export function ResumeHistory({ id }: { id: string }) {
  const { data: resume, error, isPending } = useResume(id)

  if (isPending) return <Skeleton className="h-24 rounded-xl" aria-busy="true" />

  const missing = error instanceof ApiError && error.status === 404
  if (!resume) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {missing ? "Resume not found" : "Couldn't load this resume"}
        </AlertTitle>
        <AlertDescription>
          {missing ? "It may have been deleted." : getErrorMessage(error)}{" "}
          <Link href={routes.resumes} className="underline">
            Back to resumes
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <Link
          href={routes.resumes}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          All resumes
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileTextIcon className="size-8 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{resume.fileName}</h1>
              <p className="text-sm text-muted-foreground">
                {resume.customizationCount}{" "}
                {resume.customizationCount === 1 ? "version" : "versions"} made from this resume
              </p>
            </div>
          </div>
          <Link href={routes.withResume(resume.id)} className={buttonVariants()}>
            <PlusIcon />
            New version
          </Link>
        </div>
      </section>
      <HistoryList resumeId={resume.id} />
    </>
  )
}
