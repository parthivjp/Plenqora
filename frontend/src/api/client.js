const API_ROOT = '/api'
const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let csrfToken = ''
let csrfRequest = null

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const payload = await response.json()
  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || 'The request could not be completed.',
      response.status,
      payload?.error?.code,
    )
  }
  return payload
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  if (!csrfRequest) {
    csrfRequest = fetch(`${API_ROOT}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then(async (response) => {
      const payload = await parseResponse(response)
      csrfToken = payload.csrfToken
      return csrfToken
    }).finally(() => {
      csrfRequest = null
    })
  }
  return csrfRequest
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (writeMethods.has(method)) headers.set('X-CSRF-Token', await getCsrfToken())
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  const payload = await parseResponse(response)
  if (path === '/auth/logout' && response.ok) csrfToken = ''
  return payload
}

export const apiGet = (path) => apiRequest(path)
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPatch = (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiDelete = (path, body) => apiRequest(path, {
  method: 'DELETE',
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})
