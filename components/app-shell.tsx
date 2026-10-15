"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { isAuthRoute } from "@/components/auth-gate"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Login / sign up are full-page, without the sidebar.
  if (isAuthRoute(pathname)) return <>{children}</>

  // The New page fits the screen (lg+): the whole frame is exactly one screen tall and the page
  // fills what is left under the header, so nothing can overflow. Other pages scroll as usual.
  const fitScreen = pathname === routes.home

  return (
    <SidebarProvider className={cn(fitScreen && "lg:h-svh lg:overflow-hidden")}>
      {/* usePathname() in the shell must sit inside Suspense */}
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className={cn(fitScreen && "lg:min-h-0")}>
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
