import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Developer', 'Viewer'], required: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false })

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 240, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [memberSchema], default: [] },
}, { timestamps: true })

workspaceSchema.index({ 'members.user': 1 }, { unique: true })

export default mongoose.model('Workspace', workspaceSchema)
