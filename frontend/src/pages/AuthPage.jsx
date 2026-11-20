import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import PasswordInput from '../components/PasswordInput'
import { validateEmail } from '../utils/emailValidator'
import './AuthPage.css'

function isStrongPassword(password) {
  return password.length >= 12
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && new TextEncoder().encode(password).length <= 72
}

export default function AuthPage({
  mode,
  onNavigate,
  onLogin,
  onRegister,
  onRequestPasswordReset,
  onRequestEmailVerification,
  onResetPassword,
  onValidateEmailVerification,
  onValidateResetToken,
  connectionError,
  connectionErrorTitle,
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [emailValidation, setEmailValidation] = useState(null)
  const [error, setError] = useState('')
  const [errorTitle, setErrorTitle] = useState('')
  const [success, setSuccess] = useState('')
  const [successTitle, setSuccessTitle] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [verificationUrl, setVerificationUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const search = new URLSearchParams(window.location.search)
  const invitationToken = search.get('invite') || ''
  const resetToken = search.get('token') || ''
  const emailVerificationToken = search.get('verify') || ''
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot-password'
  const isReset = mode === 'reset-password'
  const [resetStatus, setResetStatus] = useState(isReset && resetToken ? 'checking' : isReset ? 'invalid' : 'idle')
  const [emailVerification, setEmailVerification] = useState({
    token: emailVerificationToken,
    status: isSignup && emailVerificationToken ? 'checking' : 'idle',
    error: '',
  })
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const emailVerificationStatus = emailVerification.token === emailVerificationToken
    ? emailVerification.status
    : emailVerificationToken ? 'checking' : 'idle'
  const isVerifiedSignup = isSignup && emailVerificationToken && emailVerificationStatus === 'valid'

  useEffect(() => {
    if (!isReset) return
    if (!resetToken) {
      return
    }
    let active = true
    onValidateResetToken(resetToken)
      .then(() => {
        if (active) setResetStatus('valid')
      })
      .catch((validationError) => {
        if (!active) return
        setResetStatus('invalid')
        setErrorTitle(validationError.title || 'Invalid reset link')
        setError(validationError.reason || validationError.message || 'This password reset link is invalid or expired.')
      })
    return () => { active = false }
  }, [isReset, resetToken, onValidateResetToken])

  useEffect(() => {
    if (!isSignup || !emailVerificationToken) return undefined

    let active = true
    onValidateEmailVerification(emailVerificationToken)
      .then(({ email }) => {
        if (!active) return
        const result = validateEmail(email)
        if (!result.valid) {
          setEmailVerification({
            token: emailVerificationToken,
            status: 'invalid',
            error: 'The verified email address is no longer valid. Request a new verification link.',
          })
          return
        }
        setEmailVerification({ token: emailVerificationToken, status: 'valid', error: '' })
        setEmailValidation(result)
        setForm((current) => ({ ...current, email: result.email }))
      })
      .catch((verificationError) => {
        if (!active) return
        const invalidLink = verificationError.status === 400
          || verificationError.code === 'EMAIL_VERIFICATION_INVALID'
        setEmailVerification({
          token: emailVerificationToken,
          status: invalidLink ? 'invalid' : 'error',
          error: invalidLink
            ? verificationError.reason || 'This email verification link is invalid or has expired.'
            : verificationError.reason || verificationError.message || 'We could not check this link. Check your connection and try again.',
        })
      })
    return () => { active = false }
  }, [isSignup, emailVerificationToken, onValidateEmailVerification, verificationAttempt])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setErrorTitle('')
    setSuccess('')
    setSuccessTitle('')
    setResetUrl('')
    setVerificationUrl('')
    let validatedEmail = ''
    if (!isReset) {
      const emailResult = validateEmail(form.email)
      setEmailValidation(emailResult)
      setForm((current) => ({ ...current, email: emailResult.email }))
      if (!emailResult.valid) return
      validatedEmail = emailResult.email
    }
    if (isVerifiedSignup && form.name.trim().length < 2) {
      setErrorTitle('Please check your information')
      return setError('Enter your name.')
    }
    if (isVerifiedSignup || isReset) {
      if (!isStrongPassword(form.password)) {
        setErrorTitle('Please check your information')
        return setError('Use at least 12 characters with uppercase, lowercase, and a number.')
      }
      if (form.password !== form.confirmPassword) {
        setErrorTitle('Please check your information')
        return setError('The passwords do not match.')
      }
    }
    if (!isForgot && !isReset && (!isSignup || isVerifiedSignup) && !form.password) {
      setErrorTitle('Please check your information')
      return setError('Enter your password.')
    }
    if (isReset && !resetToken) {
      setErrorTitle('Invalid reset link')
      return setError('This password reset link is invalid or incomplete.')
    }
    if (isReset && resetStatus !== 'valid') {
      setErrorTitle(resetStatus === 'checking' ? 'Checking reset link' : 'Invalid reset link')
      return setError(resetStatus === 'checking'
        ? 'Please wait while we verify this reset link.'
        : 'This password reset link is invalid or has expired.')
    }

    setBusy(true)
    try {
      if (isForgot) {
        const response = await onRequestPasswordReset({ email: validatedEmail })
        setResetUrl(response?.resetUrl || '')
        setSuccessTitle(response?.emailStatus === 'not-configured' ? 'Email not sent' : 'Request submitted')
        setSuccess(response?.message || 'Password reset request completed.')
      } else if (isSignup && !emailVerificationToken) {
        const response = await onRequestEmailVerification({
          email: validatedEmail,
          ...(invitationToken ? { invitationToken } : {}),
        })
        setVerificationUrl(response?.verificationUrl || '')
        setSuccessTitle(response?.emailStatus === 'not-configured' ? 'Development verification link' : 'Check your email')
        setSuccess(response?.message || 'Follow the verification link to finish creating your account.')
      } else if (isReset) {
        await onResetPassword({ token: resetToken, newPassword: form.password })
        setSuccess('Your password has been updated. You can now sign in.')
        setResetStatus('completed')
        setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
      } else {
        const account = isSignup
          ? await onRegister({
            name: form.name.trim(),
            email: validatedEmail,
            password: form.password,
            verificationToken: emailVerificationToken,
            ...(invitationToken ? { invitationToken } : {}),
          })
          : await onLogin({ email: validatedEmail, password: form.password })
        onNavigate('board')
        return account
      }
      return null
    } catch (authError) {
      setErrorTitle(authError.title || (isSignup ? 'Account creation failed' : isForgot ? 'Password reset failed' : isReset ? 'Password update failed' : 'Sign-in failed'))
      setError(authError.reason || authError.message || 'Please try again.')
      return null
    } finally {
      setBusy(false)
    }
  }

  const title = isSignup
    ? 'Create your account'
    : isForgot
      ? 'Password reset'
      : isReset
        ? 'Choose a new password'
        : 'Welcome back'
  const description = isSignup
    ? isVerifiedSignup
      ? invitationToken ? 'Your email is verified. Complete signup to join your team.' : 'Your email is verified. Complete signup to create your workspace.'
      : invitationToken ? 'Enter your email to verify it and accept the invitation.' : 'Enter your email to start creating a private workspace.'
    : isForgot
    ? 'Request a secure, time-limited link to reset your password.'
      : isReset
        ? 'Choose a strong password to secure your account.'
        : 'Sign in to pick up where your team left off.'

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button type="button" className="auth-brand" onClick={() => onNavigate(isSignup ? 'login' : 'signup')}>
          <span className="brand-mark"><Icon name="board" size={24} /></span>
          <span>plenqora<span className="brand-dot">.</span></span>
        </button>
        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR TEAM’S WORKSPACE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {connectionError && (
          <p className="auth-error" role="alert">
            <strong>{connectionErrorTitle || 'Unable to connect'}:</strong> {connectionError}
          </p>
        )}
        {isSignup && invitationToken && <p className="auth-security-note"><Icon name="users" size={15} /> This secure invitation assigns your workspace role after signup.</p>}
        {isReset && (!resetToken || resetStatus === 'invalid') && (
          <div className="auth-status auth-status-invalid" role="alert">
            <p>{!resetToken ? 'This reset link is missing.' : 'This reset link is invalid or expired.'} Request a new link from the sign-in page.</p>
            {error && <p><strong>{errorTitle || 'Reset link error'}:</strong> {error}</p>}
          </div>
        )}
        {isReset && resetToken && (resetStatus === 'checking' || resetStatus === 'idle') && (
          <p className="auth-status" role="status">Checking that this password reset link is valid…</p>
        )}
        {isReset && resetStatus === 'completed' && (
          <p className="auth-success" role="status">Your password has been updated. You can now sign in.</p>
        )}
        {isSignup && emailVerificationToken && emailVerificationStatus === 'checking' && (
          <p className="auth-status" role="status">Checking your email verification link…</p>
        )}
        {isSignup && emailVerificationToken && emailVerificationStatus === 'invalid' && (
          <p className="auth-status auth-status-invalid" role="alert">
            {emailVerification.error || 'This email verification link is invalid or has expired.'} <button type="button" className="text-action" onClick={() => onNavigate('signup')}>Request another link</button>
          </p>
        )}
        {isSignup && emailVerificationToken && emailVerificationStatus === 'error' && (
          <p className="auth-status auth-status-invalid" role="alert">
            <strong>Could not check verification link:</strong> {emailVerification.error} <button type="button" className="text-action" onClick={() => { setEmailVerification({ token: emailVerificationToken, status: 'checking', error: '' }); setVerificationAttempt((attempt) => attempt + 1) }}>Try again</button>
          </p>
        )}
        {(!isReset || resetStatus === 'valid') && (!isSignup || !emailVerificationToken || emailVerificationStatus === 'valid') && <form className="auth-form" onSubmit={submit} noValidate>
          {isVerifiedSignup && <label className="form-field"><span>Your name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Taylor Morgan" maxLength={80} /></label>}
          {!isReset && <label className="form-field"><span>Email address</span><input autoFocus={!isSignup || !emailVerificationToken} type="email" autoComplete="email" value={form.email} readOnly={Boolean(emailVerificationToken)} onChange={(event) => { setForm({ ...form, email: event.target.value }); setEmailValidation(null) }} onBlur={() => { const result = validateEmail(form.email); setEmailValidation(result); setForm((current) => ({ ...current, email: result.email })) }} placeholder="you@example.com" maxLength={254} aria-invalid={Boolean(emailValidation && !emailValidation.valid)} aria-describedby={emailValidation && !emailValidation.valid ? 'auth-email-error' : undefined} />{emailValidation && !emailValidation.valid && <small id="auth-email-error" className="auth-error" role="alert">{emailValidation.error}{emailValidation.suggestion && <> <button type="button" className="text-action" onClick={() => { setForm((current) => ({ ...current, email: emailValidation.suggestion })); setEmailValidation(null) }}>Use this</button></>}</small>}</label>}
          {!isForgot && (!isSignup || isVerifiedSignup) && <label className="form-field"><span>{isReset ? 'New password' : 'Password'}</span><PasswordInput autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isSignup || isReset ? '12+ characters, upper/lowercase and a number' : 'Enter your password'} maxLength={72} /></label>}
          {(isVerifiedSignup || isReset) && <label className="form-field"><span>Confirm password</span><PasswordInput autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Type your password again" maxLength={72} /></label>}
          {!isSignup && !isForgot && !isReset && <button type="button" className="auth-inline-link" onClick={() => onNavigate('forgot-password')}>Forgot password?</button>}
          {error && (
            <p className="auth-error" role="alert">
              <strong>{errorTitle || 'Request failed'}:</strong> {error}
            </p>
          )}
          {success && (
            <div className={`auth-success${successTitle === 'Email not sent' ? ' auth-warning' : ''}`} role="status">
              {successTitle && <strong>{successTitle}</strong>}
              <p>{success}</p>
              {resetUrl && (
                <a className="auth-reset-link" href={resetUrl}>Open password reset page</a>
              )}
              {verificationUrl && (
                <a className="auth-reset-link" href={verificationUrl}>Open email verification link</a>
              )}
            </div>
          )}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? emailVerificationToken ? 'Create account' : 'Send verification link' : isForgot ? 'Send reset link' : isReset ? 'Update password' : 'Sign in'}</button>
        </form>}
        <div className="auth-switch">
          {isSignup
            ? <>Already have an account? <button type="button" onClick={() => onNavigate('login')}>Sign in</button></>
            : isForgot || isReset
              ? <>Remembered it? <button type="button" onClick={() => onNavigate('login')}>Back to sign in</button></>
              : <>New to Plenqora? <button type="button" onClick={() => onNavigate('signup')}>Create an account</button></>}
        </div>
      </section>
    </main>
  )
}
