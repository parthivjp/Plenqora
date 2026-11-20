import { z } from 'zod'
import { validateEmailFormat } from '../utils/emailCheck.server.js'

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid identifier')
export const role = z.enum(['Admin', 'Manager', 'Developer', 'Viewer'])
export const memberRole = z.enum(['Manager', 'Developer', 'Viewer'])
export const issueStatus = z.enum(['todo', 'progress', 'done'])
export const priority = z.enum(['Low', 'Medium', 'High'])
export const issueType = z.enum(['Bug', 'Feature', 'Improvement', 'Design', 'Documentation'])
export const email = z.string().transform((value) => value.trim().toLowerCase()).superRefine((value, context) => {
  const validation = validateEmailFormat(value)
  if (!validation.valid) {
    context.addIssue({ code: 'custom', message: validation.error })
  }
})
