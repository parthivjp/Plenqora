import { useState } from 'react'
import Icon from '../components/Icon'
import './AuthPage.css'

export default function AuthPage({ mode, onNavigate, onLogin, onRegister, storageWarning }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (mode === 'forgot') return
    if (mode === 'signup') {
      if (form.name.trim().length < 2) return setError('Enter your name.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.')
      if (form.password.length < 8) return setError('Use a password with at least 8 characters.')
      if (form.password !== form.confirmPassword) return setError('The passwords do not match.')
    }
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.')
    setBusy(true)
    try {
      const account = mode === 'signup' ? await onRegister(form) : await onLogin(form)
      onNavigate('board')
      return account
    } catch (authError) {
      setError(authError.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  const isSignup = mode === 'signup'
  const isForgot = mode === 'forgot'
  return (
    <main className="auth-page">
      <section className="auth-card">
        <button type="button" className="auth-brand" onClick={() => onNavigate(isSignup ? 'login' : 'signup')}>
          <span className="brand-mark"><Icon name="board" size={24} /></span>
          <span>plenqora<span className="brand-dot">.</span></span>
        </button>
        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR TEAM’S WORKSPACE</span>
          <h1>{isSignup ? 'Create your account' : isForgot ? 'Password reset' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Start organizing your projects with Plenqora.' : isForgot ? 'Password recovery needs a verified email service.' : 'Sign in to pick up where your team left off.'}</p>
        </div>
        {storageWarning && <p className="auth-error" role="alert">{storageWarning}</p>}
        {isForgot ? (
          <div className="forgot-notice"><Icon name="lock" size={18} /><p>Because this demo has no backend or email service, it cannot securely verify your identity or send a password-reset link. Once a backend is connected, password recovery can be enabled safely.</p></div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            {isSignup && <label className="form-field"><span>Your name</span><input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Taylor Morgan" maxLength={80} /></label>}
            <label className="form-field"><span>Email address</span><input autoFocus={!isSignup} type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" maxLength={254} /></label>
            <label className="form-field"><span>Password</span><input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'} maxLength={128} /></label>
            {isSignup && <label className="form-field"><span>Confirm password</span><input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Type your password again" maxLength={128} /></label>}
            {!isSignup && <button type="button" className="auth-inline-link" onClick={() => onNavigate('forgot-password')}>Forgot password?</button>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button>
          </form>
        )}
        <div className="auth-switch">{isSignup ? <>Already have an account? <button type="button" onClick={() => onNavigate('login')}>Sign in</button></> : isForgot ? <>Remembered it? <button type="button" onClick={() => onNavigate('login')}>Back to sign in</button></> : <>New to Plenqora? <button type="button" onClick={() => onNavigate('signup')}>Create an account</button></>}</div>
        <div className="auth-demo-note"><Icon name="lock" size={15} /><span>Local demo authentication only. Accounts and sessions stay in this browser; this is not production security.</span></div>
        {isSignup && <p className="auth-role-note">The first account created on this browser becomes an admin. Later accounts start as members.</p>}
      </section>
    </main>
  )
}
