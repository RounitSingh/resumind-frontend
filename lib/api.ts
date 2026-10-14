import { getClientId } from "@/lib/client-id"
import { ApiError, getErrorMessage } from "@/lib/api-error"
import { mockApi } from "@/lib/mock-api"
import type {
  CoverLetter,
  CreateCustomizationBody,
  CustomizationDetail,
  CustomizationSummary,
  ExportFormat,
  Tone,
  UploadedResume,
} from "@/lib/types"

export { ApiError, getErrorMessage }

export type Api = {
  uploadResume: (file: File) => Promise<UploadedResume>
  createCustomization: (b: CreateCustomizationBody) => Promise<{ id: string }>
  getCustomization: (id: string) => Promise<CustomizationDetail>
  listCustomizations: () => Promise<CustomizationSummary[]>
  generateCoverLetter: (id: string, tone: Tone) => Promise<CoverLetter>
  exportResume: (
    id: string,
    format: ExportFormat
  ) => Promise<{ blob: Blob; fileName: string }>
}

// No NEXT_PUBLIC_API_URL means the backend isn't wired yet: use the in-browser mock.
const API_URL = process.env.NEXT_PUBLIC_API_URL

async function send(path: string, init: RequestInit = {}) {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "X-Client-Id": getClientId(), ...init.headers },
    })
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Can't reach the server. If it was idle, it may take ~30 s to wake up. Try again."
    )
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? `Request failed (${res.status})`,
      body?.error?.details
    )
  }
  return res
}

const json = <T>(path: string, init?: RequestInit) =>
  send(path, init).then((r) => r.json() as Promise<T>)

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

const realApi: Api = {
  uploadResume: (file) => {
    const fd = new FormData()
    fd.append("file", file)
    // no Content-Type: the browser sets the multipart boundary
    return json<UploadedResume>("/api/resumes", { method: "POST", body: fd })
  },
  createCustomization: (b) => json<{ id: string }>("/api/customizations", post(b)),
  getCustomization: (id) =>
    json<CustomizationDetail>(`/api/customizations/${id}`),
  listCustomizations: () => json<CustomizationSummary[]>("/api/customizations"),
  generateCoverLetter: (id, tone) =>
    json<CoverLetter>(`/api/customizations/${id}/cover-letter`, post({ tone })),
  exportResume: async (id, format) => {
    const res = await send(`/api/customizations/${id}/export?format=${format}`)
    const name =
      /filename="(.+?)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ??
      `resume.${format}`
    return { blob: await res.blob(), fileName: name }
  },
}

export const api: Api = API_URL ? realApi : mockApi
