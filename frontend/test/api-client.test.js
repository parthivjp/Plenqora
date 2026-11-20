import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiGet, parseResponse } from '../src/api/client.js'

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
