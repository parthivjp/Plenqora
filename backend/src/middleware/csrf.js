import crypto from 'node:crypto'
import ApiError from '../utils/ApiError.js'

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function cookieSettings() {
  const sameSite = process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: '/',
  }
}

export function createCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie('plenqora_csrf', token, { ...cookieSettings(), httpOnly: false })
  return token
}

function hasTrustedOrigin(req) {
  const origin = req.get('origin')
  if (typeof origin !== 'string') return false
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean)
  return allowedOrigins.includes(origin)
}

export default function csrfProtection(req, res, next) {
  if (!unsafeMethods.has(req.method)) return next()
  const cookieToken = req.cookies?.plenqora_csrf
  const headerToken = req.get('x-csrf-token')
  if (typeof headerToken === 'string' && headerToken.length > 0 && hasTrustedOrigin(req)) {
    return next()
  }
  if (
    typeof cookieToken !== 'string'
    || typeof headerToken !== 'string'
    || cookieToken.length !== headerToken.length
    || !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))
  ) {
    return next(new ApiError(403, 'Refresh the page and try again.', 'CSRF_VALIDATION_FAILED'))
  }
  return next()
}
