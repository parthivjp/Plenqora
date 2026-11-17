import { z } from 'zod'
import { issueStatus, issueType, objectId, priority } from './common.js'

export const issueFields = {
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(10).max(1000),
  type: issueType,
  priority,
  status: issueStatus,
  assigneeId: objectId.nullable().optional(),
}

export const createIssueBody = z.object(issueFields).strict()
export const updateIssueBody = z.object({
  title: issueFields.title.optional(),
  description: issueFields.description.optional(),
  type: issueFields.type.optional(),
  priority: issueFields.priority.optional(),
  status: issueFields.status.optional(),
  assigneeId: issueFields.assigneeId,
}).strict().refine((value) => Object.keys(value).length > 0, 'provide at least one field to update')

export const projectIssueParams = z.object({ projectId: objectId }).strict()
export const issueParams = z.object({ issueId: z.string().regex(/^[A-Z][A-Z0-9]{1,5}-\d+$/i) }).strict()
export const issueQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.union([issueStatus, z.literal('all')]).optional(),
  priority: z.union([priority, z.literal('all')]).optional(),
  assignee: z.union([objectId, z.literal('all')]).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
}).strict()
