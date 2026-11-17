import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true, trim: true, maxlength: 80 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  text: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
}, { timestamps: true })

export default mongoose.model('Comment', commentSchema)
