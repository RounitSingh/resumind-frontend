import { Suspense } from "react"
import type { Metadata } from "next"

import { CustomizationView } from "@/components/result/customization-view"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Tailored resume" }

// params is a Promise; reading it must happen inside a Suspense boundary
async function ResultContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomizationView id={id} />
}

export default function CustomizationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pt-0 md:px-8 md:pb-10">
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ResultContent params={params} />
      </Suspense>
    </div>
  )
}
