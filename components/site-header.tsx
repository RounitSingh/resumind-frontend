"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { routes } from "@/lib/routes"

type Crumb = { label: string; href?: string }

function crumbsFor(pathname: string): Crumb[] {
  if (pathname.startsWith("/customizations/")) {
    return [{ label: "History", href: routes.history }, { label: "Tailored resume" }]
  }
  if (pathname.startsWith(`${routes.resumes}/`)) {
    return [{ label: "Resumes", href: routes.resumes }, { label: "History" }]
  }
  if (pathname.startsWith(routes.resumes)) return [{ label: "Resumes" }]
  if (pathname.startsWith(routes.history)) return [{ label: "History" }]
  if (pathname === routes.home) return [{ label: "New" }]
  return [{ label: "TestLab" }]
}

export function SiteHeader() {
  const crumbs = crumbsFor(usePathname())

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => (
              <span key={c.label} className="contents">
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {c.href ? (
                    <BreadcrumbLink render={<Link href={c.href} />}>
                      {c.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
