import { Suspense } from "react"

import { Workspace } from "@/components/workspace/workspace"
import { WorkspaceSkeleton } from "@/components/workspace/workspace-skeleton"

// lg+: the app frame is one screen tall (see AppShell) and this fills the space under the header,
// so the page itself never scrolls; the resumes card scrolls inside instead.
export default function NewPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pt-0 md:px-8 md:pb-6 lg:min-h-0 lg:overflow-y-auto no-scrollbar">
      <section className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Tailor your resume to any job
        </h1>
        <p className="mt-2 text-muted-foreground">
          Paste a job posting, upload your resume, and get a version written
          for that role. Nothing gets invented.
        </p>
      </section>
      {/* useSearchParams (for ?from=) needs a Suspense boundary */}
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace />
      </Suspense>
    </div>
  )
}
