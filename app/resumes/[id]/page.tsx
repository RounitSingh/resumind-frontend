import { Suspense } from "react"
import type { Metadata } from "next"

import { ResumeHistory } from "@/components/resumes/resume-history"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Resume history" }

// params is a Promise; reading it must happen inside a Suspense boundary
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResumeHistory id={id} />
}

export default function ResumeHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pt-0 md:px-8 md:pb-10">
      <Suspense fallback={<Skeleton className="h-24 rounded-xl" />}>
        <Content params={params} />
      </Suspense>
    </div>
  )
}
