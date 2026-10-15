"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useCustomization } from "@/hooks/use-api"
import { CompletedView } from "./completed-view"
import { FailedState } from "./failed-state"
import { NotFoundState } from "./not-found-state"
import { ProcessingState } from "./processing-state"
import { ReviewView } from "./review-view"

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

export function CustomizationView({ id }: { id: string }) {
  const { data, error } = useCustomization(id)

  if (error?.status === 404) return <NotFoundState />
  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load this version</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }
  if (!data) return <ResultSkeleton />

  if (data.status === "failed") {
    return <FailedState id={id} message={data.error} />
  }
  if (data.status === "completed" && data.result && data.scores) {
    return (
      <CompletedView
        data={{ ...data, result: data.result, scores: data.scores }}
      />
    )
  }
  // tailoring/scoring keep the review page underneath; its "Updating" dialog covers it
  if (
    (data.status === "review" || data.status === "tailoring" || data.status === "scoring") &&
    data.review &&
    data.scores
  ) {
    return (
      <ReviewView data={{ ...data, review: data.review, scores: data.scores }} />
    )
  }
  return <ProcessingState status={data.status} createdAt={data.createdAt} />
}
