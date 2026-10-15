"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"

import { api, isApiError } from "@/lib/api"
import type { CustomizationDetail, ExportFormat, Page, Tone } from "@/lib/types"

const PAGE_SIZE = 24

// ===== query keys =====
export const keys = {
  resumes: ["resumes"] as const,
  resumeList: ["resumes", "list"] as const,
  recentResumes: (limit: number) => ["resumes", "recent", limit] as const,
  resume: (id: string) => ["resumes", "detail", id] as const,
  customizations: ["customizations"] as const,
  customizationList: (resumeId?: string) =>
    ["customizations", "list", resumeId ?? "all"] as const,
  customization: (id: string) => ["customizations", "detail", id] as const,
}

// "Load more" pagination: the next offset is however many items are already loaded.
const nextOffset = <T,>(last: Page<T>, all: Page<T>[]) => {
  const loaded = all.reduce((n, p) => n + p.items.length, 0)
  return loaded < last.total ? loaded : undefined
}
export const flatten = <T,>(data: InfiniteData<Page<T>> | undefined) =>
  data?.pages.flatMap((p) => p.items) ?? []

// ===== resumes =====
export const useResumes = () =>
  useInfiniteQuery({
    queryKey: keys.resumeList,
    queryFn: ({ pageParam }) => api.listResumes({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  })

export const useRecentResumes = (limit = 5) =>
  useQuery({ queryKey: keys.recentResumes(limit), queryFn: () => api.listResumes({ limit }) })

export const useResume = (id: string | null) =>
  useQuery({
    queryKey: keys.resume(id ?? ""),
    queryFn: () => api.getResume(id!),
    enabled: id !== null,
  })

export function useUploadResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.uploadResume,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.resumes }),
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteResume,
    // the resume's versions go with it
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: keys.resumes }),
        qc.invalidateQueries({ queryKey: keys.customizations }),
      ]),
  })
}

// ===== customizations =====
export const useCustomizations = (resumeId?: string) =>
  useInfiniteQuery({
    queryKey: keys.customizationList(resumeId),
    queryFn: ({ pageParam }) =>
      api.listCustomizations({ resumeId, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  })

// Polls every 1.5 s until the version reaches a resting state: review (waiting for the user to
// click "Update resume"), completed or failed.
const RESTING = new Set(["completed", "failed", "review"])

export const useCustomization = (id: string | null) =>
  useQuery({
    queryKey: keys.customization(id ?? ""),
    queryFn: () => api.getCustomization(id!),
    enabled: id !== null,
    staleTime: 0,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      return status && RESTING.has(status) ? false : 1500
    },
    // keep retrying network blips; anything else is a real answer (404, 500...)
    retry: (_n, e) => isApiError(e) && e.status === 0,
    retryDelay: 3000,
  })

export function useCreateCustomization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCustomization,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.customizations }),
  })
}

export function useTailorCustomization(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.tailorCustomization(id),
    onSuccess: async () => {
      // show "tailoring" at once (no flicker back to the review) and resume polling
      qc.setQueryData<CustomizationDetail>(keys.customization(id), (d) =>
        d ? { ...d, status: "tailoring", error: null } : d
      )
      await qc.invalidateQueries({ queryKey: keys.customizations })
    },
  })
}

export function useGenerateCoverLetter(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tone: Tone) => api.generateCoverLetter(id, tone),
    onSuccess: (letter) =>
      qc.setQueryData<CustomizationDetail>(keys.customization(id), (d) =>
        d ? { ...d, coverLetter: letter } : d
      ),
  })
}

export const useExportResume = (id: string) =>
  useMutation({ mutationFn: (format: ExportFormat) => api.exportResume(id, format) })
