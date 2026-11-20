import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js'

function titleFor(status, code) {
  if (code === 'INVALID_JSON') return 'Request could not be read'
  if (code === 'EMAIL_NOT_CONFIGURED') return 'Email service unavailable'
  if (code === 'EMAIL_DELIVERY_FAILED') return 'Email could not be sent'
  if (code === 'RESET_TOKEN_INVALID') return 'Invalid or expired reset link'
  if (code === 'VALIDATION_ERROR') return 'Please check your information'
  if (code === 'INVALID_CREDENTIALS') return 'Sign-in failed'
  if (status === 401) return 'Sign-in required'
  if (status === 403) return 'Access denied'
  if (status === 404) return 'Not found'
  if (status === 409) return 'This change conflicts with existing information'
  if (status === 413) return 'Request is too large'
  if (status === 429) return 'Too many requests'
  if (status === 503) return 'Service temporarily unavailable'
  if (status >= 500) return 'Something went wrong'
  return 'Request could not be completed'
}

export function notFound(req, res, next) {
  next(new ApiError(404, 'The requested resource was not found.', 'NOT_FOUND'))
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let status = error instanceof ApiError ? error.status : 500
  let message = error instanceof ApiError
    ? error.message
    : 'The server had a problem processing your request. Please try again.'
  let code = error instanceof ApiError ? error.code : 'INTERNAL_SERVER_ERROR'

  if (error.type === 'entity.parse.failed') {
    status = 400
    message = 'The request body contains invalid JSON. Check the submitted information and try again.'
    code = 'INVALID_JSON'
  } else if (error.type === 'entity.too.large') {
    status = 413
    message = 'The submitted data is too large. Reduce its size and try again.'
    code = 'REQUEST_TOO_LARGE'
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400
    message = Object.values(error.errors).map((item) => item.message).join('; ')
    code = 'VALIDATION_ERROR'
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400
    message = 'A resource identifier is invalid.'
    code = 'INVALID_IDENTIFIER'
  } else if (error.code === 11000) {
    status = 409
    message = 'A record with that value already exists.'
    code = 'DUPLICATE_RECORD'
  }

  if (status >= 500 && !(error instanceof ApiError)) {
    console.error(`[api] ${req.method} ${req.originalUrl} failed`, error)
  }

  res.status(status).json({
    error: {
      title: titleFor(status, code),
      code,
      message,
    },
  })
}
