import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isEmailConfigured, sendEmail } from '../src/services/mailer.js'
import { createEmailVerificationEmail, createInvitationEmail, createPasswordResetEmail, escapeHtml } from '../src/services/emailTemplates.js'

const emailEnvironmentKeys = ['BREVO_API_KEY', 'BREVO_FROM']

function saveEmailEnvironment() {
  return Object.fromEntries(emailEnvironmentKeys.map((key) => [key, process.env[key]]))
}

function restoreEmailEnvironment(previous) {
  for (const key of emailEnvironmentKeys) process.env[key] = previous[key] ?? ''
}

test('email delivery uses Brevo HTTPS API with the expected payload', async () => {
  const previous = saveEmailEnvironment()
  const originalFetch = globalThis.fetch
  let request
  Object.assign(process.env, {
    BREVO_API_KEY: 'test-brevo-key',
    BREVO_FROM: 'invites@example.test',
  })
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ messageId: 'test-message-id' }), { status: 201 })
  }

  try {
    assert.equal(isEmailConfigured(), true)
    await sendEmail({
      to: 'teammate@example.test',
      subject: 'Workspace invitation',
      htmlContent: '<p>Use the secure link to join.</p>',
    })
    assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email')
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.headers['api-key'], 'test-brevo-key')
    assert.equal(request.options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(request.options.body), {
      sender: { name: 'Plenqora', email: 'invites@example.test' },
      to: [{ email: 'teammate@example.test' }],
      subject: 'Workspace invitation',
      htmlContent: '<p>Use the secure link to join.</p>',
    })
  } finally {
    globalThis.fetch = originalFetch
    restoreEmailEnvironment(previous)
  }
})

test('missing Brevo settings are logged and prevent a request', async () => {
  const previous = saveEmailEnvironment()
  const originalFetch = globalThis.fetch
  const originalConsoleError = console.error
  const loggedErrors = []
  Object.assign(process.env, { BREVO_API_KEY: '', BREVO_FROM: '' })
  globalThis.fetch = async () => {
    throw new Error('Brevo must not be called without credentials.')
  }
  console.error = (...args) => loggedErrors.push(args.join(' '))

  try {
    assert.equal(isEmailConfigured(), false)
    await assert.rejects(
      sendEmail({ to: 'teammate@example.test', subject: 'Invite', htmlContent: '<p>Join.</p>' }),
      /missing BREVO_API_KEY, BREVO_FROM/,
    )
    assert(loggedErrors.some((entry) => entry.includes('missing BREVO_API_KEY, BREVO_FROM')))
  } finally {
    globalThis.fetch = originalFetch
    console.error = originalConsoleError
    restoreEmailEnvironment(previous)
  }
})

test('Brevo rejection logs HTTP status and response body', async () => {
  const previous = saveEmailEnvironment()
  const originalFetch = globalThis.fetch
  const originalConsoleError = console.error
  const loggedErrors = []
  Object.assign(process.env, {
    BREVO_API_KEY: 'test-brevo-key',
    BREVO_FROM: 'invites@example.test',
  })
  globalThis.fetch = async () => new Response('{"code":"unauthorized","message":"Invalid API key"}', { status: 401 })
  console.error = (...args) => loggedErrors.push(args.join(' '))

  try {
    await assert.rejects(
      sendEmail({ to: 'teammate@example.test', subject: 'Invite', htmlContent: '<p>Join.</p>' }),
      /Brevo email API returned HTTP 401/,
    )
    assert(loggedErrors.some((entry) => entry.includes('HTTP 401') && entry.includes('Invalid API key')))
  } finally {
    globalThis.fetch = originalFetch
    console.error = originalConsoleError
    restoreEmailEnvironment(previous)
  }
})

test('email HTML values are escaped before insertion into templates', () => {
  assert.equal(escapeHtml(`<script a="b">Tom & Jerry's</script>`), '&lt;script a=&quot;b&quot;&gt;Tom &amp; Jerry&#39;s&lt;/script&gt;')
})

test('invitation email has branded layout, clear action, expiry, and escaped dynamic values', () => {
  const email = createInvitationEmail('<Research & Design>', 'https://example.test/signup?invite=abc&next=home')
  assert.equal(email.subject, "You're invited to join <Research & Design> on Plenqora")
  assert.match(email.htmlContent, /plenqora<span/)
  assert.match(email.htmlContent, /You’re invited!/)
  assert.match(email.htmlContent, /Accept invitation/)
  assert.match(email.htmlContent, /expires in <strong>7 days<\/strong>/)
  assert.match(email.htmlContent, /&lt;Research &amp; Design&gt;/)
  assert.match(email.htmlContent, /invite=abc&amp;next=home/)
})

test('password reset email clearly states the action and one-hour expiry', () => {
  const email = createPasswordResetEmail('https://example.test/reset-password?token=abc')
  assert.equal(email.subject, 'Reset your Plenqora password')
  assert.match(email.htmlContent, /Reset your password/)
  assert.match(email.htmlContent, /Reset password/)
  assert.match(email.htmlContent, /expires in <strong>1 hour<\/strong>/)
  assert.match(email.htmlContent, /can only be used once/)
})

test('email verification message includes a secure signup link and expiry', () => {
  const email = createEmailVerificationEmail('https://plenqora.example/signup?verify=token')
  assert.match(email.subject, /verify/i)
  assert.match(email.htmlContent, /Verify email address/)
  assert.match(email.htmlContent, /30 minutes/)
  assert.match(email.htmlContent, /https:\/\/plenqora\.example\/signup\?verify=token/)
})
