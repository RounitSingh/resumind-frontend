export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>
  ) {
    super(message)
  }
}

export function getErrorMessage(e: unknown): string {
  return e instanceof Error && e.message
    ? e.message
    : "Something went wrong. Please try again."
}
