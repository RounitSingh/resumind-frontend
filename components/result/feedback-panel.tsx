import { diffWords } from "diff"
import {
  BriefcaseIcon,
  CheckCircle2Icon,
  CircleXIcon,
  FileTextIcon,
  FolderIcon,
  KeyRoundIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  CustomizationResult,
  Scores,
  SectionKey,
  StructuredResume,
} from "@/lib/types"

const SECTION_META: Record<
  string,
  { title: string; icon: typeof FileTextIcon }
> = {
  summary: { title: "Summary", icon: FileTextIcon },
  skills: { title: "Skills", icon: WrenchIcon },
  experience: { title: "Experience", icon: BriefcaseIcon },
  projects: { title: "Projects", icon: FolderIcon },
}

const flatSkills = (r: StructuredResume) => r.skills.flatMap((s) => s.items)

const SECTION_TINT: Record<string, string> = {
  summary: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  skills: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  experience: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  projects: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

function SummaryDiff({ before, after }: { before: string; after: string }) {
  return (
    <p className="rounded-xl border bg-background p-4 text-[15px] leading-8 text-foreground/80">
      {diffWords(before, after).map((part, i) =>
        part.added ? (
          <mark
            key={i}
            className="rounded-md bg-amber-400/25 px-1 py-0.5 font-medium text-amber-900 dark:bg-amber-400/20 dark:text-amber-200"
          >
            {part.value}
          </mark>
        ) : part.removed ? (
          <del
            key={i}
            className="mx-0.5 rounded-sm bg-red-500/10 px-1 text-red-700 decoration-red-600 decoration-2 dark:text-red-300 dark:decoration-red-400"
          >
            {part.value}
          </del>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </p>
  )
}

function SkillsDiff({
  original,
  tailored,
}: {
  original: StructuredResume
  tailored: StructuredResume
}) {
  const before = new Set(flatSkills(original).map((s) => s.toLowerCase()))
  const after = new Set(flatSkills(tailored).map((s) => s.toLowerCase()))
  const added = flatSkills(tailored).filter((s) => !before.has(s.toLowerCase()))
  const removed = flatSkills(original).filter((s) => !after.has(s.toLowerCase()))
  if (!added.length && !removed.length) return null
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-4">
      {added.map((s) => (
        <Badge
          key={"a" + s}
          className="h-6 gap-1 bg-amber-400/25 px-2.5 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200"
        >
          <PlusIcon className="size-3" />
          {s}
        </Badge>
      ))}
      {removed.map((s) => (
        <Badge
          key={"r" + s}
          className="h-6 gap-1 bg-red-500/10 px-2.5 text-red-700 line-through decoration-red-600 decoration-2 dark:text-red-300 dark:decoration-red-400"
        >
          <MinusIcon className="size-3" />
          {s}
        </Badge>
      ))}
    </div>
  )
}

function SectionCard({
  sectionKey,
  descriptions,
  original,
  tailored,
}: {
  sectionKey: string
  descriptions: string[]
  original: StructuredResume | null
  tailored: StructuredResume
}) {
  const meta = SECTION_META[sectionKey] ?? { title: sectionKey, icon: SparklesIcon }
  const tint = SECTION_TINT[sectionKey] ?? "bg-primary/10 text-primary"
  const Icon = meta.icon
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex items-center gap-3 px-5 py-4">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tint}`}
        >
          <Icon className="size-4" />
        </span>
        <CardTitle className="text-base capitalize">{meta.title}</CardTitle>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {descriptions.length}{" "}
          {descriptions.length === 1 ? "change" : "changes"}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 border-t px-5 py-5">
        {sectionKey === "summary" && original && (
          <SummaryDiff before={original.summary} after={tailored.summary} />
        )}
        {sectionKey === "skills" && original && (
          <SkillsDiff original={original} tailored={tailored} />
        )}
        <ul className="flex flex-col gap-2.5 text-sm">
          {descriptions.map((d) => (
            <li key={d} className="flex items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
              <span className="leading-relaxed text-muted-foreground">{d}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function ChangesPanel({
  result,
  original,
  sections,
}: {
  result: CustomizationResult
  original: StructuredResume | null
  sections: SectionKey[]
}) {
  // group the AI's change log by section, keeping the resume's own order
  const order = ["summary", "skills", "experience", "projects"]
  const grouped = new Map<string, string[]>()
  for (const c of result.changes) {
    const key = c.section.toLowerCase()
    grouped.set(key, [...(grouped.get(key) ?? []), c.description])
  }
  const keys = [
    ...order.filter((k) => grouped.has(k)),
    ...[...grouped.keys()].filter((k) => !order.includes(k)),
  ]
  const untouched = order.filter((k) => !sections.includes(k as SectionKey))
  const total = result.changes.length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300">
            <SparklesIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">What the AI changed</h2>
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "edit" : "edits"} across {keys.length}{" "}
              {keys.length === 1 ? "section" : "sections"}, tailored to this job.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-amber-400/25 px-1.5 py-0.5 font-medium text-amber-900 dark:text-amber-200">
              Changed
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-medium text-red-700 line-through decoration-red-600 decoration-2 dark:text-red-300">
              Removed
            </span>
          </span>
        </div>
      </div>

      {keys.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No changes were needed. Your resume already fits this job well.
        </p>
      )}

      {keys.map((k) => (
        <SectionCard
          key={k}
          sectionKey={k}
          descriptions={grouped.get(k) ?? []}
          original={original}
          tailored={result.resume}
        />
      ))}

      {untouched.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2Icon className="size-3.5" />
          Left as you wrote them:
          {untouched.map((u) => (
            <Badge key={u} variant="outline" className="capitalize">
              {u}
            </Badge>
          ))}
        </p>
      )}
    </div>
  )
}

export function KeywordsPanel({
  result,
  scores,
}: {
  result: CustomizationResult
  scores: Scores
}) {
  const failedChecks = scores.ats.checks.filter((c) => !c.passed)

  return (
    <div className="flex flex-col gap-4">
      {result.unverifiedSkills.length > 0 && (
        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Please check these skills</AlertTitle>
          <AlertDescription>
            <p>
              They aren&apos;t spelled this way in your original resume. Keep
              them only if they&apos;re true:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.unverifiedSkills.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {result.missingKeywords.length > 0 && (
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="flex items-center gap-3 px-5 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300">
              <KeyRoundIcon className="size-4" />
            </span>
            <div className="flex flex-col">
              <CardTitle className="text-base">Keywords to add</CardTitle>
              <p className="text-xs text-muted-foreground">
                Only add these if they&apos;re true for you.
              </p>
            </div>
            <span className="ml-auto text-xs font-medium text-muted-foreground">
              {result.missingKeywords.length}{" "}
              {result.missingKeywords.length === 1 ? "keyword" : "keywords"}
            </span>
          </CardHeader>
          <CardContent className="border-t p-0">
            <ul className="divide-y text-sm">
              {result.missingKeywords.map((m) => (
                <li
                  key={m.keyword}
                  className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-start sm:gap-5"
                >
                  <span className="w-fit shrink-0 rounded-md border border-amber-500/60 px-2.5 py-1 text-xs font-medium text-amber-700 sm:mt-0.5 sm:w-28 sm:text-center dark:border-amber-400/50 dark:text-amber-300">
                    {m.keyword}
                  </span>
                  <p className="leading-relaxed text-muted-foreground">
                    {m.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4 text-muted-foreground" />
            ATS checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm">
            {scores.ats.checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                {c.passed ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                ) : (
                  <CircleXIcon className="mt-0.5 size-4 shrink-0 text-red-500" />
                )}
                <div>
                  <span>{c.label}</span>
                  {!c.passed && c.tip && (
                    <p className="text-xs text-muted-foreground">{c.tip}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {failedChecks.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Every check passed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
