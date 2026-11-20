import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiGet, parseResponse, subscribeToWorkspaceUpdates } from '../src/api/client.js'

test('a successful response with malformed JSON becomes a readable API error', async () => {
  const response = new Response('Unexpected end of JSON input', {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(parseResponse(response), (error) => {
    assert.equal(error.code, 'INVALID_SERVER_RESPONSE')
    assert.equal(error.title, 'Unexpected server response')
    assert.match(error.message, /server sent a response the app could not read/i)
    assert.doesNotMatch(error.message, /Unexpected end of JSON input/)
    return true
  })
})

test('an empty error response is reported with a useful server error label', async () => {
  const response = new Response('', { status: 503 })

  await assert.rejects(parseResponse(response), (error) => {
    assert.equal(error.status, 503)
    assert.match(error.message, /Server temporarily unavailable/)
    assert.match(error.message, /server had a problem processing your request/i)
    return true
  })
})

test('structured API errors retain their user-facing title and reason', async () => {
  const response = new Response(JSON.stringify({
    error: {
      code: 'VALIDATION_ERROR',
      title: 'Please check your information',
      message: 'Enter a valid email address.',
    },
  }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(parseResponse(response), (error) => {
    assert.match(error.message, /^Please check your information: Enter a valid email address\.$/)
    assert.equal(error.code, 'VALIDATION_ERROR')
    assert.equal(error.title, 'Please check your information')
    assert.equal(error.reason, 'Enter a valid email address.')
    return true
  })
})

test('workspace export API errors have a feature-specific title', async () => {
  const response = new Response(JSON.stringify({
    error: {
      code: 'WORKSPACE_EXPORT_FAILED',
      message: 'Workspace data could not be exported. Please try again.',
    },
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })

  await assert.rejects(parseResponse(response), (error) => {
    assert.equal(error.title, 'Workspace export failed')
    assert.equal(error.reason, 'Workspace data could not be exported. Please try again.')
    return true
  })
})

test('a connection failure explains how to recover without exposing browser details', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch')
  }

  try {
    await assert.rejects(apiGet('/health'), (error) => {
      assert.equal(error.code, 'API_UNAVAILABLE')
      assert.match(error.message, /^Can’t connect to Plenqora:/)
      assert.match(error.message, /Check that the backend is running/)
      assert.doesNotMatch(error.message, /Failed to fetch/)
      return true
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('workspace event subscription listens for updates and closes cleanly', () => {
  const OriginalEventSource = globalThis.EventSource
  let instance
  class TestEventSource {
    constructor(url, options) {
      this.url = url
      this.options = options
      this.listeners = new Map()
      this.closed = false
      instance = this
    }

    addEventListener(name, callback) {
      this.listeners.set(name, callback)
    }

    close() {
      this.closed = true
    }
  }
  globalThis.EventSource = TestEventSource

  try {
    let updateCount = 0
    const unsubscribe = subscribeToWorkspaceUpdates(() => { updateCount += 1 })
    assert.equal(instance.url, '/api/workspace/events')
    assert.deepEqual(instance.options, { withCredentials: true })
    instance.listeners.get('workspace.updated')()
    assert.equal(updateCount, 1)
    unsubscribe()
    assert.equal(instance.closed, true)
  } finally {
    globalThis.EventSource = OriginalEventSource
  }
})
