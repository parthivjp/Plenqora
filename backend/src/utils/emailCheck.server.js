import { resolve4, resolveMx } from 'node:dns/promises'

const disposableDomains = [
  '10minutemail.com',
  'burnermail.io',
  'dispostable.com',
  'getnada.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'minuteinbox.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]
const blockedDomains = ['example.com', 'test.com']
const popularDomains = ['gmail.com', 'yahoo.com', 'hotmail.com']
const commonEndingTypos = new Set(['cmo', 'con', 'vom'])

function result(email, error = '', suggestion = null) {
  return { valid: !error, error, suggestion, email }
}

function levenshteinDistance(first, second) {
  const previous = Array.from({ length: second.length + 1 }, (_, index) => index)
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex]
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + substitutionCost,
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[second.length]
}

function suggestionFor(local, domain) {
  const ending = domain.split('.').at(-1)
  if (commonEndingTypos.has(ending)) {
    return `${local}@${domain.slice(0, -(ending.length + 1))}.com`
  }

  const closestDomain = popularDomains
    .map((popularDomain) => ({ domain: popularDomain, distance: levenshteinDistance(domain, popularDomain) }))
    .filter((entry) => entry.distance > 0 && entry.distance <= 2)
    .sort((first, second) => first.distance - second.distance)[0]
  return closestDomain ? `${local}@${closestDomain.domain}` : null
}

export function validateEmailFormat(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!email) return result(email, 'Enter your email address.')
  if (/\s/.test(email)) return result(email, 'Email address cannot contain spaces.')
  if (email.length > 254) return result(email, 'Email address must be 254 characters or fewer.')

  const atIndex = email.indexOf('@')
  if (atIndex < 0) return result(email, 'Email address must include an @ symbol.')
  if (atIndex !== email.lastIndexOf('@')) return result(email, 'Email address can only include one @ symbol.')

  const local = email.slice(0, atIndex)
  const domain = email.slice(atIndex + 1)
  if (!local || !domain) return result(email, 'Enter a valid email address.')
  if (local.length > 64) return result(email, 'The part before @ must be 64 characters or fewer.')
  if (email.includes('..')) return result(email, 'Email address cannot contain consecutive dots.')
  if (local.startsWith('.') || local.endsWith('.')) return result(email, 'Email address cannot start or end with a dot.')
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return result(email, 'Email address contains an invalid character.')
  }

  const labels = domain.split('.')
  if (labels.length < 2) return result(email, 'Email domain must include a dot.')
  if (labels.some((label) => !label)) return result(email, 'Email domain cannot start or end with a dot.')
  if (labels.some((label) => label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) {
    return result(email, 'Email domain contains an invalid character.')
  }

  const ending = labels[labels.length - 1]
  if (!/^[a-z]{2,63}$/.test(ending)) {
    return result(email, 'Email domain must end with a valid domain ending.')
  }

  if (blockedDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return result(email, 'Use an email domain that is not test.com or example.com.')
  }
  if (disposableDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return result(email, 'Disposable email addresses are not allowed.')
  }

  const suggestion = suggestionFor(local, domain)
  if (suggestion) return result(email, `Did you mean ${suggestion}?`, suggestion)
  return result(email)
}

function isTemporaryDnsError(error) {
  return ['EAI_AGAIN', 'ECONNREFUSED', 'EREFUSED', 'ESERVFAIL', 'ETIMEOUT'].includes(error?.code)
}

function lookupWithTimeout(lookup, domain, deadline) {
  const remaining = deadline - Date.now()
  if (remaining <= 0) return Promise.reject(Object.assign(new Error('DNS lookup timed out.'), { code: 'ETIMEOUT' }))

  let timer
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out.'), { code: 'ETIMEOUT' })), remaining)
  })
  return Promise.race([
    Promise.resolve().then(() => lookup(domain)),
    timeout,
  ]).finally(() => clearTimeout(timer))
}

export async function checkEmail(value, {
  resolveMxRecord = resolveMx,
  resolveARecord = resolve4,
  timeoutMs = 4000,
  skipDns = process.env.NODE_ENV === 'test',
} = {}) {
  const formatted = validateEmailFormat(value)
  if (!formatted.valid) return formatted
  if (skipDns) return formatted

  const domain = formatted.email.slice(formatted.email.lastIndexOf('@') + 1)
  const deadline = Date.now() + timeoutMs
  let mxError

  try {
    const records = await lookupWithTimeout(resolveMxRecord, domain, deadline)
    if (records.some((record) => record.exchange && record.exchange !== '.')) return formatted
    if (records.length > 0) {
      return result(formatted.email, 'This email domain does not accept email.')
    }
  } catch (error) {
    mxError = error
  }

  try {
    const records = await lookupWithTimeout(resolveARecord, domain, deadline)
    if (records.length > 0) return formatted
  } catch (error) {
    if (isTemporaryDnsError(mxError) || isTemporaryDnsError(error)) {
      return result(formatted.email, 'Could not verify the email domain. Please try again.')
    }
  }

  return result(formatted.email, 'This email domain does not appear to exist.')
}
