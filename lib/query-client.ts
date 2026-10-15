import { QueryClient } from "@tanstack/react-query"

import { isApiError, type ApiError } from "@/lib/api"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // A 4xx will not change on retry; only retry network / server hiccups, once.
      retry: (count, error) =>
        count < 1 && !(isApiError(error) && error.status >= 400 && error.status < 500),
    },
  },
})

// Every failed request is an ApiError (see lib/api.ts), so hooks type their errors that way.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError
  }
}
