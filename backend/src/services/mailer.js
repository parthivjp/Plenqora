import nodemailer from 'nodemailer'

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)
}

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASSWORD
    && process.env.SMTP_FROM,
  )
}

export function isEmailConfigured() {
  return isResendConfigured() || isSmtpConfigured()
}

export async function sendEmail({ to, subject, text }) {
  if (isResendConfigured()) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Resend email API returned HTTP ${response.status}.`)
    return
  }

  if (!isSmtpConfigured()) throw new Error('Email settings are incomplete.')
  const port = Number(process.env.SMTP_PORT)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  })
  try {
    await transport.verify()
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    })
  } finally {
    transport.close()
  }
}
