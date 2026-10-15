import type { Metadata } from "next"

import { HistoryList } from "@/components/history/history-list"

export const metadata: Metadata = { title: "History" }

export default function HistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 pt-0 md:px-8 md:pb-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Your tailored resumes
        </h1>
        <p className="mt-2 text-muted-foreground">
          Every version you&apos;ve made, newest first. Saved to your account.
        </p>
      </section>
      <HistoryList />
    </div>
  )
}
