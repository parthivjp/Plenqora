import express from 'express'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/authRoutes.js'
import workspaceRoutes from './routes/workspaceRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import issueRoutes, { projectRouter as projectIssueRoutes } from './routes/issueRoutes.js'
import csrfProtection from './middleware/csrf.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { publishWorkspaceUpdate } from './services/workspaceEvents.js'
import { checkEmail } from './utils/emailCheck.server.js'

const app = express()
app.set('trust proxy', 1)
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(null, false)
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb', strict: true }))
app.use(cookieParser())
app.use(csrfProtection)
app.use((req, res, next) => {
  res.once('finish', () => {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
      && res.statusCode >= 200
      && res.statusCode < 300
      && req.user?.workspaceId
    ) {
      publishWorkspaceUpdate(req.user.workspaceId)
    }
  })
  next()
})
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json({
      error: {
        title: 'Too many requests',
        code: 'RATE_LIMITED',
        message: 'Please wait a few minutes before trying again.',
      },
    })
  },
}))
app.post('/api/validate-email', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'EMAIL_VALIDATION_RATE_LIMITED', message: 'Too many email checks. Try again later.' } },
}), async (req, res) => {
  res.json(await checkEmail(req.body?.email))
})

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  })
})
app.use('/api/auth', authRoutes)
app.use('/api/workspace', workspaceRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/projects/:projectId/issues', projectIssueRoutes)
app.use('/api/issues', issueRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
