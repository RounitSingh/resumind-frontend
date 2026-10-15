import axios, { type InternalAxiosRequestConfig } from "axios"

import {
  mapDetail,
  mapSummary,
  type ApiCustomizationDetail,
  type ApiCustomizationSummary,
} from "@/lib/adapters"
import type {
  CoverLetter,
  CreateCustomizationBody,
  CustomizationDetail,
  CustomizationSummary,
  ExportFormat,
  Page,
  ResumeSummary,
  Tone,
  UploadedResume,
} from "@/lib/types"
import { useAuthStore } from "@/store/auth-store"

// ===== errors =====
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>
  ) {
    super(message)
  }
}

export function getErrorMessage(e: unknown): string {
  return e instanceof Error && e.message
    ? e.message
    : "Something went wrong. Please try again."
}

// Turns anything axios throws into an ApiError.
async function toApiError(e: unknown): Promise<ApiError> {
  if (e instanceof ApiError) return e
  if (!axios.isAxiosError(e)) return new ApiError(0, "UNKNOWN", "Unexpected error")
  if (!e.response) {
    return new ApiError(
      0,
      "NETWORK_ERROR",
      "Can't reach the server. If it was idle, it may take ~30 s to wake up. Try again."
    )
  }
  let body = e.response.data
  if (body instanceof Blob) body = await body.text().then(JSON.parse).catch(() => null) // exports
  return new ApiError(
    e.response.status,
    body?.error?.code ?? "UNKNOWN",
    body?.error?.message ?? `Request failed (${e.response.status})`,
    body?.error?.details
  )
}

// ===== axios instance =====
// Base URL from .env (NEXT_PUBLIC_BASE_URL). No fallback: fail loudly if missing.
const baseURL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "")
if (!baseURL) throw new Error("NEXT_PUBLIC_BASE_URL is not set. Add it to .env (see .env.example).")

// withCredentials sends the httpOnly refresh cookie (the backend scopes it to /api/auth).
const create = () => axios.create({ baseURL, withCredentials: true })

// No interceptors: used for /api/auth/*, so a failed refresh can't loop.
const authClient = create()
const http = create()

// Request: attach the access token.
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: on 401 refresh the token once and replay the request; if that fails the session
// is over. Every other failure becomes an ApiError.
http.interceptors.response.use(undefined, async (error) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined
  if (error.response?.status === 401 && original && !original._retried) {
    original._retried = true
    const token = await useAuthStore.getState().refresh()
    if (token) {
      original.headers.Authorization = `Bearer ${token}`
      return http(original)
    }
    useAuthStore.getState().expire()
  }
  throw await toApiError(error)
})

// ===== auth =====
export type AuthUser = {
  id: string
  email: string
  role: "user" | "admin"
  createdAt: string
}
export type AuthResponse = { user: AuthUser; accessToken: string }

async function authCall(path: string, body?: unknown) {
  try {
    return (await authClient.post<AuthResponse>(`/api/auth${path}`, body)).data
  } catch (e) {
    throw await toApiError(e)
  }
}

export const authApi = {
  login: (email: string, password: string) => authCall("/login", { email, password }),
  register: (email: string, password: string) => authCall("/register", { email, password }),
  // exchanges the refresh cookie for a new access token
  refresh: () => authCall("/refresh"),
  logout: () => authCall("/logout"),
}

// ===== services =====
// Components don't call these directly: they use the React Query hooks in hooks/use-api.ts.
type PageQuery = { offset?: number; limit?: number }

export const api = {
  uploadResume: (file: File) => {
    const fd = new FormData()
    fd.append("file", file) // axios lets the browser set the multipart boundary
    return http.post<UploadedResume>("/api/resumes", fd).then((r) => r.data)
  },
  listResumes: (params: PageQuery = {}) =>
    http.get<Page<ResumeSummary>>("/api/resumes", { params }).then((r) => r.data),
  getResume: (id: string) => http.get<ResumeSummary>(`/api/resumes/${id}`).then((r) => r.data),
  deleteResume: (id: string) => http.delete(`/api/resumes/${id}`).then(() => undefined),

  createCustomization: (body: CreateCustomizationBody) =>
    http.post<{ id: string }>("/api/customizations", body).then((r) => r.data),
  listCustomizations: (params: PageQuery & { resumeId?: string } = {}) =>
    http
      .get<Page<ApiCustomizationSummary>>("/api/customizations", { params })
      .then((r): Page<CustomizationSummary> => ({ ...r.data, items: r.data.items.map(mapSummary) })),
  getCustomization: (id: string): Promise<CustomizationDetail> =>
    http.get<ApiCustomizationDetail>(`/api/customizations/${id}`).then((r) => mapDetail(r.data)),
  // "Update resume": starts tailoring once the review is showing
  tailorCustomization: (id: string) =>
    http.post(`/api/customizations/${id}/tailor`).then(() => undefined),
  generateCoverLetter: (id: string, tone: Tone) =>
    http.post<CoverLetter>(`/api/customizations/${id}/cover-letter`, { tone }).then((r) => r.data),
  exportResume: (id: string, format: ExportFormat) =>
    http
      .get<Blob>(`/api/customizations/${id}/export`, { params: { format }, responseType: "blob" })
      .then((r) => ({
        blob: r.data,
        fileName:
          /filename="(.+?)"/.exec(String(r.headers["content-disposition"] ?? ""))?.[1] ??
          `resume.${format}`,
      })),
}
