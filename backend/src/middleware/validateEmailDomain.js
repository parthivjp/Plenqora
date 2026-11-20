import ApiError from '../utils/ApiError.js'
import { checkEmail } from '../utils/emailCheck.server.js'

export default function validateEmailDomain(req, res, next) {
  const { email } = req.validated.body
  if (req.user?.email === email) return next()

  checkEmail(email)
    .then((result) => {
      if (!result.valid) return next(new ApiError(400, result.error, 'VALIDATION_ERROR'))
      return next()
    })
    .catch(next)
}
