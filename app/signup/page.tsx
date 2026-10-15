import type { Metadata } from "next"
import { SignupForm } from "@/components/signup-form"

export const metadata: Metadata = { title: "Sign up" }

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}
