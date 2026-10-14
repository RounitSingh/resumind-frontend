// Mirrors the backend DTOs (see the architecture guide, "API contract").

export const SECTION_KEYS = ["summary", "skills", "experience", "projects"] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

export const TONES = ["professional", "confident", "concise"] as const
export type Tone = (typeof TONES)[number]

export const EXPORT_FORMATS = ["pdf", "docx", "txt"] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export type CustomizationStatus =
  | "queued"
  | "analyzing"
  | "tailoring"
  | "scoring"
  | "completed"
  | "failed"

export type StructuredResume = {
  name: string
  headline: string
  contact: string[]
  summary: string
  skills: { category: string; items: string[] }[]
  experience: {
    title: string
    company: string
    location: string
    period: string
    bullets: string[]
  }[]
  projects: { name: string; tech: string; bullets: string[] }[]
  education: {
    degree: string
    institution: string
    period: string
    details: string
  }[]
  certifications: string[]
  additional: { title: string; items: string[] }[]
}

export type JdRequirements = {
  role: string
  company: string
  seniority: string
  mustHaveSkills: string[]
  niceToHaveSkills: string[]
  keywords: string[]
  responsibilities: string[]
}

export type CustomizationResult = {
  resume: StructuredResume
  changes: { section: string; description: string }[]
  missingKeywords: { keyword: string; suggestion: string }[]
  unverifiedSkills: string[]
}

export type AtsCheck = {
  id: string
  label: string
  points: number
  earned: number
  passed: boolean
  tip: string
}

export type Scores = {
  matchBefore: number
  matchAfter: number
  ats: { score: number; checks: AtsCheck[] }
  keywords: { matched: string[]; missing: string[] }
}

export type UploadedResume = {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  charCount: number
  preview: string
}

export type CoverLetter = {
  id: string
  tone: Tone
  content: string
  createdAt: string
}

export type CreateCustomizationBody = {
  resumeId: string
  jobDescription: string
  sections: SectionKey[]
  tone: Tone
}

export type CustomizationSummary = {
  id: string
  status: CustomizationStatus
  role: string
  company: string
  fileName: string
  createdAt: string
  matchBefore: number | null
  matchAfter: number | null
  atsScore: number | null
}

export type CustomizationDetail = {
  id: string
  status: CustomizationStatus
  error: string | null
  sections: SectionKey[]
  tone: Tone
  createdAt: string
  resume: UploadedResume
  jobDescription: { content: string; requirements: JdRequirements | null }
  original: StructuredResume | null
  result: CustomizationResult | null
  scores: Scores | null
  coverLetter: CoverLetter | null
}
