// In-browser stand-in for the Express API, used while NEXT_PUBLIC_API_URL is unset.
// It keeps the same shapes and error codes as the real contract so the UI can be
// built and tested for every state (processing, failed, 404). State is persisted
// in localStorage so a refresh on a result page still finds its version.
import { ApiError } from "@/lib/api-error"
import type { Api } from "@/lib/api"
import type {
  AtsCheck,
  CoverLetter,
  CustomizationDetail,
  CustomizationResult,
  CustomizationStatus,
  CustomizationSummary,
  Scores,
  SectionKey,
  StructuredResume,
  Tone,
  UploadedResume,
} from "@/lib/types"

type Rec = {
  id: string
  resumeId: string
  jobDescription: string
  sections: SectionKey[]
  tone: Tone
  createdAt: number
  coverLetter: CoverLetter | null
}
type Db = { resumes: UploadedResume[]; customizations: Rec[] }

const KEY = "rc_mock_db"
const MAX_BYTES = 5 * 1024 * 1024
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uuid = () => crypto.randomUUID()

const ORIGINAL: StructuredResume = {
  name: "Jane Doe",
  headline: "Frontend Engineer",
  contact: ["jane@mail.com", "+91 98xxx xxxxx", "Bengaluru, India", "linkedin.com/in/janedoe"],
  summary:
    "Frontend developer with four years of experience building web applications with React and TypeScript.",
  skills: [
    { category: "Languages", items: ["JavaScript", "TypeScript", "HTML", "CSS"] },
    { category: "Frameworks", items: ["React", "Next.js", "Redux", "Tailwind CSS"] },
    { category: "Tools", items: ["Git", "Jest", "Webpack", "Figma"] },
  ],
  experience: [
    {
      title: "Frontend Engineer",
      company: "Acme",
      location: "Bengaluru",
      period: "2022 - now",
      bullets: [
        "Built dashboards in React used by 12,000 customers.",
        "Wrote REST endpoints for the reporting service.",
        "Cut bundle size by 38% by splitting routes and lazy loading.",
      ],
    },
    {
      title: "Web Developer",
      company: "Initech",
      location: "Pune",
      period: "2020 - 2022",
      bullets: [
        "Maintained the marketing site and landing pages.",
        "Added unit tests with Jest, reaching 70% coverage.",
      ],
    },
  ],
  projects: [
    {
      name: "Budget Tracker",
      tech: "Next.js, PostgreSQL",
      bullets: ["Personal finance app with charts and CSV import."],
    },
  ],
  education: [
    { degree: "B.Tech, Computer Science", institution: "VIT", period: "2016 - 2020", details: "" },
  ],
  certifications: [],
  additional: [],
}

const SAMPLE_PREVIEW =
  "Jane Doe\nFrontend Engineer\njane@mail.com | +91 98xxx xxxxx\n\nSummary\nFrontend developer with four years of experience building web applications with React and TypeScript."

const SEED_JD = (role: string, company: string) =>
  `${role} at ${company}\n\nWe are hiring a ${role} to build fast, accessible interfaces. You will work with React, TypeScript, Next.js and RESTful APIs, own components end to end, and collaborate with design and backend teams. Requirements: 3+ years of frontend experience, strong TypeScript, testing with Jest, performance tuning. Nice to have: GraphQL, Docker, CI/CD.`

function seed(): Db {
  const resume: UploadedResume = {
    id: uuid(),
    fileName: "resume.pdf",
    fileSize: 184_320,
    mimeType: "application/pdf",
    charCount: 3420,
    preview: SAMPLE_PREVIEW,
  }
  const day = 86_400_000
  const mk = (role: string, company: string, ago: number, jd = SEED_JD(role, company)): Rec => ({
    id: uuid(),
    resumeId: resume.id,
    jobDescription: jd,
    sections: ["summary", "skills", "experience"],
    tone: "professional",
    createdAt: Date.now() - ago,
    coverLetter: null,
  })
  return {
    resumes: [resume],
    customizations: [
      mk("Frontend Engineer", "Acme", day),
      mk("Full Stack Developer", "Globex", 2 * day),
      mk("Backend Engineer", "Umbrella", 3 * day, SEED_JD("Backend Engineer", "Umbrella") + " [fail]"),
    ],
  }
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {}
  const db = seed()
  save(db)
  return db
}

function save(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {}
}

// Status is derived from age, so polling shows live progress without timers.
function statusOf(rec: Rec): CustomizationStatus {
  const t = (Date.now() - rec.createdAt) / 1000
  const willFail = rec.jobDescription.includes("[fail]")
  if (t < 1.5) return "queued"
  if (t < 3.5) return "analyzing"
  if (t < 6) return "tailoring"
  if (willFail && t >= 6) return "failed"
  if (t < 8) return "scoring"
  return "completed"
}

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function parseRole(jd: string) {
  const first = jd.split("\n")[0].trim().slice(0, 80)
  const m = /^(.+?)\s+at\s+(.+)$/i.exec(first)
  return m ? { role: m[1], company: m[2] } : { role: first || "Untitled role", company: "" }
}

function buildScores(rec: Rec): Scores {
  const h = hash(rec.id)
  const before = 35 + (h % 15)
  const after = Math.min(95, before + 28 + (h % 12))
  const matched = ["React", "TypeScript", "Next.js", "Jest", "REST", "Tailwind CSS"]
  const missing = ["GraphQL", "Docker", "CI/CD"]
  const checks: AtsCheck[] = [
    { id: "keywords", label: "JD keyword coverage", points: 35, earned: Math.round((35 * Math.min(after, 80)) / 80), passed: after >= 80, tip: "Add the missing keywords you genuinely have experience with." },
    { id: "summary", label: "Professional summary", points: 10, earned: 10, passed: true, tip: "" },
    { id: "skills", label: "Skills section", points: 10, earned: 10, passed: true, tip: "" },
    { id: "experience", label: "Experience or projects present", points: 10, earned: 10, passed: true, tip: "" },
    { id: "quantified", label: "Quantified achievements", points: 10, earned: 0, passed: false, tip: "Add numbers (users, percentages, time saved) to at least 30% of bullets." },
    { id: "email", label: "Email in header", points: 8, earned: 8, passed: true, tip: "" },
    { id: "concise", label: "Concise bullets", points: 7, earned: 7, passed: true, tip: "" },
    { id: "phone", label: "Phone in header", points: 5, earned: 5, passed: true, tip: "" },
    { id: "education", label: "Education section", points: 5, earned: 5, passed: true, tip: "" },
  ]
  return {
    matchBefore: before,
    matchAfter: after,
    ats: { score: checks.reduce((s, c) => s + c.earned, 0), checks },
    keywords: { matched, missing },
  }
}

function buildResult(rec: Rec): CustomizationResult {
  const on = new Set(rec.sections)
  const resume: StructuredResume = {
    ...ORIGINAL,
    summary: on.has("summary")
      ? "Frontend Engineer with four years of experience shipping React, TypeScript and Next.js applications. Cut bundle size by 38% and built dashboards used by 12,000 customers."
      : ORIGINAL.summary,
    skills: on.has("skills")
      ? [
          { category: "Frameworks", items: ["React", "Next.js", "Tailwind CSS", "Redux"] },
          { category: "Languages", items: ["TypeScript", "JavaScript", "HTML", "CSS", "Node.js"] },
          { category: "Tools", items: ["Jest", "Git", "Webpack", "Figma"] },
        ]
      : ORIGINAL.skills,
    experience: on.has("experience")
      ? ORIGINAL.experience.map((e, i) =>
          i === 0
            ? {
                ...e,
                bullets: [
                  "Cut bundle size by 38% by splitting routes and lazy loading in a Next.js app.",
                  "Built React dashboards used by 12,000 customers.",
                  "Designed RESTful APIs for the reporting service.",
                ],
              }
            : e
        )
      : ORIGINAL.experience,
  }
  return {
    resume,
    changes: [
      { section: "summary", description: "Opened with the target role and moved the 38% bundle result up: the JD stresses performance." },
      { section: "skills", description: "Moved React, Next.js and TypeScript to the front: they are must-haves in the JD." },
      { section: "experience", description: "Reordered the Acme bullets so performance work comes first." },
      { section: "experience", description: "Reworded 'REST endpoints' to 'RESTful APIs' to match the JD's wording." },
    ],
    missingKeywords: [
      { keyword: "GraphQL", suggestion: "If you have used GraphQL, mention it in the Acme reporting-service bullet." },
      { keyword: "Docker", suggestion: "Add Docker under Tools only if you have shipped containerised builds." },
      { keyword: "CI/CD", suggestion: "Mention pipelines you configured, if any." },
    ],
    unverifiedSkills: on.has("skills") ? ["Node.js"] : [],
  }
}

function summaryOf(rec: Rec, db: Db): CustomizationSummary {
  const status = statusOf(rec)
  const done = status === "completed"
  const scores = done ? buildScores(rec) : null
  const { role, company } = parseRole(rec.jobDescription)
  return {
    id: rec.id,
    status,
    role,
    company,
    fileName: db.resumes.find((r) => r.id === rec.resumeId)?.fileName ?? "resume.pdf",
    createdAt: new Date(rec.createdAt).toISOString(),
    matchBefore: scores?.matchBefore ?? null,
    matchAfter: scores?.matchAfter ?? null,
    atsScore: scores?.ats.score ?? null,
  }
}

function find(db: Db, id: string) {
  const rec = db.customizations.find((c) => c.id === id)
  if (!rec) throw new ApiError(404, "NOT_FOUND", "Customization not found.")
  return rec
}

function resumeText(r: StructuredResume) {
  const lines = [r.name, r.headline, r.contact.join(" | "), "", "SUMMARY", r.summary, ""]
  lines.push("SKILLS", ...r.skills.map((s) => `${s.category}: ${s.items.join(", ")}`), "")
  lines.push("EXPERIENCE")
  for (const e of r.experience) {
    lines.push(`${e.title}, ${e.company} (${e.period})`, ...e.bullets.map((b) => `- ${b}`), "")
  }
  lines.push("PROJECTS")
  for (const p of r.projects) lines.push(`${p.name} (${p.tech})`, ...p.bullets.map((b) => `- ${b}`))
  lines.push("", "EDUCATION", ...r.education.map((e) => `${e.degree}, ${e.institution} (${e.period})`))
  return lines.join("\n")
}

export const mockApi: Api = {
  async uploadResume(file) {
    await sleep(900)
    if (!/\.(pdf|docx)$/i.test(file.name))
      throw new ApiError(415, "INVALID_FILE_TYPE", "Only PDF and DOCX files are supported.")
    if (file.size > MAX_BYTES) throw new ApiError(413, "FILE_TOO_LARGE", "File is larger than 5 MB.")
    if (file.size < 1024)
      throw new ApiError(422, "EMPTY_RESUME", "Too little text found. If this is a scanned PDF, upload a text-based PDF or DOCX.")
    const db = load()
    const resume: UploadedResume = {
      id: uuid(),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      charCount: Math.min(30_000, Math.round(file.size / 50)),
      preview: SAMPLE_PREVIEW,
    }
    db.resumes.push(resume)
    save(db)
    return resume
  },

  async createCustomization(b) {
    await sleep(400)
    const db = load()
    if (!db.resumes.some((r) => r.id === b.resumeId))
      throw new ApiError(404, "NOT_FOUND", "Resume not found.")
    const rec: Rec = {
      id: uuid(),
      resumeId: b.resumeId,
      jobDescription: b.jobDescription,
      sections: b.sections,
      tone: b.tone,
      createdAt: Date.now(),
      coverLetter: null,
    }
    db.customizations.push(rec)
    save(db)
    return { id: rec.id }
  },

  async getCustomization(id) {
    await sleep(150)
    const db = load()
    const rec = find(db, id)
    const status = statusOf(rec)
    const done = status === "completed"
    return {
      id: rec.id,
      status,
      error: status === "failed" ? "AI service is at capacity. Try again in a minute." : null,
      sections: rec.sections,
      tone: rec.tone,
      createdAt: new Date(rec.createdAt).toISOString(),
      resume: db.resumes.find((r) => r.id === rec.resumeId)!,
      jobDescription: { content: rec.jobDescription, requirements: null },
      original: ORIGINAL,
      result: done ? buildResult(rec) : null,
      scores: done ? buildScores(rec) : null,
      coverLetter: rec.coverLetter,
    } satisfies CustomizationDetail
  },

  async listCustomizations() {
    await sleep(200)
    const db = load()
    return db.customizations
      .map((c) => summaryOf(c, db))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
  },

  async generateCoverLetter(id, tone) {
    await sleep(1500)
    const db = load()
    const rec = find(db, id)
    if (statusOf(rec) !== "completed")
      throw new ApiError(409, "NOT_READY", "The tailored resume isn't ready yet.")
    const { role, company } = parseRole(rec.jobDescription)
    const letter: CoverLetter = {
      id: uuid(),
      tone,
      createdAt: new Date().toISOString(),
      content: `Dear Hiring Manager,\n\nI am applying for the ${role} role at ${company || "your team"}. Over four years I have built React and TypeScript applications, and I am drawn to the performance focus in your posting.\n\nAt Acme I cut bundle size by 38% through route splitting and lazy loading, and built dashboards used by 12,000 customers.\n\nI would welcome the chance to discuss how this experience fits your team.\n\nSincerely,\nJane Doe`,
    }
    rec.coverLetter = letter
    save(db)
    return letter
  },

  async exportResume(id, format) {
    await sleep(600)
    const db = load()
    const rec = find(db, id)
    if (statusOf(rec) !== "completed")
      throw new ApiError(409, "NOT_READY", "The tailored resume isn't ready yet.")
    const type = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    }[format]
    // placeholder bytes: the real server renders actual PDF/DOCX files
    return {
      blob: new Blob([resumeText(buildResult(rec).resume)], { type }),
      fileName: `jane-doe-${parseRole(rec.jobDescription).role.toLowerCase().replace(/\W+/g, "-")}.${format}`,
    }
  },
}
