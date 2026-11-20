import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isEmailConfigured, sendEmail } from '../src/services/mailer.js'

test('email delivery uses the Resend HTTPS API when configured', async () => {
  const keys = ['RESEND_API_KEY', 'RESEND_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  const originalFetch = globalThis.fetch
  let request
  Object.assign(process.env, {
    RESEND_API_KEY: 'test-resend-key',
    RESEND_FROM: 'Plenqora <invites@example.test>',
    SMTP_HOST: '',
    SMTP_PORT: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_FROM: '',
  })
  globalThis.fetch = async (url, options) => {
    request = { url, options }
    return new Response(JSON.stringify({ id: 'test-email-id' }), { status: 200 })
  }

  try {
    assert.equal(isEmailConfigured(), true)
    await sendEmail({
      to: 'teammate@example.test',
      subject: 'Workspace invitation',
      text: 'Use the secure link to join.',
    })
    assert.equal(request.url, 'https://api.resend.com/emails')
    assert.equal(request.options.method, 'POST')
    assert.equal(request.options.headers.Authorization, 'Bearer test-resend-key')
    assert.deepEqual(JSON.parse(request.options.body), {
      from: 'Plenqora <invites@example.test>',
      to: ['teammate@example.test'],
      subject: 'Workspace invitation',
      text: 'Use the secure link to join.',
    })
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) process.env[key] = previous[key] ?? ''
  }
})

test('Resend API rejection surfaces a delivery error', async () => {
  const keys = ['RESEND_API_KEY', 'RESEND_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM']
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  const originalFetch = globalThis.fetch
  Object.assign(process.env, {
    RESEND_API_KEY: 'test-resend-key',
    RESEND_FROM: 'Plenqora <invites@example.test>',
    SMTP_HOST: '',
    SMTP_PORT: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_FROM: '',
  })
  globalThis.fetch = async () => new Response('', { status: 403 })

  try {
    await assert.rejects(
      sendEmail({ to: 'teammate@example.test', subject: 'Invite', text: 'Join.' }),
      /Resend email API returned HTTP 403/,
    )
  } finally {
    globalThis.fetch = originalFetch
    for (const key of keys) process.env[key] = previous[key] ?? ''
  }
})
