import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
  key: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 6 },
  description: { type: String, trim: true, maxlength: 240, default: '' },
  color: { type: String, default: 'violet' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  issueCounter: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true })

export default mongoose.model('Project', projectSchema)
