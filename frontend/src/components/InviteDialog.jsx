import { useState } from 'react'
import Icon from './Icon'

export default function InviteDialog({ members, onClose, onSave }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Developer')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (name.trim().length < 2) return setError('Enter a teammate name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.')
    if (members.some((member) => member.email.toLowerCase() === email.trim().toLowerCase())) return setError('This email is already in your workspace.')
    onSave({ name, email, role })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card project-modal" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
        <div className="modal-heading"><div><span className="modal-eyebrow">GROW YOUR TEAM</span><h2 id="invite-modal-title">Invite a teammate.</h2><p>The invitation is saved locally until you connect an email service.</p></div><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>
        <form onSubmit={submit} noValidate>
          <label className="form-field"><span>Name <b>*</b></span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="e.g. Taylor Morgan" maxLength={80} /></label>
          <label className="form-field"><span>Email <b>*</b></span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="taylor@example.com" maxLength={254} /></label>
          <label className="form-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option>Developer</option><option>Designer</option><option>Product manager</option><option>Viewer</option></select></label>
          {error && <small className="field-error">{error}</small>}
          <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Icon name="plus" size={16} /> Add teammate</button></div>
        </form>
      </section>
    </div>
  )
}
