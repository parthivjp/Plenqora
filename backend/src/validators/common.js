import { z } from 'zod'

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid identifier')
export const role = z.enum(['Admin', 'Manager', 'Developer', 'Viewer'])
export const memberRole = z.enum(['Manager', 'Developer', 'Viewer'])
export const issueStatus = z.enum(['todo', 'progress', 'done'])
export const priority = z.enum(['Low', 'Medium', 'High'])
export const issueType = z.enum(['Bug', 'Feature', 'Improvement', 'Design', 'Documentation'])
export const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase())
