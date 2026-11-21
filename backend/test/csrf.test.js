import { test } from 'node:test'
import assert from 'node:assert/strict'
import csrfProtection, { cookieSettings } from '../src/middleware/csrf.js'

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

test('CSRF validation accepts a token from the configured frontend without third-party cookies', () => {
  const previousFrontendOrigin = process.env.FRONTEND_ORIGIN
  process.env.FRONTEND_ORIGIN = 'https://plenqora.vercel.app,https://preview.example.test'

  try {
    let error
    csrfProtection({
      method: 'POST',
      cookies: {},
      get: (name) => name === 'origin' ? 'https://plenqora.vercel.app' : 'csrf-token',
    }, {}, (nextError) => { error = nextError })
    assert.equal(error, undefined)
  } finally {
    if (previousFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN
    else process.env.FRONTEND_ORIGIN = previousFrontendOrigin
  }
})

test('CSRF validation still rejects requests from untrusted origins', () => {
  const previousFrontendOrigin = process.env.FRONTEND_ORIGIN
  process.env.FRONTEND_ORIGIN = 'https://plenqora.vercel.app'

  try {
    let error
    csrfProtection({
      method: 'POST',
      cookies: {},
      get: (name) => name === 'origin' ? 'https://attacker.example' : 'csrf-token',
    }, {}, (nextError) => { error = nextError })
    assert.equal(error?.status, 403)
    assert.equal(error?.code, 'CSRF_VALIDATION_FAILED')
  } finally {
    if (previousFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN
    else process.env.FRONTEND_ORIGIN = previousFrontendOrigin
  }
})
