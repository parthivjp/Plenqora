const BREVO_EMAIL_API_URL = 'https://api.brevo.com/v3/smtp/email'
const BREVO_TIMEOUT_MS = 10_000

function missingBrevoSettings() {
  return ['BREVO_API_KEY', 'BREVO_FROM'].filter((key) => !process.env[key]?.trim())
}

export function isEmailConfigured() {
  const missing = missingBrevoSettings()
  if (missing.length) {
    console.error(`[api] Brevo email is not configured; missing ${missing.join(', ')}.`)
    return false
  }
  return true
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

export async function sendEmail({ to, subject, htmlContent }) {
  const missing = missingBrevoSettings()
  if (missing.length) {
    const message = `Brevo email is not configured; missing ${missing.join(', ')}.`
    console.error(`[api] ${message}`)
    throw new Error(message)
  }
  if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
    throw new Error('Brevo email content must be a non-empty HTML string.')
  }

  let response
  try {
    response = await fetch(BREVO_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Plenqora', email: process.env.BREVO_FROM },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    })
  } catch (error) {
    console.error('[api] Brevo email request failed before receiving a response', error)
    throw error
  }

  if (!response.ok) {
    let responseBody
    try {
      responseBody = await response.text()
    } catch (error) {
      responseBody = `Unable to read Brevo response body: ${error.message}`
    }
    console.error(`[api] Brevo email request failed with HTTP ${response.status}: ${responseBody}`)
    throw new Error(`Brevo email API returned HTTP ${response.status}.`)
  }
}
