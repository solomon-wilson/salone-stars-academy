import { auth } from "../firebase"

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const authHeaders = await getAuthHeaders()
  return fetch(url, {
    ...options,
    headers: { ...authHeaders, ...(options.headers as Record<string, string>) },
  })
}
