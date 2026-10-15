"use client"

import { useCallback, useEffect, useRef } from "react"

// Leading-edge debounce for async actions (submit, "Update resume"): the first call runs
// immediately; further calls are ignored while it is in flight and for `cooldownMs` after it
// settles. Stops double clicks and rapid retries from firing duplicate LLM jobs.
export function useDebouncedAction<A extends unknown[]>(
  action: (...args: A) => Promise<void>,
  cooldownMs = 1500
) {
  const busy = useRef(false)
  const blockedUntil = useRef(0)
  // always call the latest closure, without changing the returned function's identity
  const latest = useRef(action)
  useEffect(() => {
    latest.current = action
  })

  return useCallback(
    async (...args: A) => {
      if (busy.current || Date.now() < blockedUntil.current) return
      busy.current = true
      try {
        await latest.current(...args)
      } finally {
        busy.current = false
        blockedUntil.current = Date.now() + cooldownMs
      }
    },
    [cooldownMs]
  )
}
