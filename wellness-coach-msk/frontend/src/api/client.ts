import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL as string

class ApiError extends Error {
  public status: number;

    constructor(status: number,
                message: string,
  ) {
    super(message)
        this.status = status;
        this.name = 'ApiError'
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function apiCall<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(res.status, body || res.statusText)
  }

  return res.json() as Promise<T>
}

export { ApiError }