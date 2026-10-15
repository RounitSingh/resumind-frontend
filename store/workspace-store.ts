import { create } from "zustand"

import type { UploadedResume } from "@/lib/types"

// The "New" form, shared by the job description box, the resume picker/dropzone and the submit
// button so none of them pass props to each other.
type WorkspaceState = {
  jd: string
  resume: UploadedResume | null
  // Bumped by reset(). The page is keyed on it, so everything local to the page (the job being
  // analysed, errors) is thrown away together with the form.
  session: number
  setJd: (jd: string) => void
  setResume: (resume: UploadedResume | null) => void
  // Empty the form only.
  clear: () => void
  // Start over: empty form and a brand-new page.
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  jd: "",
  resume: null,
  session: 0,
  setJd: (jd) => set({ jd }),
  setResume: (resume) => set({ resume }),
  clear: () => set({ jd: "", resume: null }),
  reset: () => set((s) => ({ jd: "", resume: null, session: s.session + 1 })),
}))
