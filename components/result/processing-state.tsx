"use client"

import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { CustomizationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Reading the job and your resume", statuses: ["queued", "analyzing"] },
  { label: "Rewriting your resume for this role", statuses: ["tailoring"] },
  { label: "Scoring the result", statuses: ["scoring"] },
] as const

export function useElapsedSeconds(since: string | number) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return now === null ? 0 : Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
}

export type Step = { label: string }

// Generic progress list: steps before `current` are done, `current` spins, the rest wait.
export function StepList({
  steps,
  current,
  since,
  hint,
}: {
  steps: readonly Step[]
  current: number
  since: string | number
  hint: string
}) {
  const elapsed = useElapsedSeconds(since)

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary"
                )}
              >
                {done ? (
                  <CheckIcon className="size-3.5" />
                ) : active ? (
                  <Spinner className="size-3.5" />
                ) : null}
              </span>
              <span
                className={cn(
                  !done && !active && "text-muted-foreground",
                  active && "font-medium"
                )}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {elapsed} s elapsed &middot; {hint}
      </p>
    </div>
  )
}

export function ProcessingSteps({
  status,
  createdAt,
}: {
  status: CustomizationStatus
  createdAt: string
}) {
  const current = STEPS.findIndex((s) =>
    (s.statuses as readonly string[]).includes(status)
  )
  return (
    <StepList steps={STEPS} current={current} since={createdAt} hint="usually 15-40 s" />
  )
}

// Full-page version, used when someone opens a running version directly.
export function ProcessingState(props: {
  status: CustomizationStatus
  createdAt: string
}) {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Working on your resume</CardTitle>
        <CardDescription>
          You can leave this page. Your version is saved in History.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProcessingSteps {...props} />
      </CardContent>
    </Card>
  )
}
