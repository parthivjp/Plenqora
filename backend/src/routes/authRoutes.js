import express from 'express'
import rateLimit from 'express-rate-limit'
import authenticate from '../middleware/authenticate.js'
import requireWorkspaceRole from '../middleware/requireWorkspaceRole.js'
import validate from '../middleware/validate.js'
import * as auth from '../controllers/authController.js'
import { forgotPasswordBody, loginBody, passwordBody, profileBody, registerBody, resetPasswordBody } from '../validators/auth.js'

const router = express.Router()
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'AUTH_RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' } },
})

router.get('/csrf', auth.csrf)
router.post('/register', authLimiter, validate({ body: registerBody }), auth.register)
router.post('/login', authLimiter, validate({ body: loginBody }), auth.login)
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordBody }), auth.requestPasswordReset)
router.post('/reset-password', authLimiter, validate({ body: resetPasswordBody }), auth.resetPassword)
router.post('/logout', authenticate, auth.logout)
router.get('/me', authenticate, auth.me)
router.patch('/profile', authenticate, requireWorkspaceRole(), validate({ body: profileBody }), auth.updateProfile)
router.patch('/password', authenticate, requireWorkspaceRole(), validate({ body: passwordBody }), auth.updatePassword)

export default router
