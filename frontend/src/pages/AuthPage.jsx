import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import PasswordInput from '../components/PasswordInput'
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
  onResetPassword,
  onValidateResetToken,
  connectionError,
  connectionErrorTitle,
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [errorTitle, setErrorTitle] = useState('')
  const [success, setSuccess] = useState('')
  const [successTitle, setSuccessTitle] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const search = new URLSearchParams(window.location.search)
  const invitationToken = search.get('invite') || ''
  const resetToken = search.get('token') || ''
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot-password'
  const isReset = mode === 'reset-password'
  const [resetStatus, setResetStatus] = useState(isReset && resetToken ? 'checking' : isReset ? 'invalid' : 'idle')

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

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setErrorTitle('')
    setSuccess('')
    setSuccessTitle('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && !isReset) {
      setErrorTitle('Please check your information')
      return setError('Enter a valid email address.')
    }
    if (isSignup && form.name.trim().length < 2) {
      setErrorTitle('Please check your information')
      return setError('Enter your name.')
    }
    if (isSignup || isReset) {
      if (!isStrongPassword(form.password)) {
        setErrorTitle('Please check your information')
        return setError('Use at least 12 characters with uppercase, lowercase, and a number.')
      }
      if (form.password !== form.confirmPassword) {
        setErrorTitle('Please check your information')
        return setError('The passwords do not match.')
      }
    }
    if (!isForgot && !isReset && !form.password) {
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
        const response = await onRequestPasswordReset({ email: form.email.trim() })
        setResetUrl(response?.resetUrl || '')
        setSuccessTitle(response?.emailStatus === 'not-configured' ? 'Email not sent' : 'Request submitted')
        setSuccess(response?.message || 'Password reset request completed.')
      } else if (isReset) {
        await onResetPassword({ token: resetToken, newPassword: form.password })
        setSuccess('Your password has been updated. You can now sign in.')
        setResetStatus('completed')
        setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
      } else {
        const account = isSignup
          ? await onRegister({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            ...(invitationToken ? { invitationToken } : {}),
          })
          : await onLogin({ email: form.email.trim(), password: form.password })
        onNavigate('board')
        return account
      }
      return null
    } catch (authError) {
      setErrorTitle(authError.title || 'Sign-in failed')
      setError(authError.reason || authError.message)
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
    ? invitationToken ? 'Accept your invitation and join your team.' : 'Create a private workspace for your projects.'
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
          <p className="auth-status auth-status-invalid" role="alert">
            This reset link is missing, invalid, or expired. Request a new link from the sign-in page.
          </p>
        )}
        {isReset && resetToken && (resetStatus === 'checking' || resetStatus === 'idle') && (
          <p className="auth-status" role="status">Checking that this password reset link is valid…</p>
        )}
        {isReset && resetStatus === 'completed' && (
          <p className="auth-success" role="status">Your password has been updated. You can now sign in.</p>
        )}
        {(!isReset || resetStatus === 'valid') && <form className="auth-form" onSubmit={submit} noValidate>
          {isSignup && <label className="form-field"><span>Your name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Taylor Morgan" maxLength={80} /></label>}
          {!isReset && <label className="form-field"><span>Email address</span><input autoFocus={!isSignup} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" maxLength={254} /></label>}
          {!isForgot && <label className="form-field"><span>{isReset ? 'New password' : 'Password'}</span><PasswordInput autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isSignup || isReset ? '12+ characters, upper/lowercase and a number' : 'Enter your password'} maxLength={72} /></label>}
          {(isSignup || isReset) && <label className="form-field"><span>Confirm password</span><PasswordInput autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Type your password again" maxLength={72} /></label>}
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
            </div>
          )}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : isForgot ? 'Send reset link' : isReset ? 'Update password' : 'Sign in'}</button>
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
