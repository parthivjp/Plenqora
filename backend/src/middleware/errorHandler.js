import mongoose from 'mongoose'
import ApiError from '../utils/ApiError.js'

export function notFound(req, res, next) {
  next(new ApiError(404, 'The requested resource was not found.', 'NOT_FOUND'))
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)

  let status = error.status || 500
  let message = error.message || 'An unexpected server error occurred.'
  let code = error.code || 'INTERNAL_SERVER_ERROR'

  if (error instanceof mongoose.Error.ValidationError) {
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

  if (status >= 500 && !(error instanceof ApiError)) console.error(error)
  res.status(status).json({
    error: {
      code,
      message: status >= 500 && process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : message,
    },
  })
}
