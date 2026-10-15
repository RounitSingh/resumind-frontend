// Maps the Express API's response shapes (see R-backend/src/types/dto.ts) onto the
// view models the UI renders. Keep all contract differences in this one file.
import type {
  AtsCheck,
  CoverLetter,
  CustomizationDetail,
  CustomizationResult,
  CustomizationStatus,
  CustomizationSummary,
  JdRequirements,
  ReviewResult,
  Scores,
  SectionKey,
  StructuredResume,
  Tone,
} from "@/lib/types"

type ApiResume = Omit<StructuredResume, "skills"> & { skills: string[] }

type ApiScores = {
  match: { before: number; after: number; matched: string[]; missing: string[] }
  ats: {
    score: number
    passed: number
    total: number
    checks: { name: string; points: number; earned: number; passed: boolean; tip?: string }[]
  }
}

type ApiResult = Omit<CustomizationResult, "resume"> & { resume: ApiResume }

export type ApiCustomizationDetail = {
  id: string
  status: CustomizationStatus
  error: string | null
  sections: SectionKey[]
  tone: Tone
  createdAt: string
  resume: { id: string; fileName: string; fileSize: number; mimeType: string }
  jobDescription: {
    role: string
    company: string
    experience: string
    content: string
    requirements: JdRequirements | null
  }
  original: ApiResume | null
  review: ReviewResult | null
  result: ApiResult | null
  scores: ApiScores | null
  coverLetter: CoverLetter | null
}

export type ApiCustomizationSummary = Omit<CustomizationSummary, "role" | "company"> & {
  role: string | null
  company: string | null
}

// The API stores skills as one flat list; the UI supports optional category groups.
const mapResume = (r: ApiResume): StructuredResume => ({
  ...r,
  skills: r.skills.length ? [{ category: "", items: r.skills }] : [],
})

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")

const mapScores = (s: ApiScores): Scores => ({
  matchBefore: s.match.before,
  matchAfter: s.match.after,
  ats: {
    score: s.ats.score,
    checks: s.ats.checks.map(
      (c): AtsCheck => ({
        id: slug(c.name),
        label: c.name,
        points: c.points,
        earned: c.earned,
        passed: c.passed,
        tip: c.tip ?? "",
      })
    ),
  },
  keywords: { matched: s.match.matched, missing: s.match.missing },
})

export const mapDetail = (d: ApiCustomizationDetail): CustomizationDetail => ({
  ...d,
  resume: { ...d.resume, charCount: 0, preview: "" },
  original: d.original && mapResume(d.original),
  result: d.result && { ...d.result, resume: mapResume(d.result.resume) },
  scores: d.scores && mapScores(d.scores),
})

export const mapSummary = (s: ApiCustomizationSummary): CustomizationSummary => ({
  ...s,
  role: s.role ?? "",
  company: s.company ?? "",
})
