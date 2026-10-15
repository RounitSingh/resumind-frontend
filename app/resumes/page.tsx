import type { Metadata } from "next"

import { ResumeList } from "@/components/resumes/resume-list"

export const metadata: Metadata = { title: "Resumes" }

export default function ResumesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pt-0 md:px-8 md:pb-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your resumes</h1>
        <p className="mt-2 text-muted-foreground">
          Every resume you&apos;ve uploaded, with the versions made from each one.
        </p>
      </section>
      <ResumeList />
    </div>
  )
}
