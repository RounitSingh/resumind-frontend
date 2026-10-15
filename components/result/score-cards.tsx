import { BadgeCheckIcon, KeyRoundIcon, TargetIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { Scores } from "@/lib/types"
import { cn } from "@/lib/utils"

// 75+ good, 50-74 fair, below 50 low. The number is always printed too.
function band(pct: number) {
  if (pct >= 75)
    return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }
  if (pct >= 50)
    return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" }
}

function ScoreCard({
  icon: Icon,
  label,
  value,
  unit,
  pct,
  note,
}: {
  icon: typeof TargetIcon
  label: string
  value: string | number
  unit?: string
  pct: number
  note: string
}) {
  const b = band(pct)
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-3xl font-semibold tabular-nums", b.text)}>
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full", b.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  )
}

// `current`: the resume hasn't been tailored yet, so there is no before/after to compare.
export function ScoreCards({ scores, current = false }: { scores: Scores; current?: boolean }) {
  const { matchBefore, matchAfter, ats, keywords } = scores
  const totalKw = keywords.matched.length + keywords.missing.length
  const passed = ats.checks.filter((c) => c.passed).length
  const delta = matchAfter - matchBefore

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ScoreCard
        icon={TargetIcon}
        label="Job match"
        value={matchAfter}
        unit="%"
        pct={matchAfter}
        note={
          current
            ? "Your resume today"
            : delta > 0
            ? `Up ${delta} points from ${matchBefore}% before`
            : `Was ${matchBefore}% before`
        }
      />
      <ScoreCard
        icon={BadgeCheckIcon}
        label="ATS score"
        value={ats.score}
        unit="/ 100"
        pct={ats.score}
        note={`${passed} of ${ats.checks.length} checks passed`}
      />
      <ScoreCard
        icon={KeyRoundIcon}
        label="Keywords matched"
        value={keywords.matched.length}
        unit={`of ${totalKw}`}
        pct={totalKw ? (keywords.matched.length / totalKw) * 100 : 0}
        note={
          keywords.missing.length
            ? `${keywords.missing.length} still missing`
            : "Every keyword is covered"
        }
      />
    </div>
  )
}
