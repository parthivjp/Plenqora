import mongoose from 'mongoose'

const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

emailVerificationSchema.index({ email: 1 })

export default mongoose.model('EmailVerification', emailVerificationSchema)
