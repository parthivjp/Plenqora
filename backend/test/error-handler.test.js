import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import { test } from 'node:test'
import ApiError from '../src/utils/ApiError.js'
import { errorHandler } from '../src/middleware/errorHandler.js'

test('malformed JSON receives a structured, user-readable error', async () => {
  const app = express()
  app.use(express.json())
  app.post('/submit', (req, res) => res.json(req.body))
  app.use(errorHandler)

  const response = await request(app)
    .post('/submit')
    .set('Content-Type', 'application/json')
    .send('{"name":')
    .expect(400)

  assert.equal(response.body.error.code, 'INVALID_JSON')
  assert.equal(response.body.error.title, 'Request could not be read')
  assert.match(response.body.error.message, /invalid JSON/i)
})

test('unexpected server errors get a safe message while details are logged', async () => {
  const app = express()
  app.get('/fail', () => {
    throw new Error('internal database details')
  })
  app.use(errorHandler)

  const originalConsoleError = console.error
  console.error = () => {}
  try {
    const response = await request(app).get('/fail').expect(500)
    assert.equal(response.body.error.code, 'INTERNAL_SERVER_ERROR')
    assert.equal(response.body.error.title, 'Something went wrong')
    assert.match(response.body.error.message, /server had a problem processing/i)
    assert.doesNotMatch(JSON.stringify(response.body), /internal database details/)
  } finally {
    console.error = originalConsoleError
  }
})

test('workspace export failures use a feature-specific error label', async () => {
  const app = express()
  app.get('/api/workspace/export', () => {
    throw new ApiError(500, 'Workspace data could not be exported. Please try again.', 'WORKSPACE_EXPORT_FAILED')
  })
  app.use(errorHandler)

  const response = await request(app).get('/api/workspace/export').expect(500)
  assert.equal(response.body.error.code, 'WORKSPACE_EXPORT_FAILED')
  assert.equal(response.body.error.title, 'Workspace export failed')
  assert.equal(response.body.error.message, 'Workspace data could not be exported. Please try again.')
})
