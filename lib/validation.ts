// same limits as the backend's Zod schema
export function validateJd(jd: string): string | null {
  const len = jd.trim().length
  if (len === 0) return "Paste a job description."
  if (len < 100)
    return "Too short: paste the full job description (at least 100 characters)."
  if (len > 20_000) return "Too long: the limit is 20,000 characters."
  return null
}
