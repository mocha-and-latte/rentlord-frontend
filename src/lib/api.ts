import { supabase } from './supabase'

const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
export class ApiError extends Error {
  constructor(
    message: string,
    public code = 'ERROR',
  ) {
    super(message)
  }
}
export async function api<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...init.headers,
    },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(
      Array.isArray(json.error?.message)
        ? json.error.message.join(', ')
        : (json.error?.message ?? 'เกิดข้อผิดพลาด'),
      json.error?.code,
    )
  return json.data
}
