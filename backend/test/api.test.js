import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-only-jwt-secret-with-more-than-thirty-two-characters'
process.env.MONGODB_URI = `mongodb://127.0.0.1:27017/plenqora_test_${process.pid}_${Date.now()}`
process.env.FRONTEND_ORIGIN = 'http://localhost:5173'

const [{ default: app }, { default: mongoose }] = await Promise.all([
  import('../src/app.js'),
  import('mongoose'),
])

let server
let admin
let adminCsrf
let project
let issue
let viewer
let viewerCsrf

async function authenticatedAgent() {
  const agent = request.agent(server)
  const response = await agent.get('/api/auth/csrf').expect(200)
  return { agent, csrf: response.body.csrfToken }
}

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  server = app.listen(0)
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('auth, workspace isolation, project and issue permissions, and comments', async () => {
  const ownerSession = await authenticatedAgent()
  admin = ownerSession.agent
  adminCsrf = ownerSession.csrf

  const registration = await admin.post('/api/auth/register')
    .set('X-CSRF-Token', adminCsrf)
    .send({ name: 'Workspace Owner', email: 'owner@example.test', password: 'StrongPassword123' })
    .expect(201)
  assert.equal(registration.body.user.role, 'Admin')
  assert.equal((await admin.get('/api/auth/me').expect(200)).body.user.email, 'owner@example.test')

  const projectResponse = await admin.post('/api/projects')
    .set('X-CSRF-Token', adminCsrf)
    .send({ name: 'Plenqora API', key: 'PLN', description: 'API test project' })
    .expect(201)
  project = projectResponse.body.project
  await admin.patch(`/api/projects/${project.id}`)
    .set('X-CSRF-Token', adminCsrf)
    .send({ name: 'Updated API Project', description: 'Updated by an admin' })
    .expect(200)

  const issueResponse = await admin.post(`/api/projects/${project.id}/issues`)
    .set('X-CSRF-Token', adminCsrf)
    .send({
      title: 'Build protected API',
      description: 'Validate the project issue workflow.',
      type: 'Feature',
      priority: 'High',
      status: 'todo',
    })
    .expect(201)
  issue = issueResponse.body.issue
  assert.equal(issue.id, 'PLN-1')
  await admin.post(`/api/projects/${project.id}/issues`)
    .set('X-CSRF-Token', adminCsrf)
    .send({
      title: 'Document API responses',
      description: 'Add a short guide to API response payloads.',
      type: 'Documentation',
      priority: 'Low',
      status: 'todo',
    })
    .expect(201)
  const sortedIssues = await admin.get(`/api/projects/${project.id}/issues?sortBy=priority&order=desc`).expect(200)
  assert.deepEqual(sortedIssues.body.issues.map((entry) => entry.priority), ['High', 'Low'])

  const commentResponse = await admin.post(`/api/issues/${issue.id}/comments`)
    .set('X-CSRF-Token', adminCsrf)
    .send({ text: 'First comment' })
    .expect(201)
  await admin.post(`/api/issues/${issue.id}/comments`)
    .set('X-CSRF-Token', adminCsrf)
    .send({ text: 'Threaded reply', parentId: commentResponse.body.comment.id })
    .expect(201)
  const commentsResponse = await admin.get(`/api/issues/${issue.id}/comments`).expect(200)
  assert.equal(commentsResponse.body.comments.length, 2)

  await admin.post('/api/auth/forgot-password')
    .set('X-CSRF-Token', adminCsrf)
    .send({ email: 'owner@example.test' })
    .expect(503)

  const invitationResponse = await admin.post('/api/workspace/invitations')
    .set('X-CSRF-Token', adminCsrf)
    .send({ email: 'viewer@example.test', role: 'Viewer' })
    .expect(201)
  const invitationToken = new URL(invitationResponse.body.invitation.inviteUrl).searchParams.get('invite')
  const viewerSession = await authenticatedAgent()
  viewer = viewerSession.agent
  viewerCsrf = viewerSession.csrf
  const viewerRegistration = await viewer.post('/api/auth/register')
    .set('X-CSRF-Token', viewerCsrf)
    .send({
      name: 'Read Only',
      email: 'viewer@example.test',
      password: 'StrongPassword123',
      invitationToken,
    })
    .expect(201)
  assert.equal(viewerRegistration.body.user.role, 'Viewer')
  const viewerId = viewerRegistration.body.user.id
  assert.equal((await viewer.get(`/api/projects/${project.id}/issues`).expect(200)).body.issues.length, 2)

  await viewer.post(`/api/projects/${project.id}/issues`)
    .set('X-CSRF-Token', viewerCsrf)
    .send({
      title: 'Viewer should not create',
      description: 'This mutation should be denied.',
      type: 'Bug',
      priority: 'Low',
      status: 'todo',
    })
    .expect(403)

  await admin.delete(`/api/workspace/members/${registration.body.user.id}`)
    .set('X-CSRF-Token', adminCsrf)
    .expect(400)
  await viewer.get(`/api/issues/${issue.id}/comments`).expect(200)
  await admin.delete(`/api/workspace/members/${viewerId}`)
    .set('X-CSRF-Token', adminCsrf)
    .expect(204)
  await viewer.get('/api/auth/me').expect(401)
  const reinvite = await admin.post('/api/workspace/invitations')
    .set('X-CSRF-Token', adminCsrf)
    .send({ email: 'viewer@example.test', role: 'Developer' })
    .expect(201)
  await admin.delete(`/api/workspace/invitations/${reinvite.body.invitation.id}`)
    .set('X-CSRF-Token', adminCsrf)
    .expect(204)

  await admin.patch(`/api/issues/${issue.id}`)
    .set('X-CSRF-Token', adminCsrf)
    .send({ status: 'unknown' })
    .expect(400)
  await admin.post('/api/projects')
    .send({ name: 'Missing CSRF', key: 'BAD' })
    .expect(403)
  assert.equal((await admin.get(`/api/projects/${project.id}/issues?status=todo`).expect(200)).body.issues.length, 2)

  const outsiderSession = await authenticatedAgent()
  const outsider = outsiderSession.agent
  const outsiderCsrf = outsiderSession.csrf
  await outsider.post('/api/auth/register')
    .set('X-CSRF-Token', outsiderCsrf)
    .send({ name: 'Other Owner', email: 'other@example.test', password: 'StrongPassword123' })
    .expect(201)
  const outsiderProject = await outsider.post('/api/projects')
    .set('X-CSRF-Token', outsiderCsrf)
    .send({ name: 'Separate API Project', key: 'PLN', description: '' })
    .expect(201)
  await outsider.post(`/api/projects/${outsiderProject.body.project.id}/issues`)
    .set('X-CSRF-Token', outsiderCsrf)
    .send({
      title: 'Same project key isolated',
      description: 'Issue keys are scoped to a workspace.',
      type: 'Bug',
      priority: 'Low',
      status: 'todo',
    })
    .expect(201)
  await outsider.get(`/api/projects/${project.id}`).expect(404)
  await admin.post('/api/auth/logout')
    .set('X-CSRF-Token', adminCsrf)
    .expect(204)
  await admin.get('/api/auth/me').expect(401)
})
