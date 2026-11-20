import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import Invitation from '../models/Invitation.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Workspace from '../models/Workspace.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { comparePassword, hashPassword, validatePasswordLength } from '../utils/password.js'
import { serializeUser } from '../utils/serializers.js'
import { cookieSettings, createCsrfToken } from '../middleware/csrf.js'
import { createPasswordResetEmail } from '../services/emailTemplates.js'
import { isEmailConfigured, sendEmail } from '../services/mailer.js'
import { publishWorkspaceUpdate } from '../services/workspaceEvents.js'

function sessionCookieAge() {
  const value = process.env.JWT_EXPIRES_IN || '30m'
  const match = /^(\d+)(s|m|h|d)$/.exec(value)
  if (!match) throw new Error('JWT_EXPIRES_IN must use seconds, minutes, hours, or days.')
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return Number(match[1]) * multipliers[match[2]]
}

function setSessionCookie(res, userId, sessionVersion = 0) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '30m'
  const token = jwt.sign({ sub: userId.toString(), version: sessionVersion }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn,
  })
  res.cookie('plenqora_session', token, { ...cookieSettings(), maxAge: sessionCookieAge() })
}

function invitationDigest(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const csrf = (req, res) => {
  res.json({ csrfToken: createCsrfToken(req, res) })
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, invitationToken } = req.validated.body
  if (!validatePasswordLength(password)) throw new ApiError(400, 'Password must be 72 UTF-8 bytes or fewer.', 'VALIDATION_ERROR')
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists. Sign in instead.', 'EMAIL_IN_USE')

  const invitation = invitationToken
    ? await Invitation.findOne({
      tokenHash: invitationDigest(invitationToken),
      email,
      expiresAt: { $gt: new Date() },
      acceptedAt: null,
    })
    : null
  if (invitationToken && !invitation) {
    throw new ApiError(400, 'This invitation is invalid or has expired.', 'INVITATION_INVALID')
  }

  const workspaceId = invitation?.workspaceId ?? new mongoose.Types.ObjectId()
  const user = new User({ name, email, passwordHash: await hashPassword(password), workspaceId })
  await user.save()
  try {
    if (invitation) {
      const workspace = await Workspace.findById(invitation.workspaceId)
      if (!workspace) throw new ApiError(400, 'The invitation workspace is no longer available.', 'INVITATION_INVALID')
      workspace.members.push({ user: user._id, role: invitation.role })
      await workspace.save()
      await Project.updateMany({ workspaceId: workspace._id }, { $addToSet: { members: user._id } })
      invitation.acceptedAt = new Date()
      await invitation.save()
      publishWorkspaceUpdate(workspace._id)
      setSessionCookie(res, user._id, user.sessionVersion)
      return res.status(201).json({
        user: serializeUser(user, invitation.role),
        workspaceId: workspace._id.toString(),
      })
    }

    await Workspace.create({
      _id: workspaceId,
      name: `${name}'s Workspace`,
      owner: user._id,
      members: [{ user: user._id, role: 'Admin' }],
    })
    setSessionCookie(res, user._id, user.sessionVersion)
    return res.status(201).json({ user: serializeUser(user, 'Admin'), workspaceId: workspaceId.toString() })
  } catch (error) {
    await User.deleteOne({ _id: user._id })
    throw error
  }
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body
  const user = await User.findOne({ email }).select('+passwordHash +sessionVersion')
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS')
  }
  const workspace = await Workspace.findOne({ _id: user.workspaceId, 'members.user': user._id })
  const member = workspace?.members.find((entry) => entry.user.equals(user._id))
  if (!member) throw new ApiError(403, 'Your workspace access is no longer active.', 'WORKSPACE_ACCESS_DENIED')
  setSessionCookie(res, user._id, user.sessionVersion)
  res.json({ user: serializeUser(user, member.role) })
})

export const logout = asyncHandler(async (req, res) => {
  req.user.sessionVersion += 1
  await req.user.save()
  res.clearCookie('plenqora_session', cookieSettings())
  res.clearCookie('plenqora_csrf', { ...cookieSettings(), httpOnly: false })
  res.status(204).end()
})

export const me = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findOne({ _id: req.user.workspaceId, 'members.user': req.user._id })
  const member = workspace?.members.find((entry) => entry.user.equals(req.user._id))
  if (!member) throw new ApiError(403, 'Your workspace access is no longer active.', 'WORKSPACE_ACCESS_DENIED')
  res.json({ user: serializeUser(req.user, member.role) })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.validated.body
  const duplicate = await User.exists({ email, _id: { $ne: req.user._id } })
  if (duplicate) throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_IN_USE')
  req.user.name = name
  req.user.email = email
  await req.user.save()
  res.json({ user: serializeUser(req.user, req.membership.role) })
})

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body
  if (!validatePasswordLength(newPassword)) throw new ApiError(400, 'Password must be 72 UTF-8 bytes or fewer.', 'VALIDATION_ERROR')
  const user = await User.findById(req.user._id).select('+passwordHash +sessionVersion')
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw new ApiError(400, 'Your current password is incorrect.', 'CURRENT_PASSWORD_INCORRECT')
  }
  const updatedUser = await User.findOneAndUpdate({
    _id: user._id,
    passwordHash: user.passwordHash,
  }, {
    $set: { passwordHash: await hashPassword(newPassword) },
    $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
    $inc: { sessionVersion: 1 },
  }, { returnDocument: 'after' }).select('+sessionVersion')
  if (!updatedUser) {
    throw new ApiError(409, 'Your password changed before this update completed. Please sign in again.', 'PASSWORD_UPDATE_CONFLICT')
  }
  setSessionCookie(res, updatedUser._id, updatedUser.sessionVersion)
  res.status(204).end()
})

export const requestPasswordReset = asyncHandler(async (req, res) => {
  if (!isEmailConfigured() && process.env.NODE_ENV !== 'development') {
    throw new ApiError(503, 'Password recovery is unavailable until Brevo email settings are configured.', 'EMAIL_NOT_CONFIGURED')
  }
  const { email } = req.validated.body
  let devResetUrl = null
  const emailConfigured = isEmailConfigured()
  const user = await User.findOne({ email })
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    user.resetTokenHash = invitationDigest(token)
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()
    const origin = process.env.FRONTEND_ORIGIN || 'https://plenqora.vercel.app'
    const resetUrl = new URL(`/reset-password?token=${token}`, origin).toString()
    if (emailConfigured) {
      try {
        await sendEmail({
          to: email,
          ...createPasswordResetEmail(resetUrl),
        })
      } catch (error) {
        user.resetTokenHash = undefined
        user.resetTokenExpiresAt = undefined
        await user.save()
        console.error('[api] password reset email delivery failed', error)
        throw new ApiError(503, 'The password reset email could not be sent. Please try again later.', 'EMAIL_DELIVERY_FAILED')
      }
    } else {
      devResetUrl = resetUrl
      console.warn('[api] Brevo is not configured; reset email was not sent. Use the local development link.')
    }
  }
  res.status(202).json({
    emailStatus: emailConfigured ? 'submitted' : 'not-configured',
    message: emailConfigured
      ? 'If an account exists for this address, a password reset link has been sent.'
      : 'No email was sent because Brevo is not configured. For a registered local account, use the development reset link below.',
    ...(devResetUrl ? { resetUrl: devResetUrl } : {}),
  })
})

export const validatePasswordReset = asyncHandler(async (req, res) => {
  const { token } = req.params
  if (!/^[a-f\d]{64}$/i.test(token)) {
    throw new ApiError(400, 'This password reset link is invalid or incomplete.', 'RESET_TOKEN_INVALID')
  }
  const user = await User.exists({
    resetTokenHash: invitationDigest(token),
    resetTokenExpiresAt: { $gt: new Date() },
  })
  if (!user) {
    throw new ApiError(400, 'This password reset link is invalid or has expired.', 'RESET_TOKEN_INVALID')
  }
  res.json({ valid: true })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.validated.body
  if (!validatePasswordLength(newPassword)) throw new ApiError(400, 'Password must be 72 UTF-8 bytes or fewer.', 'VALIDATION_ERROR')
  const result = await User.updateOne({
    resetTokenHash: invitationDigest(token),
    resetTokenExpiresAt: { $gt: new Date() },
  }, {
    $set: { passwordHash: await hashPassword(newPassword) },
    $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 },
    $inc: { sessionVersion: 1 },
  })
  if (result.matchedCount !== 1) {
    throw new ApiError(400, 'This password reset link is invalid or expired.', 'RESET_TOKEN_INVALID')
  }
  res.status(204).end()
})
