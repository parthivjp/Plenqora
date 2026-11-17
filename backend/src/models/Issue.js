import mongoose from 'mongoose'

const issueSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  number: { type: Number, required: true, min: 1 },
  key: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  type: { type: String, enum: ['Bug', 'Feature', 'Improvement', 'Design', 'Documentation'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  status: { type: String, enum: ['todo', 'progress', 'done'], required: true, index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

issueSchema.index({ projectId: 1, number: 1 }, { unique: true })
issueSchema.index({ workspaceId: 1, key: 1 }, { unique: true })
issueSchema.index({ projectId: 1, status: 1, priority: 1 })

export default mongoose.model('Issue', issueSchema)
