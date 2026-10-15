"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDebouncedAction } from "@/hooks/use-debounced-action"
import { useCreateCustomization, useCustomization, useResume } from "@/hooks/use-api"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api"
import { routes } from "@/lib/routes"
import { SECTION_KEYS, type UploadedResume } from "@/lib/types"
import { validateJd } from "@/lib/validation"
import { useWorkspaceStore } from "@/store/workspace-store"
import { AnalyzeDialog } from "@/components/result/progress-dialogs"
import { JdInput } from "./jd-input"
import { ResumeDropzone } from "./resume-dropzone"
import { ResumePicker } from "./resume-picker"

// "New" always starts from scratch. Next keeps a page you navigate away from alive (React
// <Activity> "hidden") instead of unmounting it, so its state would otherwise come back: an old
// form, or a finished job that immediately redirects to its result. So the form is keyed on
// the store's `session` (bumped by every "New" click and every entry to the page) and on the
// URL params: any of them changing remounts it blank.
export function Workspace() {
  const params = useSearchParams()
  const session = useWorkspaceStore((s) => s.session)
  const fromId = params.get("from")
  const keepResume = params.get("keep") === "resume"
  const resumeId = params.get("resume")

  // Every (re)entry starts fresh, also when Next re-shows the kept-alive page. This runs after the
  // form's own effects, so the remounted form then applies its ?from= / ?resume= prefill.
  useLayoutEffect(() => useWorkspaceStore.getState().reset(), [])

  return (
    <WorkspaceForm
      key={`${session}-${fromId ?? ""}-${keepResume}-${resumeId ?? ""}`}
      fromId={fromId}
      keepResume={keepResume}
      resumeId={resumeId}
    />
  )
}

function WorkspaceForm({
  fromId,
  keepResume,
  resumeId,
}: {
  fromId: string | null
  keepResume: boolean
  resumeId: string | null
}) {
  const router = useRouter()
  const { jd, resume, setJd, setResume, clear } = useWorkspaceStore()
  const create = useCreateCustomization()
  const [submitError, setSubmitError] = useState<string | null>(null)
  // set once the job is created; the analyze dialog stays up until the review is ready
  const [jobId, setJobId] = useState<string | null>(null)
  const job = useCustomization(jobId)

  // The store outlives this component: start from an empty form, then apply any prefill below.
  const applied = useRef({ from: false, resume: false })
  useEffect(() => {
    clear()
    applied.current = { from: false, resume: false } // effects can run twice (Strict Mode, re-show)
  }, [clear])

  // "New version": reuse the earlier job description; the resume stays empty so a new one is
  // uploaded. "Try again" (keepResume) reuses the resume too.
  const source = useCustomization(fromId)
  useEffect(() => {
    const d = source.data
    if (!d || applied.current.from) return
    applied.current.from = true
    setJd(d.jobDescription.content)
    if (keepResume) setResume(d.resume as UploadedResume)
  }, [source.data, keepResume, setJd, setResume])

  // "Tailor with this resume" from the Resumes pages.
  const preset = useResume(resumeId)
  useEffect(() => {
    if (!preset.data || applied.current.resume) return
    applied.current.resume = true
    setResume(preset.data)
  }, [preset.data, setResume])

  const prefillError = source.isError || preset.isError

  const jdError = validateJd(jd)
  const ready = !jdError && resume !== null
  const submitting = create.isPending || jobId !== null

  // one line that says what is done or what is still missing
  const status = !jd.trim()
    ? "Add the job description to get started"
    : jdError
      ? jdError
      : !resume
        ? "Now add your resume"
        : "All set. Ready to tailor"

  // Wait for the analysis (review ready, or failed) before leaving the page, so the dialog
  // covers the whole wait. The result page handles every outcome.
  const jobStatus = job.data?.status ?? null
  useEffect(() => {
    if (!jobId) return
    const settled = jobStatus !== null && jobStatus !== "queued" && jobStatus !== "analyzing"
    // on an error the result page shows the real state, or retries
    if (settled || job.isError) router.push(routes.result(jobId))
  }, [jobId, jobStatus, job.isError, router])

  const handleSubmit = useDebouncedAction(async () => {
    if (!ready || !resume) return
    setSubmitError(null)
    try {
      const { id } = await create.mutateAsync({
        resumeId: resume.id,
        jobDescription: jd.trim(),
        sections: [...SECTION_KEYS],
        tone: "professional",
      })
      setJobId(id)
    } catch (e) {
      setSubmitError(getErrorMessage(e))
    }
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AnalyzeDialog open={submitting} status={jobStatus} />
      {prefillError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load that version or resume</AlertTitle>
          <AlertDescription>
            Start fresh by adding a job description and resume below.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle>1. The job you want</CardTitle>
            <CardDescription>
              Paste the full posting: role, requirements and nice-to-haves.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <JdInput />
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-6">
          <Card className="min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle>2. Your resume</CardTitle>
              <CardDescription>
                Pick a saved resume or upload a new one. Files are never stored.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
              <ResumePicker />
              <ResumeDropzone />
            </CardContent>
          </Card>

          <div className="flex shrink-0 flex-col gap-3">
            <p
              className="flex items-center gap-2 text-sm text-muted-foreground"
              aria-live="polite"
            >
              {ready ? (
                <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
              ) : (
                <CircleDashedIcon className="size-4 shrink-0" />
              )}
              {status}
            </p>

            {submitError && (
              <Alert variant="destructive">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button
              size="lg"
              className="h-10 w-full text-sm"
              disabled={!ready || submitting}
              onClick={handleSubmit}
            >
              {submitting && <Spinner />}
              {submitting ? "Starting..." : "Tailor my resume"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Takes about 30 seconds. We never invent experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
