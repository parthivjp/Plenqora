import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export function validatePasswordLength(password) {
  return Buffer.byteLength(password, 'utf8') <= 72
}

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}
