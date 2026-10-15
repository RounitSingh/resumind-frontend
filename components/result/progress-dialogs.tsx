"use client"

import { useState } from "react"
import { FileSearchIcon, WandSparklesIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CustomizationStatus } from "@/lib/types"
import { StepList } from "./processing-state"

// A modal the user can't dismiss while work is running (no close button, no Esc / outside click).
function BlockingDialog({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: typeof FileSearchIcon
  children: React.ReactNode
}) {
  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

const ANALYZE_STEPS = [
  { label: "Reading your resume and the job" },
  { label: "Scoring the fit and writing feedback" },
] as const

// Shown on the home page after "Tailor my resume" is clicked, until the review is ready.
// Mounted only while open, so the elapsed timer starts at 0 each time.
export function AnalyzeDialog({ open, status }: { open: boolean; status: CustomizationStatus | null }) {
  return open ? <AnalyzeDialogBody status={status} /> : null
}

function AnalyzeDialogBody({ status }: { status: CustomizationStatus | null }) {
  const [since] = useState(() => Date.now())
  const current = status === "analyzing" ? 1 : 0
  return (
    <BlockingDialog
      icon={FileSearchIcon}
      title="Analyzing your resume"
      description="We're comparing it with the job. Nothing is rewritten yet."
    >
      <StepList steps={ANALYZE_STEPS} current={current} since={since} hint="usually 10-30 s" />
    </BlockingDialog>
  )
}

const UPDATE_STEPS = [
  { label: "Rewriting your resume for this role" },
  { label: "Re-scoring the updated resume" },
] as const

// Shown on the review page after "Update resume" is clicked, until the tailored result is ready.
export function UpdateDialog({ open, status }: { open: boolean; status: CustomizationStatus }) {
  return open ? <UpdateDialogBody status={status} /> : null
}

function UpdateDialogBody({ status }: { status: CustomizationStatus }) {
  const [since] = useState(() => Date.now())
  const current = status === "scoring" ? 1 : 0
  return (
    <BlockingDialog
      icon={WandSparklesIcon}
      title="Updating your resume"
      description="Applying the feedback. Only facts from your resume are used."
    >
      <StepList steps={UPDATE_STEPS} current={current} since={since} hint="usually 15-40 s" />
    </BlockingDialog>
  )
}
