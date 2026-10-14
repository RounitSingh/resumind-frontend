"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// next-themes@0.4.6 renders an inline <script> that React 19 warns about on the
// client. The script still runs from the server HTML, so the warning is harmless;
// drop just that message in development until next-themes ships a fix.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return
    }
    originalError(...args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
