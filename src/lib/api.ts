import { supabase } from './supabase'

const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
export const apiUrl = (path: string) => `${base}${path}`
export class ApiError extends Error {
  constructor(
    message: string,
    public code = 'ERROR',
  ) {
    super(message)
  }
}

export type ApiRequestInit = RequestInit & {
  idempotencyKey?: string
}

export const createIdempotencyKey = () => crypto.randomUUID()

export async function api<T = any>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const { idempotencyKey, ...requestInit } = init
  const method = String(requestInit.method ?? 'GET').toUpperCase()
  const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(apiUrl(path), {
    ...requestInit,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...(mutation
        ? { 'Idempotency-Key': idempotencyKey ?? createIdempotencyKey() }
        : {}),
      ...requestInit.headers,
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
