import nodemailer from 'nodemailer'

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASSWORD
    && process.env.SMTP_FROM,
  )
}

export async function sendEmail({ to, subject, text }) {
  if (!isEmailConfigured()) throw new Error('SMTP email settings are incomplete.')
  const port = Number(process.env.SMTP_PORT)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text })
}
