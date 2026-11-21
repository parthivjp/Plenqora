import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cookieSettings } from '../src/middleware/csrf.js'

test('production cookies default to cross-site secure settings', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousSameSite = process.env.COOKIE_SAME_SITE
  process.env.NODE_ENV = 'production'
  delete process.env.COOKIE_SAME_SITE

  try {
    const settings = cookieSettings()
    assert.equal(settings.sameSite, 'none')
    assert.equal(settings.secure, true)
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousSameSite === undefined) delete process.env.COOKIE_SAME_SITE
    else process.env.COOKIE_SAME_SITE = previousSameSite
  }
})

test('local cookies retain the lax default', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousSameSite = process.env.COOKIE_SAME_SITE
  process.env.NODE_ENV = 'development'
  delete process.env.COOKIE_SAME_SITE

  try {
    const settings = cookieSettings()
    assert.equal(settings.sameSite, 'lax')
    assert.equal(settings.secure, false)
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousNodeEnv
    if (previousSameSite === undefined) delete process.env.COOKIE_SAME_SITE
    else process.env.COOKIE_SAME_SITE = previousSameSite
  }
})
