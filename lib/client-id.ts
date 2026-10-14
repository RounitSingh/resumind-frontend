const KEY = "rc_client_id"
let memoryId: string | null = null

export function getClientId() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return (memoryId ??= crypto.randomUUID()) // private mode fallback
  }
}
