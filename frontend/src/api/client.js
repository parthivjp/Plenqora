const apiEnvironment = typeof import.meta.env === 'undefined' ? {} : import.meta.env
const API_BASE_URL = (apiEnvironment.VITE_API_URL || '').replace(/\/+$/, '')
const API_ROOT = `${API_BASE_URL}/api`
const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

let csrfToken = ''
let csrfRequest = null

const errorTitles = {
  API_UNAVAILABLE: 'Can’t connect to Plenqora',
  EMPTY_RESPONSE: 'Unexpected server response',
  INVALID_SERVER_RESPONSE: 'Unexpected server response',
  REQUEST_ABORTED: 'Request cancelled',
  INVALID_CREDENTIALS: 'Sign-in failed',
  AUTHENTICATION_REQUIRED: 'Sign-in required',
  SESSION_EXPIRED: 'Session expired',
  INVALID_JSON: 'Request could not be read',
  EMAIL_NOT_CONFIGURED: 'Email service unavailable',
  EMAIL_DELIVERY_FAILED: 'Email could not be sent',
  RESET_TOKEN_INVALID: 'Invalid or expired reset link',
}

function titleForStatus(status) {
  if (status === 400) return 'Please check your information'
  if (status === 401) return 'Sign-in required'
  if (status === 403) return 'Access denied'
  if (status === 404) return 'Not found'
  if (status === 409) return 'This change conflicts with existing information'
  if (status === 413) return 'Request is too large'
  if (status === 429) return 'Too many requests'
  if (status >= 500) return 'Server temporarily unavailable'
  return 'Request could not be completed'
}

export class ApiError extends Error {
  constructor(message, status, code, title) {
    const errorTitle = title || errorTitles[code] || titleForStatus(status)
    super(`${errorTitle}: ${message}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.title = errorTitle
    this.reason = message
  }
}

function responseFallback(response, invalidJson = false) {
  if (invalidJson) {
    return 'The server sent a response the app could not read. Please try again; if it continues, contact support.'
  }
  if (response.status === 401) return 'Sign in again and retry your request.'
  if (response.status === 403) return 'You do not have permission to do that. Refresh the page and try again.'
  if (response.status === 404) return 'The requested page or item could not be found.'
  if (response.status === 429) return 'Please wait a moment before trying again.'
  if (response.status >= 500) return 'The server had a problem processing your request. Please try again.'
  return 'The request could not be completed. Please review your information and try again.'
}

export async function parseResponse(response) {
  if (response.status === 204) return null

  const text = await response.text()
  let payload = null
  let invalidJson = false
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      invalidJson = true
    }
  }

  if (!response.ok) {
    const apiError = payload?.error
    throw new ApiError(
      typeof apiError?.message === 'string' && !invalidJson
        ? apiError.message
        : responseFallback(response, invalidJson),
      response.status,
      typeof apiError?.code === 'string' && !invalidJson ? apiError.code : 'REQUEST_FAILED',
      typeof apiError?.title === 'string' && !invalidJson ? apiError.title : undefined,
    )
  }

  if (invalidJson) {
    throw new ApiError(responseFallback(response, true), response.status, 'INVALID_SERVER_RESPONSE')
  }
  if (!text) {
    throw new ApiError(
      'The server returned no data for this request. Please try again; if it continues, contact support.',
      response.status,
      'EMPTY_RESPONSE',
    )
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApiError(responseFallback(response, true), response.status, 'INVALID_SERVER_RESPONSE')
  }

  return payload
}

async function fetchResponse(url, options) {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new ApiError('The request was cancelled. Please try again.', 0, 'REQUEST_ABORTED')
    }
    throw new ApiError(
      'Check that the backend is running and that your connection is available, then try again.',
      0,
      'API_UNAVAILABLE',
    )
  }
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  if (!csrfRequest) {
    csrfRequest = fetchResponse(`${API_ROOT}/auth/csrf`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }).then(async (response) => {
      const payload = await parseResponse(response)
      if (typeof payload?.csrfToken !== 'string' || !payload.csrfToken) {
        throw new ApiError(
          'Refresh the page and try again.',
          response.status,
          'INVALID_SERVER_RESPONSE',
        )
      }
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
  const response = await fetchResponse(`${API_ROOT}${path}`, {
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
