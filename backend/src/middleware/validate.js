import ApiError from '../utils/ApiError.js'

export default function validate(schemas) {
  return (req, res, next) => {
    const validated = { ...req.validated }
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part])
      if (!result.success) {
        const message = result.error.issues.map((issue) => `${issue.path.join('.') || part}: ${issue.message}`).join('; ')
        return next(new ApiError(400, message, 'VALIDATION_ERROR'))
      }
      validated[part] = result.data
    }
    req.validated = validated
    return next()
  }
}
