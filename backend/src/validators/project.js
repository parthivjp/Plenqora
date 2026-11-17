import { z } from 'zod'
import { objectId } from './common.js'

const projectFields = {
  name: z.string().trim().min(3).max(60),
  key: z.string().trim().toUpperCase().regex(/^[A-Z][A-Z0-9]{1,5}$/),
  description: z.string().trim().max(240).optional().default(''),
}

export const createProjectBody = z.object(projectFields).strict()
export const updateProjectBody = z.object({
  name: projectFields.name.optional(),
  description: projectFields.description,
}).strict().refine((value) => Object.keys(value).length > 0, 'provide at least one field to update')
export const projectParams = z.object({ projectId: objectId }).strict()
export const projectMemberBody = z.object({ userId: objectId }).strict()
