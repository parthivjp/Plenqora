import express from 'express'
import authenticate from '../middleware/authenticate.js'
import validate from '../middleware/validate.js'
import * as issues from '../controllers/issueController.js'
import * as comments from '../controllers/commentController.js'
import { createCommentBody, commentParams, issueCommentParams, updateCommentBody } from '../validators/comment.js'
import { createIssueBody, issueParams, issueQuery, projectIssueParams, updateIssueBody } from '../validators/issue.js'

const projectRouter = express.Router({ mergeParams: true })
projectRouter.use(authenticate, validate({ params: projectIssueParams }))
projectRouter.get('/', validate({ query: issueQuery }), issues.listIssues)
projectRouter.post('/', validate({ body: createIssueBody }), issues.createIssue)

const router = express.Router()
router.use(authenticate)
router.patch('/:issueId', validate({ params: issueParams, body: updateIssueBody }), issues.updateIssue)
router.delete('/:issueId', validate({ params: issueParams }), issues.deleteIssue)
router.get('/:issueId/comments', validate({ params: issueCommentParams }), comments.listComments)
router.post('/:issueId/comments', validate({ params: issueCommentParams, body: createCommentBody }), comments.createComment)
router.patch('/comments/:commentId', validate({ params: commentParams, body: updateCommentBody }), comments.updateComment)
router.delete('/comments/:commentId', validate({ params: commentParams }), comments.deleteComment)

export { projectRouter }
export default router
