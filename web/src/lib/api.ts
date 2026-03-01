const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export function getApiBase(): string {
  return API_BASE
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError && (e.message === 'Failed to fetch' || e.message === 'Load failed')
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const token = options.token !== undefined ? options.token : getToken()
  const { token: _t, ...rest } = options
  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers as Record<string, string>),
      },
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new Error(
        `Cannot reach the API at ${API_BASE}. Make sure the backend is running (npm run start:dev in the backend folder) and PostgreSQL is running on localhost:5432.`
      )
    }
    throw e
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = (err as { message?: string }).message || res.statusText || 'Request failed'
    if (res.status === 403) throw new Error(msg === 'Forbidden' ? 'You don’t have permission. Use an admin or agent account.' : msg)
    throw new Error(msg)
  }
  return res.json()
}

export async function uploadCampaignImages(files: File[]): Promise<{ urls: string[] }> {
  const token = getToken()
  if (!token) {
    throw new Error('You must be logged in to upload images')
  }
  const form = new FormData()
  files.forEach((f) => form.append('images', f))
  let res: Response
  try {
    res = await fetch(`${API_BASE}/uploads/campaign-images`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    })
  } catch (e) {
    if (isNetworkError(e)) {
      throw new Error(
        `Cannot reach the API at ${API_BASE}. Make sure the backend is running and PostgreSQL is running.`
      )
    }
    throw e
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const msg = (err as { message?: string }).message || res.statusText || 'Upload failed'
    throw new Error(msg)
  }
  return res.json()
}
