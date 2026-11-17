import express from 'express'
import authenticate from '../middleware/authenticate.js'
import requireWorkspaceRole from '../middleware/requireWorkspaceRole.js'
import validate from '../middleware/validate.js'
import * as workspace from '../controllers/workspaceController.js'
import { invitationParams, invitationBody, memberParams, roleBody, workspaceBody } from '../validators/workspace.js'

const router = express.Router()
router.use(authenticate, requireWorkspaceRole())
router.get('/bootstrap', workspace.bootstrap)
router.get('/export', requireWorkspaceRole('Admin'), workspace.exportData)
router.patch('/', requireWorkspaceRole('Admin'), validate({ body: workspaceBody }), workspace.updateWorkspace)
router.get('/invitations', requireWorkspaceRole('Admin', 'Manager'), workspace.listInvitations)
router.post('/invitations', requireWorkspaceRole('Admin', 'Manager'), validate({ body: invitationBody }), workspace.createInvitation)
router.post('/invitations/:invitationId/resend', requireWorkspaceRole('Admin', 'Manager'), validate({ params: invitationParams }), workspace.resendInvitation)
router.delete('/invitations/:invitationId', requireWorkspaceRole('Admin', 'Manager'), validate({ params: invitationParams }), workspace.revokeInvitation)
router.patch('/members/:userId', requireWorkspaceRole('Admin'), validate({ params: memberParams, body: roleBody }), workspace.updateMemberRole)
router.delete('/members/:userId', requireWorkspaceRole('Admin'), validate({ params: memberParams }), workspace.removeMember)

export default router
