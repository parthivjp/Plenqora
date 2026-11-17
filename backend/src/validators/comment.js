import { z } from 'zod'
import { objectId } from './common.js'

export const issueCommentParams = z.object({ issueId: z.string().regex(/^[A-Z][A-Z0-9]{1,5}-\d+$/i) }).strict()
export const createCommentBody = z.object({
  text: z.string().trim().min(1).max(2000),
  parentId: objectId.nullable().optional(),
}).strict()
export const commentParams = z.object({ commentId: objectId }).strict()
export const updateCommentBody = z.object({ text: z.string().trim().min(1).max(2000) }).strict()
