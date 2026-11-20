import express from 'express'
import rateLimit from 'express-rate-limit'
import authenticate from '../middleware/authenticate.js'
import requireWorkspaceRole from '../middleware/requireWorkspaceRole.js'
import validate from '../middleware/validate.js'
import validateEmailDomain from '../middleware/validateEmailDomain.js'
import * as auth from '../controllers/authController.js'
import { forgotPasswordBody, loginBody, passwordBody, profileBody, registerBody, resetPasswordBody, verifyEmailBody } from '../validators/auth.js'

const router = express.Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'AUTH_RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' } },
})
const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'EMAIL_VERIFICATION_RATE_LIMITED', message: 'Too many verification requests. Try again later.' } },
})

router.get('/csrf', auth.csrf)
router.get('/reset-password/:token', auth.validatePasswordReset)
router.get('/verify-email/:token', auth.validateEmailVerification)
router.post('/verify-email', emailVerificationLimiter, validate({ body: verifyEmailBody }), validateEmailDomain, auth.requestEmailVerification)
router.post('/register', authLimiter, validate({ body: registerBody }), validateEmailDomain, auth.register)
router.post('/login', authLimiter, validate({ body: loginBody }), auth.login)
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordBody }), auth.requestPasswordReset)
router.post('/reset-password', authLimiter, validate({ body: resetPasswordBody }), auth.resetPassword)
router.post('/logout', authenticate, auth.logout)
router.get('/me', authenticate, auth.me)
router.patch('/profile', authenticate, requireWorkspaceRole(), validate({ body: profileBody }), validateEmailDomain, auth.updateProfile)
router.patch('/password', authenticate, requireWorkspaceRole(), validate({ body: passwordBody }), auth.updatePassword)

export default router
