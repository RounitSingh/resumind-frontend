import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // A 4xx will not change on retry; only retry network / server hiccups, once.
      retry: (count, error) =>
        count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

// Every failed request is an ApiError (see lib/http.ts), so hooks type their errors that way.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError
  }
}
