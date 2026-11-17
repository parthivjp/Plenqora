import express from 'express'
import authenticate from '../middleware/authenticate.js'
import validate from '../middleware/validate.js'
import * as projects from '../controllers/projectController.js'
import { createProjectBody, projectMemberBody, projectParams, updateProjectBody } from '../validators/project.js'

const router = express.Router()
router.use(authenticate)
router.get('/', projects.listProjects)
router.post('/', validate({ body: createProjectBody }), projects.createProject)
router.get('/:projectId', validate({ params: projectParams }), projects.getProject)
router.patch('/:projectId', validate({ params: projectParams, body: updateProjectBody }), projects.updateProject)
router.delete('/:projectId', validate({ params: projectParams }), projects.deleteProject)
router.post('/:projectId/members', validate({ params: projectParams, body: projectMemberBody }), projects.addProjectMember)
router.delete('/:projectId/members', validate({ params: projectParams, body: projectMemberBody }), projects.removeProjectMember)

export default router
