import assert from 'node:assert/strict'
import { test } from 'node:test'
import request from 'supertest'
import { checkEmail, validateEmailFormat } from '../src/utils/emailCheck.server.js'

process.env.NODE_ENV = 'test'
const { default: app } = await import('../src/app.js')

test('server email checks normalize addresses and share format rules', () => {
  assert.equal(validateEmailFormat(' Person@Example.ORG ').email, 'person@example.org')
  assert.equal(validateEmailFormat('person@@example.org').valid, false)
  assert.equal(validateEmailFormat('person@gmial.com').suggestion, 'person@gmail.com')
  assert.match(validateEmailFormat('person@yopmail.com').error, /Disposable/)
})

test('checks MX records and falls back to an A record', async () => {
  const mxResult = await checkEmail('person@mx.example.org', {
    resolveMxRecord: async () => [{ exchange: 'mail.example.org' }],
    resolveARecord: async () => [],
    skipDns: false,
  })
  assert.equal(mxResult.valid, true)

  let aRecordLookups = 0
  const aResult = await checkEmail('person@a.example.org', {
    resolveMxRecord: async () => { throw Object.assign(new Error('No MX record'), { code: 'ENODATA' }) },
    resolveARecord: async () => {
      aRecordLookups += 1
      return ['192.0.2.1']
    },
    skipDns: false,
  })
  assert.equal(aResult.valid, true)
  assert.equal(aRecordLookups, 1)
})

test('bounds DNS verification and rejects domains without MX or A records', async () => {
  const timeoutResult = await checkEmail('person@slow.example.org', {
    resolveMxRecord: () => new Promise(() => {}),
    resolveARecord: async () => [],
    timeoutMs: 5,
    skipDns: false,
  })
  assert.match(timeoutResult.error, /Could not verify/)

  const missingDomainResult = await checkEmail('person@missing.example.org', {
    resolveMxRecord: async () => { throw Object.assign(new Error('Not found'), { code: 'ENOTFOUND' }) },
    resolveARecord: async () => { throw Object.assign(new Error('Not found'), { code: 'ENOTFOUND' }) },
    skipDns: false,
  })
  assert.match(missingDomainResult.error, /does not appear to exist/)
})

test('email validation endpoint returns the validation result', async () => {
  const agent = request.agent(app)
  const csrfToken = (await agent.get('/api/auth/csrf').expect(200)).body.csrfToken
  const response = await agent.post('/api/validate-email')
    .set('X-CSRF-Token', csrfToken)
    .send({ email: 'person@yopmail.com' })
    .expect(200)

  assert.equal(response.body.valid, false)
  assert.match(response.body.error, /Disposable/)
  assert.equal(response.body.email, 'person@yopmail.com')
})
