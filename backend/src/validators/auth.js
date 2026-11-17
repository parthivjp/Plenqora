import { z } from 'zod'
import { email } from './common.js'

const password = z.string().min(12).max(72).refine(
  (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value),
  'must include lowercase, uppercase, and numeric characters',
)

export const registerBody = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  invitationToken: z.string().regex(/^[a-f\d]{64}$/i).optional(),
}).strict()

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(72),
}).strict()

export const profileBody = z.object({
  name: z.string().trim().min(2).max(80),
  email,
}).strict()

export const passwordBody = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: password,
}).strict()

export const forgotPasswordBody = z.object({ email }).strict()
export const resetPasswordBody = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  newPassword: password,
}).strict()
