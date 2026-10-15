import Link from "next/link"
import { FileQuestionIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export function NotFoundState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <FileQuestionIcon className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">This version doesn&apos;t exist</h1>
      <p className="text-muted-foreground">
        The link may be wrong, or it was created in a different browser.
      </p>
      <Link href={routes.home} className={buttonVariants({ className: "mt-3" })}>
        Tailor a resume
      </Link>
    </div>
  )
}
