import Comment from '../models/Comment.js'
import Issue from '../models/Issue.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { getIssueByKey, requireProjectRole } from '../services/access.js'

function serializeComment(comment) {
  return {
    id: comment._id.toString(),
    issueId: comment.issueId.toString(),
    parentId: comment.parentId?.toString() ?? null,
    text: comment.text,
    author: {
      id: comment.author?._id.toString() ?? null,
      name: comment.author?.name ?? comment.authorName,
    },
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  }
}

export const listComments = asyncHandler(async (req, res) => {
  const { issue, project } = await getIssueByKey(req.validated.params.issueId, req.user)
  await requireProjectRole(project, req.user, [])
  const comments = await Comment.find({ issueId: issue._id })
    .sort({ createdAt: 1 })
    .populate('author', 'name')
  res.json({ comments: comments.map(serializeComment) })
})

export const createComment = asyncHandler(async (req, res) => {
  const { issue, project } = await getIssueByKey(req.validated.params.issueId, req.user)
  await requireProjectRole(project, req.user, ['Admin', 'Manager', 'Developer'])
  const { text, parentId } = req.validated.body
  if (parentId) {
    const parent = await Comment.findOne({ _id: parentId, issueId: issue._id })
    if (!parent) throw new ApiError(400, 'Replies must refer to a comment on this issue.', 'INVALID_COMMENT_PARENT')
  }
  const comment = await Comment.create({
    workspaceId: issue.workspaceId,
    projectId: issue.projectId,
    issueId: issue._id,
    author: req.user._id,
    authorName: req.user.name,
    parentId: parentId ?? null,
    text,
  })
  await comment.populate('author', 'name')
  res.status(201).json({ comment: serializeComment(comment) })
})

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.validated.params.commentId,
    workspaceId: req.user.workspaceId,
  }).populate('author', 'name')
  if (!comment) throw new ApiError(404, 'Comment not found.', 'COMMENT_NOT_FOUND')
  const issue = await Issue.findById(comment.issueId).select('key')
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND')
  const { project } = await getIssueByKey(issue.key, req.user)
  const { member } = await requireProjectRole(project, req.user, [])
  if (!comment.author?._id.equals(req.user._id) && !['Admin', 'Manager'].includes(member.role)) {
    throw new ApiError(403, 'You can only edit your own comments.', 'PERMISSION_DENIED')
  }
  comment.text = req.validated.body.text
  await comment.save()
  res.json({ comment: serializeComment(comment) })
})

export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({
    _id: req.validated.params.commentId,
    workspaceId: req.user.workspaceId,
  }).populate('author', 'name')
  if (!comment) throw new ApiError(404, 'Comment not found.', 'COMMENT_NOT_FOUND')
  const issue = await Issue.findById(comment.issueId).select('key')
  if (!issue) throw new ApiError(404, 'Issue not found.', 'ISSUE_NOT_FOUND')
  const { project } = await getIssueByKey(issue.key, req.user)
  const { member } = await requireProjectRole(project, req.user, [])
  if (!comment.author?._id.equals(req.user._id) && !['Admin', 'Manager'].includes(member.role)) {
    throw new ApiError(403, 'You can only remove your own comments.', 'PERMISSION_DENIED')
  }
  await comment.deleteOne()
  res.status(204).end()
})
