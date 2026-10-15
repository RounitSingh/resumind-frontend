"use client"

import { useState } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { routes } from "@/lib/routes"
import type {
  CustomizationDetail,
  CustomizationResult,
  Scores,
} from "@/lib/types"
import { DownloadMenu } from "./download-menu"
import { CoverLetterPanel } from "./cover-letter-panel"
import { ChangesPanel, KeywordsPanel } from "./feedback-panel"
import { ResumeSheet } from "./resume-sheet"
import { ScoreCards } from "./score-cards"

type Completed = CustomizationDetail & {
  result: CustomizationResult
  scores: Scores
}

// "Frontend Engineer at Acme" -> role + company
function titleOf(d: Completed) {
  const req = d.jobDescription.requirements
  if (req?.role) return { role: req.role, company: req.company }
  const first = d.jobDescription.content.split("\n")[0].trim().slice(0, 80)
  const m = /^(.+?)\s+at\s+(.+)$/i.exec(first)
  return m
    ? { role: m[1], company: m[2] }
    : { role: first || "Tailored resume", company: "" }
}

export function CompletedView({ data }: { data: Completed }) {
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const { role, company } = titleOf(data)
  const date = new Date(data.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="col-span-full flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {role}
            {company && (
              <span className="font-normal text-muted-foreground">
                {" "}
                at {company}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tailored from {data.resume.fileName} &middot; {date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={routes.newVersion(data.id)}
            className={buttonVariants({ variant: "outline" })}
          >
            <RefreshCwIcon />
            New version
          </Link>
          <DownloadMenu id={data.id} onError={setDownloadError} />
        </div>
      </header>

      {downloadError && (
        <Alert variant="destructive" className="col-span-full">
          <AlertTitle>Download failed</AlertTitle>
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      <div className="col-span-full">
        <ScoreCards scores={data.scores} />
      </div>

      <Separator className="col-span-full" />

      <Tabs defaultValue="resume" className="col-span-full gap-4">
        <TabsList variant="line" className="h-auto w-full justify-start border-b">
          <TabsTrigger value="resume" className="flex-none">
            Resume
          </TabsTrigger>
          <TabsTrigger value="changes" className="flex-none">
            What changed
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex-none">
            Keywords
          </TabsTrigger>
          <TabsTrigger value="cover-letter" className="flex-none">
            Cover letter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume">
          <ResumeSheet
            tailored={data.result.resume}
            original={data.original}
            fileName={data.resume.fileName}
          />
        </TabsContent>
        <TabsContent value="changes">
          <ChangesPanel
            result={data.result}
            original={data.original}
            sections={data.sections}
          />
        </TabsContent>
        <TabsContent value="keywords">
          <KeywordsPanel result={data.result} scores={data.scores} />
        </TabsContent>
        <TabsContent value="cover-letter">
          <CoverLetterPanel
            id={data.id}
            initial={data.coverLetter}
            defaultTone={data.tone}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
