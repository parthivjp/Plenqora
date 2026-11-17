import Workspace from '../models/Workspace.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

export default function requireWorkspaceRole(...roles) {
  return asyncHandler(async (req, res, next) => {
    const workspace = await Workspace.findOne({
      _id: req.user.workspaceId,
      'members.user': req.user._id,
    })
    const member = workspace?.members.find((entry) => entry.user.equals(req.user._id))
    if (!member) throw new ApiError(403, 'You are not a member of this workspace.', 'WORKSPACE_ACCESS_DENIED')
    if (roles.length && !roles.includes(member.role)) {
      throw new ApiError(403, 'Your workspace role does not allow this action.', 'PERMISSION_DENIED')
    }
    req.workspace = workspace
    req.membership = member
    next()
  })
}
