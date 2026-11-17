import { useState } from 'react'
import Icon from '../components/Icon'
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
  connectionError,
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const search = new URLSearchParams(window.location.search)
  const invitationToken = search.get('invite') || ''
  const resetToken = search.get('token') || ''
  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot-password'
  const isReset = mode === 'reset-password'

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && !isReset) {
      return setError('Enter a valid email address.')
    }
    if (isSignup && form.name.trim().length < 2) return setError('Enter your name.')
    if (isSignup || isReset) {
      if (!isStrongPassword(form.password)) {
        return setError('Use at least 12 characters with uppercase, lowercase, and a number.')
      }
      if (form.password !== form.confirmPassword) return setError('The passwords do not match.')
    }
    if (!isForgot && !isReset && !form.password) return setError('Enter your password.')
    if (isReset && !resetToken) return setError('This password reset link is invalid or incomplete.')

    setBusy(true)
    try {
      if (isForgot) {
        await onRequestPasswordReset({ email: form.email.trim() })
        setSuccess('If an account exists for this address, a password reset link has been sent.')
      } else if (isReset) {
        await onResetPassword({ token: resetToken, newPassword: form.password })
        setSuccess('Your password has been updated. You can now sign in.')
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
      setError(authError.message)
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
      ? 'We’ll send a secure, time-limited reset link to your email.'
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
        {connectionError && <p className="auth-error" role="alert">{connectionError}</p>}
        {isSignup && invitationToken && <p className="auth-security-note"><Icon name="users" size={15} /> This secure invitation assigns your workspace role after signup.</p>}
        <form className="auth-form" onSubmit={submit} noValidate>
          {isSignup && <label className="form-field"><span>Your name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Taylor Morgan" maxLength={80} /></label>}
          {!isReset && <label className="form-field"><span>Email address</span><input autoFocus={!isSignup} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" maxLength={254} /></label>}
          {!isForgot && <label className="form-field"><span>{isReset ? 'New password' : 'Password'}</span><input type="password" autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isSignup || isReset ? '12+ characters, upper/lowercase and a number' : 'Enter your password'} maxLength={72} /></label>}
          {(isSignup || isReset) && <label className="form-field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Type your password again" maxLength={72} /></label>}
          {!isSignup && !isForgot && !isReset && <button type="button" className="auth-inline-link" onClick={() => onNavigate('forgot-password')}>Forgot password?</button>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {success && <p className="auth-success" role="status">{success}</p>}
          <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : isForgot ? 'Send reset link' : isReset ? 'Update password' : 'Sign in'}</button>
        </form>
        <div className="auth-switch">
          {isSignup
            ? <>Already have an account? <button type="button" onClick={() => onNavigate('login')}>Sign in</button></>
            : isForgot || isReset
              ? <>Remembered it? <button type="button" onClick={() => onNavigate('login')}>Back to sign in</button></>
              : <>New to Plenqora? <button type="button" onClick={() => onNavigate('signup')}>Create an account</button></>}
        </div>
        <div className="auth-security-note"><Icon name="lock" size={15} /><span>Passwords and authorization are handled by the Plenqora API. Your session is stored in a secure, HTTP-only cookie.</span></div>
      </section>
    </main>
  )
}
