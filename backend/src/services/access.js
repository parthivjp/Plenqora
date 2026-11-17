import Issue from '../models/Issue.js'
import Project from '../models/Project.js'
import Workspace from '../models/Workspace.js'
import ApiError from '../utils/ApiError.js'

export async function getWorkspaceMember(user) {
  const workspace = await Workspace.findOne({ _id: user.workspaceId, 'members.user': user._id })
  const member = workspace?.members.find((entry) => entry.user.equals(user._id))
  if (!member) throw new ApiError(403, 'You are not a member of this workspace.', 'WORKSPACE_ACCESS_DENIED')
  return { workspace, member }
}

export async function findAccessibleProject(projectId, user) {
  const project = await Project.findOne({ _id: projectId, workspaceId: user.workspaceId })
  if (!project) throw new ApiError(404, 'Project not found.', 'PROJECT_NOT_FOUND')
  const { member } = await getWorkspaceMember(user)
  if (!project.members.some((id) => id.equals(user._id)) && !['Admin', 'Manager'].includes(member.role)) {
    throw new ApiError(404, 'Project not found.', 'PROJECT_NOT_FOUND')
  }
  return project
}

export async function requireProjectRole(project, user, roles) {
  const { member } = await getWorkspaceMember(user)
  if (roles.length && !roles.includes(member.role)) {
    throw new ApiError(403, 'Your workspace role does not allow this action.', 'PERMISSION_DENIED')
  }
  if (!project.members.some((id) => id.equals(user._id)) && !['Admin', 'Manager'].includes(member.role)) {
    throw new ApiError(403, 'You do not have access to this project.', 'PROJECT_ACCESS_DENIED')
  }
  return member
}

export async function getIssueByKey(key, user) {
  const issue = await Issue.findOne({
    key: key.toUpperCase(),
    workspaceId: user.workspaceId,
  })
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND')
  const project = await findAccessibleProject(issue.projectId, user)
  return { issue, project }
}

export async function assertAssignee(project, assigneeId) {
  if (assigneeId == null) return null
  const exists = project.members.some((id) => id.equals(assigneeId))
  if (!exists) throw new ApiError(400, 'Choose a member of this project as the assignee.', 'INVALID_ASSIGNEE')
  return assigneeId
}
