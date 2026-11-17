import Comment from '../models/Comment.js'
import Issue from '../models/Issue.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { findAccessibleProject, getWorkspaceMember, requireProjectRole } from '../services/access.js'
import { serializeProject } from '../utils/serializers.js'

export const listProjects = asyncHandler(async (req, res) => {
  const { member } = await getWorkspaceMember(req.user)
  const filter = { workspaceId: req.user.workspaceId }
  if (!['Admin', 'Manager'].includes(member.role)) filter.members = req.user._id
  const projects = await Project.find(filter).sort({ updatedAt: -1 })
  res.json({ projects: projects.map(serializeProject) })
})

export const createProject = asyncHandler(async (req, res) => {
  const { workspace, member } = await getWorkspaceMember(req.user)
  if (!['Admin', 'Manager'].includes(member.role)) {
    throw new ApiError(403, 'Only admins and managers can create projects.', 'PERMISSION_DENIED')
  }
  const project = await Project.create({
    ...req.validated.body,
    workspaceId: workspace._id,
    owner: req.user._id,
    members: workspace.members.map((entry) => entry.user),
  })
  res.status(201).json({ project: serializeProject(project) })
})

export const getProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  res.json({ project: serializeProject(project) })
})

export const updateProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager'])
  Object.assign(project, req.validated.body)
  await project.save()
  res.json({ project: serializeProject(project) })
})

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  await requireProjectRole(project, req.user, ['Admin'])
  const issues = await Issue.find({ projectId: project._id }, { _id: 1 })
  await Promise.all([
    Comment.deleteMany({ projectId: project._id }),
    Issue.deleteMany({ projectId: project._id }),
    Project.deleteOne({ _id: project._id }),
  ])
  res.status(200).json({ deletedProjectId: project._id.toString(), deletedIssueCount: issues.length })
})

export const addProjectMember = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager'])
  const userId = req.validated.body.userId
  const isWorkspaceMember = await User.exists({ _id: userId, workspaceId: req.user.workspaceId })
  if (!isWorkspaceMember) throw new ApiError(400, 'Choose a member of this workspace.', 'INVALID_MEMBER')
  if (project.members.some((memberId) => memberId.equals(userId))) {
    throw new ApiError(409, 'This member already has project access.', 'MEMBER_ALREADY_ASSIGNED')
  }
  project.members.push(userId)
  await project.save()
  res.status(201).json({ project: serializeProject(project) })
})

export const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager'])
  const userId = req.validated.body.userId
  if (project.owner.equals(userId)) throw new ApiError(400, 'The project owner cannot be removed.', 'OWNER_LOCKED')
  if (!project.members.some((memberId) => memberId.equals(userId))) {
    throw new ApiError(404, 'Project member not found.', 'MEMBER_NOT_FOUND')
  }
  project.members = project.members.filter((memberId) => !memberId.equals(userId))
  await project.save()
  await Issue.updateMany({ projectId: project._id, assignee: userId }, { $set: { assignee: null } })
  res.status(204).end()
})
