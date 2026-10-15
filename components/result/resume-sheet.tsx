"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { resumeToText } from "@/lib/resume-text"
import type { StructuredResume } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy-button"

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 mb-1.5 border-b border-neutral-300 pb-0.5 text-[11px] font-semibold tracking-widest uppercase">
      {children}
    </h3>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="ml-4 list-disc">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  )
}

// Always a white "paper" sheet, even in dark mode, so it reads as a document.
export function Sheet({ r }: { r: StructuredResume }) {
  return (
    <div className="rounded-md bg-white p-6 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-black/10">
      <div className="text-center">
        <p className="text-xl font-semibold">{r.name}</p>
        {r.headline && <p>{r.headline}</p>}
        <p className="text-xs text-neutral-600">{r.contact.join("  |  ")}</p>
      </div>

      {r.summary && (
        <>
          <Heading>Summary</Heading>
          <p>{r.summary}</p>
        </>
      )}

      {r.skills.length > 0 && (
        <>
          <Heading>Skills</Heading>
          {r.skills.map((s) => (
            <p key={s.category}>
              {s.category && <span className="font-semibold">{s.category}: </span>}
              {s.items.join(", ")}
            </p>
          ))}
        </>
      )}

      {r.experience.length > 0 && (
        <>
          <Heading>Experience</Heading>
          {r.experience.map((e) => (
            <div key={e.title + e.company} className="mb-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {e.title}, {e.company}
                </p>
                <span className="shrink-0 text-xs text-neutral-600">
                  {e.period}
                </span>
              </div>
              <Bullets items={e.bullets} />
            </div>
          ))}
        </>
      )}

      {r.projects.length > 0 && (
        <>
          <Heading>Projects</Heading>
          {r.projects.map((p) => (
            <div key={p.name} className="mb-2">
              <p className="font-semibold">
                {p.name}{" "}
                <span className="font-normal text-neutral-600">({p.tech})</span>
              </p>
              <Bullets items={p.bullets} />
            </div>
          ))}
        </>
      )}

      {r.education.length > 0 && (
        <>
          <Heading>Education</Heading>
          {r.education.map((e) => (
            <div
              key={e.degree}
              className="flex items-baseline justify-between gap-2"
            >
              <p>
                <span className="font-semibold">{e.degree}</span>, {e.institution}
              </p>
              <span className="shrink-0 text-xs text-neutral-600">
                {e.period}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export function ResumeSheet({
  tailored,
  original,
  fileName,
}: {
  tailored: StructuredResume
  original: StructuredResume | null
  fileName: string
}) {
  const [view, setView] = useState<"tailored" | "original">("tailored")
  const shown = view === "original" && original ? original : tailored

  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Your resume</CardTitle>
          <CopyButton getText={() => resumeToText(shown)} />
        </div>
        <div
          className="mt-1 inline-flex w-fit rounded-lg bg-muted p-0.5 text-xs"
          role="group"
          aria-label="Resume version"
        >
          {(["tailored", "original"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              disabled={v === "original" && !original}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-3 py-1 transition-colors",
                view === v
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v === "original" ? `Original (${fileName})` : "Tailored"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="app-scrollbar max-h-[70vh] overflow-y-auto">
        <Sheet r={shown} />
      </CardContent>
    </Card>
  )
}
