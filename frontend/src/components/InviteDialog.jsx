import { useState } from 'react'
import Icon from './Icon'
import { validateEmail } from '../utils/emailValidator'

export default function InviteDialog({ members, invitations, onClose, onSave }) {
  const [email, setEmail] = useState('')
  const [emailValidation, setEmailValidation] = useState(null)
  const [role, setRole] = useState('Developer')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const emailResult = validateEmail(email)
    setEmailValidation(emailResult)
    setEmail(emailResult.email)
    if (!emailResult.valid) return
    if (members.some((member) => member.email.toLowerCase() === emailResult.email)) return setError('This email is already in your workspace.')
    if (invitations.some((invitation) => invitation.email.toLowerCase() === emailResult.email)) return setError('An invitation is already pending for this email.')
    setBusy(true)
    try {
      await onSave({ email: emailResult.email, role })
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card project-modal" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
        <div className="modal-heading"><div><span className="modal-eyebrow">GROW YOUR TEAM</span><h2 id="invite-modal-title">Invite a teammate.</h2><p>Send an email invitation or share a secure signup link.</p></div><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>
        <form onSubmit={submit} noValidate>
          <label className="form-field"><span>Email <b>*</b></span><input autoFocus type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setEmailValidation(null) }} onBlur={() => { const result = validateEmail(email); setEmailValidation(result); setEmail(result.email) }} placeholder="taylor@example.com" maxLength={254} aria-invalid={Boolean(emailValidation && !emailValidation.valid)} aria-describedby={emailValidation && !emailValidation.valid ? 'invite-email-error' : undefined} />{emailValidation && !emailValidation.valid && <small id="invite-email-error" className="field-error" role="alert">{emailValidation.error}{emailValidation.suggestion && <> <button type="button" className="text-action" onClick={() => { setEmail(emailValidation.suggestion); setEmailValidation(null) }}>Use this</button></>}</small>}</label>
          <label className="form-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option>Developer</option><option>Manager</option><option>Viewer</option></select></label>
          {error && <small className="field-error">{error}</small>}
          <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}><Icon name="plus" size={16} /> {busy ? 'Creating…' : 'Create invitation'}</button></div>
        </form>
      </section>
    </div>
  )
}
