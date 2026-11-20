import crypto from 'node:crypto'
import Invitation from '../models/Invitation.js'
import Issue from '../models/Issue.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Workspace from '../models/Workspace.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getWorkspaceMember } from '../services/access.js'
import { serializeIssue, serializeProject } from '../utils/serializers.js'
import Comment from '../models/Comment.js'
import { createInvitationEmail } from '../services/emailTemplates.js'
import { isEmailConfigured, sendEmail } from '../services/mailer.js'

function workspaceDto(workspace) {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    description: workspace.description,
    ownerId: workspace.owner.toString(),
  }
}

async function sendInvitationEmail(to, workspaceName, inviteUrl) {
  try {
    await sendEmail({
      to,
      ...createInvitationEmail(workspaceName, inviteUrl),
    })
  } catch (error) {
    console.error('[api] team invitation email delivery failed', error)
    throw error
  }
}

export const bootstrap = asyncHandler(async (req, res) => {
  const { workspace, member } = await getWorkspaceMember(req.user)
  const projectFilter = { workspaceId: workspace._id }
  if (!['Admin', 'Manager'].includes(member.role)) projectFilter.members = req.user._id
  const projects = await Project.find(projectFilter).sort({ updatedAt: -1 })
  const memberUsers = await User.find({ _id: { $in: workspace.members.map((member) => member.user) } })
  const usersById = new Map(memberUsers.map((user) => [user._id.toString(), user]))
  const members = workspace.members.flatMap((entry) => {
    const user = usersById.get(entry.user.toString())
    return user ? [{
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: entry.role,
      status: 'Active',
      joinedAt: entry.joinedAt,
    }] : []
  })

  res.json({
    workspace: workspaceDto(workspace),
    projects: projects.map(serializeProject),
    members,
  })
})

export const exportData = asyncHandler(async (req, res) => {
  const workspace = req.workspace
  let projects
  let issues
  let comments
  let members
  try {
    [projects, issues, comments, members] = await Promise.all([
      Project.find({ workspaceId: workspace._id }).sort({ createdAt: 1, _id: 1 }),
      Issue.find({ workspaceId: workspace._id })
        .sort({ createdAt: 1, _id: 1 })
        .populate('assignee', 'name'),
      Comment.find({ workspaceId: workspace._id })
        .sort({ createdAt: 1, _id: 1 })
        .populate('author', 'name'),
      User.find({ _id: { $in: workspace.members.map((member) => member.user) } })
        .sort({ name: 1, _id: 1 }),
    ])
  } catch (error) {
    console.error('[api] workspace data export query failed', error)
    throw new ApiError(500, 'Workspace data could not be exported. Please try again.', 'WORKSPACE_EXPORT_FAILED')
  }

  const roles = new Map(workspace.members.map((member) => [member.user.toString(), member.role]))
  res.set('Cache-Control', 'no-store').json({
    exportedAt: new Date().toISOString(),
    workspace: workspaceDto(workspace),
    projects: projects.map(serializeProject),
    issues: issues.map((issue) => serializeIssue(issue, issue.assignee)),
    members: members.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roles.get(user._id.toString()),
    })),
    comments: comments.map((comment) => ({
      id: comment._id.toString(),
      issueId: comment.issueId.toString(),
      parentId: comment.parentId?.toString() ?? null,
      text: comment.text,
      author: comment.author?.name ?? comment.authorName,
      createdAt: comment.createdAt,
    })),
  })
})

export const updateWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.validated.body
  req.workspace.name = name
  req.workspace.description = description
  await req.workspace.save()
  res.json({ workspace: workspaceDto(req.workspace) })
})

export const listInvitations = asyncHandler(async (req, res) => {
  const invitations = await Invitation.find({
    workspaceId: req.workspace._id,
    acceptedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })
  res.json({
    invitations: invitations.map((invitation) => ({
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    })),
  })
})

export const createInvitation = asyncHandler(async (req, res) => {
  const { email, role } = req.validated.body
  if (await User.exists({ email })) {
    throw new ApiError(409, 'This email already has a Plenqora account. Remove it from its current workspace before inviting.', 'EMAIL_ALREADY_REGISTERED')
  }
  await Invitation.deleteMany({ workspaceId: req.workspace._id, email, acceptedAt: null })
  const token = crypto.randomBytes(32).toString('hex')
  const invitation = await Invitation.create({
    workspaceId: req.workspace._id,
    createdBy: req.user._id,
    email,
    role,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  const inviteUrl = new URL(`/signup?invite=${token}`, origin).toString()
  let delivery = isEmailConfigured() ? 'email' : 'manual'
  let emailWarning
  if (delivery === 'email') {
    try {
      await sendInvitationEmail(email, req.workspace.name, inviteUrl)
    } catch {
      delivery = 'manual'
      emailWarning = 'Invitation created, but the email could not be sent. Share the secure link manually.'
    }
  }
  res.status(201).json({
    invitation: {
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      inviteUrl,
      delivery,
      ...(emailWarning ? { emailWarning } : {}),
    },
  })
})

export const revokeInvitation = asyncHandler(async (req, res) => {
  const deleted = await Invitation.findOneAndDelete({
    _id: req.validated.params.invitationId,
    workspaceId: req.workspace._id,
    acceptedAt: null,
  })
  if (!deleted) throw new ApiError(404, 'Invitation not found.', 'INVITATION_NOT_FOUND')
  res.status(204).end()
})

export const resendInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findOne({
    _id: req.validated.params.invitationId,
    workspaceId: req.workspace._id,
    acceptedAt: null,
    expiresAt: { $gt: new Date() },
  })
  if (!invitation) throw new ApiError(404, 'Invitation not found or expired.', 'INVITATION_NOT_FOUND')
  const token = crypto.randomBytes(32).toString('hex')
  invitation.tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await invitation.save()
  const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  const inviteUrl = new URL(`/signup?invite=${token}`, origin).toString()
  let delivery = isEmailConfigured() ? 'email' : 'manual'
  let emailWarning
  if (delivery === 'email') {
    try {
      await sendInvitationEmail(invitation.email, req.workspace.name, inviteUrl)
    } catch {
      delivery = 'manual'
      emailWarning = 'Invitation link refreshed, but the email could not be sent. Share the new secure link manually.'
    }
  }
  res.json({
    invitation: {
      id: invitation._id.toString(),
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      inviteUrl,
      delivery,
      ...(emailWarning ? { emailWarning } : {}),
    },
  })
})

export const updateMemberRole = asyncHandler(async (req, res) => {
  const userId = req.validated.params.userId
  const { role } = req.validated.body
  const member = req.workspace.members.find((entry) => entry.user.equals(userId))
  if (!member) throw new ApiError(404, 'Workspace member not found.', 'MEMBER_NOT_FOUND')
  if (req.workspace.owner.equals(userId)) throw new ApiError(400, 'The workspace owner role cannot be changed.', 'OWNER_ROLE_LOCKED')
  if (member.role === 'Admin' && role !== 'Admin') {
    const admins = req.workspace.members.filter((entry) => entry.role === 'Admin')
    if (admins.length <= 1) throw new ApiError(400, 'The workspace must keep at least one admin.', 'LAST_ADMIN')
  }
  member.role = role
  await req.workspace.save()
  res.json({ member: { id: member.user.toString(), role: member.role } })
})

export const removeMember = asyncHandler(async (req, res) => {
  const userId = req.validated.params.userId
  const member = req.workspace.members.find((entry) => entry.user.equals(userId))
  if (!member) throw new ApiError(404, 'Workspace member not found.', 'MEMBER_NOT_FOUND')
  if (req.workspace.owner.equals(userId)) throw new ApiError(400, 'The workspace owner cannot be removed.', 'OWNER_LOCKED')
  if (member.role === 'Admin' && req.workspace.members.filter((entry) => entry.role === 'Admin').length <= 1) {
    throw new ApiError(400, 'The workspace must keep at least one admin.', 'LAST_ADMIN')
  }

  req.workspace.members = req.workspace.members.filter((entry) => !entry.user.equals(userId))
  await req.workspace.save()
  await Promise.all([
    Project.updateMany({ workspaceId: req.workspace._id }, { $pull: { members: userId } }),
    Project.updateMany(
      { workspaceId: req.workspace._id, owner: userId },
      { $set: { owner: req.user._id }, $addToSet: { members: req.user._id } },
    ),
    Issue.updateMany({ workspaceId: req.workspace._id, assignee: userId }, { $set: { assignee: null } }),
    User.deleteOne({ _id: userId }),
  ])
  res.status(204).end()
})
