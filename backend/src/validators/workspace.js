import { z } from 'zod'
import { email, memberRole, objectId } from './common.js'

export const workspaceBody = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240),
}).strict()

export const invitationBody = z.object({
  email,
  role: memberRole,
}).strict()

export const memberParams = z.object({ userId: objectId }).strict()
export const invitationParams = z.object({ invitationId: objectId }).strict()
export const roleBody = z.object({ role: memberRole }).strict()
