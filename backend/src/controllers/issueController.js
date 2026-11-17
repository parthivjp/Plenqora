import Comment from '../models/Comment.js'
import Issue from '../models/Issue.js'
import Project from '../models/Project.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { assertAssignee, findAccessibleProject, getIssueByKey, requireProjectRole } from '../services/access.js'
import { serializeIssue } from '../utils/serializers.js'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function serialize(issue) {
  const populated = await issue.populate('assignee', 'name')
  return serializeIssue(populated, populated.assignee)
}

export const listIssues = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  const { search, status, priority, assignee, sortBy = 'createdAt', order = 'desc' } = req.validated.query
  const filter = { projectId: project._id, workspaceId: project.workspaceId }
  if (status && status !== 'all') filter.status = status
  if (priority && priority !== 'all') filter.priority = priority
  if (assignee && assignee !== 'all') filter.assignee = assignee
  if (search) {
    const matcher = new RegExp(escapeRegex(search), 'i')
    filter.$or = [{ title: matcher }, { description: matcher }, { key: matcher }]
  }
  const issues = await Issue.find(filter)
    .sort(sortBy === 'priority' ? { _id: 1 } : { [sortBy]: order === 'asc' ? 1 : -1, _id: 1 })
    .populate('assignee', 'name')
  if (sortBy === 'priority') {
    const rank = { Low: 1, Medium: 2, High: 3 }
    issues.sort((left, right) => (rank[left.priority] - rank[right.priority]) * (order === 'asc' ? 1 : -1))
  }
  res.json({ issues: issues.map((issue) => serializeIssue(issue, issue.assignee)) })
})

export const createIssue = asyncHandler(async (req, res) => {
  const project = await findAccessibleProject(req.validated.params.projectId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager', 'Developer'])
  const body = req.validated.body
  const assignee = await assertAssignee(project, body.assigneeId)
  const nextProject = await Project.findOneAndUpdate(
    { _id: project._id, workspaceId: project.workspaceId },
    { $inc: { issueCounter: 1 } },
    { returnDocument: 'after', projection: { key: 1, issueCounter: 1 } },
  )
  const issue = await Issue.create({
    workspaceId: project.workspaceId,
    projectId: project._id,
    number: nextProject.issueCounter,
    key: `${nextProject.key}-${nextProject.issueCounter}`,
    title: body.title,
    description: body.description,
    type: body.type,
    priority: body.priority,
    status: body.status,
    assignee,
    createdBy: req.user._id,
  })
  res.status(201).json({ issue: await serialize(issue) })
})

export const updateIssue = asyncHandler(async (req, res) => {
  const { issue, project } = await getIssueByKey(req.validated.params.issueId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager', 'Developer'])
  const body = req.validated.body
  if (Object.hasOwn(body, 'assigneeId')) issue.assignee = await assertAssignee(project, body.assigneeId)
  for (const field of ['title', 'description', 'type', 'priority', 'status']) {
    if (Object.hasOwn(body, field)) issue[field] = body[field]
  }
  await issue.save()
  res.json({ issue: await serialize(issue) })
})

export const deleteIssue = asyncHandler(async (req, res) => {
  const { issue, project } = await getIssueByKey(req.validated.params.issueId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager'])
  await Promise.all([
    issue.deleteOne(),
    Comment.deleteMany({ issueId: issue._id }),
  ])
  res.status(204).end()
})
