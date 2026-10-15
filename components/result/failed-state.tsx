import Link from "next/link"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export function FailedState({
  id,
  message,
}: {
  id: string
  message: string | null
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-8">
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Tailoring didn&apos;t finish</AlertTitle>
        <AlertDescription>
          {message ?? "Something went wrong. Please try again."}
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Link href={routes.retry(id)} className={buttonVariants()}>
          Try again
        </Link>
        <Link href={routes.history} className={buttonVariants({ variant: "outline" })}>
          Go to history
        </Link>
      </div>
    </div>
  )
}
