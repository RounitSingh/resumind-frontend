"use client"

import { LightbulbIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useDebouncedAction } from "@/hooks/use-debounced-action"
import { useTailorCustomization } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import type { CustomizationDetail, ReviewItem, ReviewResult, Scores } from "@/lib/types"
import { UpdateDialog } from "./progress-dialogs"
import { Sheet } from "./resume-sheet"
import { ScoreCards } from "./score-cards"

type Review = CustomizationDetail & { review: ReviewResult; scores: Scores }

const PRIORITY: Record<ReviewItem["priority"], { label: string; dot: string; pill: string }> = {
  high: {
    label: "High priority",
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-700 dark:text-red-300",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-500",
    pill: "bg-amber-400/20 text-amber-800 dark:text-amber-300",
  },
  low: {
    label: "Low",
    dot: "bg-muted-foreground/50",
    pill: "bg-muted text-muted-foreground",
  },
}

// Step 1 of the flow: stats and feedback on the ORIGINAL resume. Nothing is rewritten
// until the user clicks "Update resume"; the stats are then recomputed on the tailored one.
export function ReviewView({ data }: { data: Review }) {
  const tailor = useTailorCustomization(data.id)
  const starting = tailor.isPending
  const { role, company } = data.jobDescription.requirements ?? { role: "", company: "" }

  // tailoring/scoring come from polling; `starting` covers the POST itself
  const working = data.status === "tailoring" || data.status === "scoring"

  const handleUpdate = useDebouncedAction(async () => {
    await tailor.mutateAsync().catch(() => {}) // the error shows below via tailor.error
  })

  const error = tailor.error ? getErrorMessage(tailor.error) : data.error

  return (
    <div className="grid grid-cols-1 gap-6">
      <UpdateDialog open={starting || working} status={data.status} />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {role || "Resume review"}
            {company && <span className="font-normal text-muted-foreground"> at {company}</span>}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How {data.resume.fileName} fits this job today
          </p>
        </div>
        <Button onClick={handleUpdate} disabled={starting || working}>
          {starting || working ? <Spinner /> : <SparklesIcon />}
          Update resume
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t update the resume</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScoreCards scores={data.scores} current />

      <Card size="sm">
        <CardContent className="text-sm leading-relaxed">{data.review.verdict}</CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4">
        <div>
          <h2 className="text-lg font-semibold">Your resume</h2>
          <p className="text-sm text-muted-foreground">As uploaded: {data.resume.fileName}</p>
        </div>
        {data.original ? (
          <div className="app-scrollbar max-h-[75vh] overflow-y-auto rounded-md">
            <Sheet r={data.original} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Original resume isn&apos;t available.</p>
        )}
      </section>

      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">What needs to change</h2>
          <p className="text-sm text-muted-foreground">
            &ldquo;Update resume&rdquo; applies these and re-scores the tailored version.
          </p>
        </div>
        {data.review.items.map((item, i) => {
          const p = PRIORITY[item.priority] ?? PRIORITY.medium
          return (
            <Card key={i} className="gap-0 overflow-hidden py-0">
              <CardHeader className="flex items-center gap-3 px-5 py-3.5">
                <span className={`size-2 shrink-0 rounded-full ${p.dot}`} />
                <CardTitle className="text-base capitalize">{item.section}</CardTitle>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${p.pill}`}>
                  {p.label}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 border-t px-5 py-4 text-sm">
                <p className="leading-relaxed">{item.issue}</p>
                <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-3">
                  <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <p className="leading-relaxed text-muted-foreground">{item.suggestion}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      </div>
    </div>
  )
}
