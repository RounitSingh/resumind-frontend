"use client"

import * as React from "react"
import Link from "next/link"
import { SparklesIcon } from "lucide-react"

import { AuthSidePanel } from "@/components/auth-side-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api"
import { routes } from "@/lib/routes"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email, password) // AuthProvider then redirects home
    } catch (err) {
      setError(getErrorMessage(err))
      setPending(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/60 p-0 shadow-xl shadow-black/10">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="flex flex-col justify-center px-6 py-8 sm:px-10"
            onSubmit={onSubmit}
          >
            <FieldGroup className="gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <SparklesIcon className="size-4" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Log in to tailor your resume
                </p>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="m@example.com"
                  className="h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Button
                type="submit"
                className="mt-1 h-10 w-full"
                disabled={pending}
              >
                {pending && <Spinner />}
                Log in
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={routes.signup}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </FieldGroup>
          </form>
          <AuthSidePanel alt="Resume Tailor" />
        </CardContent>
      </Card>
    </div>
  )
}
