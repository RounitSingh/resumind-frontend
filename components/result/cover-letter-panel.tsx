"use client"

import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGenerateCoverLetter } from "@/hooks/use-api"
import { getErrorMessage } from "@/lib/api"
import { TONES, type CoverLetter, type Tone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CopyButton } from "./copy-button"

export function CoverLetterPanel({
  id,
  initial,
  defaultTone,
}: {
  id: string
  initial: CoverLetter | null
  defaultTone: Tone
}) {
  const [tone, setTone] = useState<Tone>(initial?.tone ?? defaultTone)
  const generateLetter = useGenerateCoverLetter(id)
  // a new letter is written into the cached version, so `initial` already holds it
  const letter: CoverLetter | null = initial
  const busy = generateLetter.isPending
  const error = generateLetter.error ? getErrorMessage(generateLetter.error) : null

  const generate = () => generateLetter.mutate(tone)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex w-fit rounded-lg bg-muted p-0.5 text-xs"
          role="group"
          aria-label="Tone"
        >
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tone === t}
              onClick={() => setTone(t)}
              className={cn(
                "rounded-md px-3 py-1 capitalize transition-colors",
                tone === t
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Button onClick={generate} disabled={busy}>
          {busy ? "Writing…" : letter ? "Regenerate" : "Generate cover letter"}
        </Button>
        {letter && <CopyButton getText={() => letter.content} />}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t write the cover letter</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {letter ? (
        <Card>
          <CardHeader>
            <CardTitle>Cover letter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {letter.content}
            </p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pick a tone and generate a cover letter based on your tailored resume
          and this job description.
        </p>
      )}
    </div>
  )
}
