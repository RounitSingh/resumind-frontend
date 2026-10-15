"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { routes } from "@/lib/routes"
import { useAuthStore } from "@/store/auth-store"

export const isAuthRoute = (pathname: string) =>
  pathname === routes.login || pathname === routes.signup

// Restores the session once, sends signed-out users to /login and signed-in users away from
// it, and never renders protected pages (or fires their API calls) without a session.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const status = useAuthStore((s) => s.status)
  const onAuthPage = isAuthRoute(usePathname())

  React.useEffect(() => {
    void useAuthStore.getState().restore()
  }, [])

  const authed = status === "authenticated"
  React.useEffect(() => {
    if (status === "loading") return
    if (!authed && !onAuthPage) router.replace(routes.login)
    if (authed && onAuthPage) router.replace(routes.home)
  }, [status, authed, onAuthPage, router])

  const blocked = status === "loading" || (!authed && !onAuthPage) || (authed && onAuthPage)
  if (blocked) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }
  return <>{children}</>
}
