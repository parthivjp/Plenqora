import { useState } from 'react'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import InviteDialog from '../components/InviteDialog'
import './TeamPage.css'

export default function TeamPage({ members, accounts, currentEmail, canManage, onInvite, onRoleChange, notify }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  return (
    <>
      <section className="board-panel">
        <div className="team-view">
          <div className="team-view-header"><div><h2>Better work, together.</h2><p>Manage the people in your workspace.</p></div>{canManage && <button type="button" className="button button-primary" onClick={() => setInviteOpen(true)}><Icon name="plus" size={16} /> Invite people</button>}</div>
          <div className="team-grid">{members.map((person) => {
            const account = accounts.find((item) => item.email === person.email)
            return <article className="member-card" key={person.email}><Avatar person={person} size="large" /><div><strong>{person.name}</strong><span>{person.role} · {person.email}</span>{account && <span className="member-access">Access: {canManage && account.email !== currentEmail ? <select aria-label={`Access for ${person.name}`} value={account.role} onChange={(event) => onRoleChange(account.email, event.target.value)}><option>Admin</option><option>Member</option><option>Viewer</option></select> : account.role}</span>}</div><span className={`member-presence ${person.status === 'Invited' ? 'member-invited' : ''}`}><i /> {person.status}</span></article>
          })}</div>
          <div className="permission-note"><Icon name="lock" size={16} /> Demo roles control the interface only. Enforce all permissions in a backend before production.</div>
        </div>
        <div className="board-footer"><span><span className="live-dot" /> {members.length} workspace members</span><span>Local workspace</span></div>
      </section>
      {inviteOpen && <InviteDialog members={members} onClose={() => setInviteOpen(false)} onSave={(member) => { onInvite(member); setInviteOpen(false); notify(`${member.name} was added to the workspace`) }} />}
    </>
  )
}
