function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function emailLayout({ preheader, title, content }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f4f8;font-family:Arial,Helvetica,sans-serif;color:#29263a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f4f8;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 0 18px 4px;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:8px;background-color:#654bd4;color:#ffffff;font-size:16px;font-weight:bold;vertical-align:middle;">P</span>
                <span style="padding-left:7px;color:#29263a;font-size:19px;font-weight:bold;letter-spacing:-0.5px;vertical-align:middle;">plenqora<span style="color:#654bd4;">.</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:0;background-color:#ffffff;border:1px solid #e9e6ef;border-radius:14px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:36px 36px 12px;">
                      <p style="margin:0 0 10px;color:#745fd0;font-size:11px;font-weight:bold;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(preheader)}</p>
                      <h1 style="margin:0;color:#29263a;font-size:25px;line-height:1.3;font-weight:700;letter-spacing:-0.5px;">${escapeHtml(title)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 36px 36px;color:#625e6d;font-size:15px;line-height:1.7;">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 8px 0;color:#8a8693;font-size:12px;line-height:1.6;">
                This is an automated message from Plenqora. Please do not share secure account links with anyone.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function callToAction(url, label) {
  const safeUrl = escapeHtml(url)
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
  <tr><td align="center" style="border-radius:8px;background-color:#654bd4;">
    <a href="${safeUrl}" style="display:inline-block;padding:13px 22px;border:1px solid #654bd4;border-radius:8px;color:#ffffff;font-size:14px;font-weight:bold;line-height:1.2;text-decoration:none;">${escapeHtml(label)}</a>
  </td></tr>
</table>
<p style="margin:20px 0 6px;color:#777382;font-size:12px;line-height:1.6;">If the button doesn’t work, copy and paste this link into your browser:</p>
<p style="margin:0;word-break:break-all;color:#654bd4;font-size:12px;line-height:1.6;"><a href="${safeUrl}" style="color:#654bd4;">${safeUrl}</a></p>`
}

export function createInvitationEmail(workspaceName, inviteUrl) {
  const safeWorkspaceName = escapeHtml(workspaceName)
  return {
    subject: `You're invited to join ${workspaceName} on Plenqora`,
    htmlContent: emailLayout({
      preheader: 'A new workspace invitation',
      title: 'You’re invited!',
      content: `<p style="margin:0;">You’ve been invited to join <strong style="color:#29263a;">${safeWorkspaceName}</strong> on Plenqora. Collaborate with your team and keep work moving in one place.</p>
${callToAction(inviteUrl, 'Accept invitation')}
<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #eeecf2;color:#777382;font-size:13px;">This invitation link expires in <strong>7 days</strong>. If you weren’t expecting this invitation, you can safely ignore this email.</p>`,
    }),
  }
}

export function createPasswordResetEmail(resetUrl) {
  return {
    subject: 'Reset your Plenqora password',
    htmlContent: emailLayout({
      preheader: 'Password reset requested',
      title: 'Reset your password',
      content: `<p style="margin:0;">We received a request to reset the password for your Plenqora account. Use the button below to choose a new password.</p>
${callToAction(resetUrl, 'Reset password')}
<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #eeecf2;color:#777382;font-size:13px;">For your security, this link expires in <strong>1 hour</strong> and can only be used once. If you didn’t request a reset, you can safely ignore this email.</p>`,
    }),
  }
}

export function createEmailVerificationEmail(verificationUrl) {
  return {
    subject: 'Verify your Plenqora email address',
    htmlContent: emailLayout({
      preheader: 'Verify your email address',
      title: 'Verify your email',
      content: `<p style="margin:0;">Click the button below to verify this email address and finish creating your Plenqora account.</p>
${callToAction(verificationUrl, 'Verify email address')}
<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #eeecf2;color:#777382;font-size:13px;">This link expires in <strong>30 minutes</strong> and can only be used once. If you didn’t start creating a Plenqora account, you can safely ignore this email.</p>`,
    }),
  }
}

export { escapeHtml }
