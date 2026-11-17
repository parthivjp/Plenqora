import { useState } from 'react'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import InviteDialog from '../components/InviteDialog'
import './TeamPage.css'

export default function TeamPage({ members, invitations, currentUserId, ownerId, canManage, canAdmin, onInvite, onCancelInvitation, onResendInvitation, onRoleChange, onRemoveMember, notify }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const copyInvite = async (url) => {
    setInviteLink(url)
    try {
      await navigator.clipboard.writeText(url)
      notify('Invitation link copied')
    } catch {
      notify('Could not access the clipboard. Open the invitation link and copy it manually.')
    }
  }
  return (
    <>
      <section className="board-panel">
        <div className="team-view">
          <div className="team-view-header"><div><h2>Better work, together.</h2><p>Manage the people in your workspace.</p></div>{canManage && <button type="button" className="button button-primary" onClick={() => setInviteOpen(true)}><Icon name="plus" size={16} /> Invite people</button>}</div>
          <div className="team-grid">{members.map((person) => (
            <article className="member-card" key={person.id}><Avatar person={person} size="large" /><div><strong>{person.name}</strong><span>{person.role} · {person.email}</span>{canAdmin && person.id !== ownerId && person.id !== currentUserId && <span className="member-access"><select aria-label={`Access for ${person.name}`} value={person.role} onChange={(event) => onRoleChange(person.id, event.target.value)}><option>Manager</option><option>Developer</option><option>Viewer</option></select><button type="button" className="text-action" onClick={() => onRemoveMember(person)}>Remove</button></span>}</div><span className="member-presence"><i /> Active</span></article>
          ))}</div>
          {invitations.length > 0 && <div className="pending-invitations"><h3>Pending invitations</h3>{invitations.map((invitation) => <div className="pending-invitation" key={invitation.id}><span><strong>{invitation.email}</strong><small>{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</small></span><button type="button" className="text-action" onClick={async () => { try { const refreshed = await onResendInvitation(invitation.id); await copyInvite(refreshed.inviteUrl); if (refreshed.delivery === 'email') notify(`Invitation emailed to ${refreshed.email}`) } catch (error) { notify(error.message) } }}>Resend / copy link</button><button type="button" className="text-action" onClick={() => onCancelInvitation(invitation.id)}>Cancel</button></div>)}</div>}
          {inviteLink && <div className="invite-link-panel"><label htmlFor="invite-link">Secure invitation link</label><div><input id="invite-link" readOnly value={inviteLink} onFocus={(event) => event.target.select()} /><button type="button" className="button button-secondary" onClick={() => copyInvite(inviteLink)}>Copy</button></div></div>}
          <div className="permission-note"><Icon name="lock" size={16} /> Workspace roles are checked by the API on every protected action.</div>
        </div>
        <div className="board-footer"><span><span className="live-dot" /> {members.length} workspace members</span><span>{invitations.length} pending invitations</span></div>
      </section>
      {inviteOpen && <InviteDialog members={members} invitations={invitations} onClose={() => setInviteOpen(false)} onSave={async (values) => { const invitation = await onInvite(values); setInviteOpen(false); await copyInvite(invitation.inviteUrl); if (invitation.delivery === 'email') notify(`Invitation emailed to ${invitation.email}`); else notify(`Invitation link created for ${invitation.email}`) }} />}
    </>
  )
}
