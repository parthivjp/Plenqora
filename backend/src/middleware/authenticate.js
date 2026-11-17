import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

export default asyncHandler(async (req, res, next) => {
  const token = req.cookies?.plenqora_session
  if (!token) throw new ApiError(401, 'Sign in to continue.', 'AUTHENTICATION_REQUIRED')

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    throw new ApiError(401, 'Your session has expired. Sign in again.', 'SESSION_EXPIRED')
  }

  const user = await User.findById(payload.sub).select('+sessionVersion')
  if (!user) throw new ApiError(401, 'Your account is no longer available.', 'ACCOUNT_NOT_FOUND')
  if (payload.version !== user.sessionVersion) {
    throw new ApiError(401, 'Your session has been revoked. Sign in again.', 'SESSION_REVOKED')
  }
  req.user = user
  next()
})
