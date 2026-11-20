import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateEmail } from '../src/utils/emailValidator.js'

test('normalizes valid email addresses', () => {
  assert.deepEqual(validateEmail('  Taylor.Morgan+work@GMAIL.COM  '), {
    valid: true,
    error: '',
    suggestion: null,
    email: 'taylor.morgan+work@gmail.com',
  })
})

test('rejects malformed, oversized, and blocked email addresses', () => {
  const invalidEmails = [
    ['', 'Enter your email address.'],
    ['name with space@example.com', 'Email address cannot contain spaces.'],
    ['missing-at.example.com', 'Email address must include an @ symbol.'],
    ['name@@example.org', 'Email address can only include one @ symbol.'],
    ['first..last@example.org', 'Email address cannot contain consecutive dots.'],
    ['.first@example.org', 'Email address cannot start or end with a dot.'],
    ['last.@example.org', 'Email address cannot start or end with a dot.'],
    ['person@localhost', 'Email domain must include a dot.'],
    ['person@example.com', 'Use an email domain that is not test.com or example.com.'],
    ['person@mailinator.com', 'Disposable email addresses are not allowed.'],
  ]

  for (const [email, expectedError] of invalidEmails) {
    assert.equal(validateEmail(email).error, expectedError)
  }

  assert.match(validateEmail(`${'a'.repeat(65)}@example.org`).error, /64 characters/)
  assert.match(validateEmail(`${'a'.repeat(246)}@example.org`).error, /254 characters/)
  assert.match(validateEmail('person@bad_domain.org').error, /invalid character/)
})

test('suggests corrections for common domain misspellings and endings', () => {
  for (const [email, suggestion] of [
    ['person@gmial.com', 'person@gmail.com'],
    ['person@gmal.com', 'person@gmail.com'],
    ['person@yaho.com', 'person@yahoo.com'],
    ['person@hotmial.com', 'person@hotmail.com'],
    ['person@example.con', 'person@example.com'],
    ['person@example.cmo', 'person@example.com'],
    ['person@example.vom', 'person@example.com'],
  ]) {
    const validation = validateEmail(email)
    assert.equal(validation.valid, false)
    assert.equal(validation.suggestion, suggestion)
    assert.match(validation.error, /Did you mean/)
  }
})
