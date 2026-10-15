"use client"

import { useState } from "react"
import { ClipboardPasteIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { validateJd } from "@/lib/validation"
import { useWorkspaceStore } from "@/store/workspace-store"

const MAX = 20_000

const SAMPLE_JD = `Frontend Engineer at Acme

We are looking for a Frontend Engineer to build fast, accessible web interfaces for thousands of customers.

Responsibilities
- Build and maintain features in React, TypeScript and Next.js
- Work with designers and backend engineers to ship RESTful API integrations
- Improve performance, accessibility and test coverage

Requirements
- 3+ years of frontend experience
- Strong TypeScript and React skills
- Experience with Jest or similar testing tools

Nice to have
- GraphQL, Docker, CI/CD pipelines`

export function JdInput() {
  const value = useWorkspaceStore((s) => s.jd)
  const onChange = useWorkspaceStore((s) => s.setJd)
  const error = validateJd(value)
  // show the error only after the user has left the box once
  const [touched, setTouched] = useState(false)
  const [pasteFailed, setPasteFailed] = useState(false)
  const showError = touched && error

  async function paste() {
    try {
      onChange((await navigator.clipboard.readText()).slice(0, MAX))
      setPasteFailed(false)
    } catch {
      setPasteFailed(true)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={paste}>
          <ClipboardPasteIcon /> Paste from clipboard
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(SAMPLE_JD)
            setPasteFailed(false)
          }}
        >
          <SparklesIcon /> Try a sample
        </Button>
      </div>

      <Textarea
        aria-label="Job description"
        aria-invalid={showError ? true : undefined}
        className="min-h-72 flex-1 resize-none overflow-y-auto no-scrollbar field-sizing-fixed lg:min-h-0"
        placeholder={
          "Paste the full job posting here: the role, what they require and any nice-to-haves."
        }
        value={value}
        maxLength={MAX}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
      />

      <div className="flex items-start justify-between gap-4 text-xs">
        <p
          className={cn(
            "text-muted-foreground",
            (showError || pasteFailed) && "text-destructive"
          )}
          role={showError ? "alert" : undefined}
        >
          {pasteFailed
            ? "Couldn't read your clipboard. Paste with Ctrl+V instead."
            : showError
              ? error
              : "Tip: the more of the posting you include, the better the match."}
        </p>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {value.length.toLocaleString()} / {MAX.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
