import Avatar from './Avatar'
import Icon from './Icon'

export default function ProjectMetrics({ issues, members }) {
  const completed = issues.filter((issue) => issue.status === 'done').length
  const inProgress = issues.filter((issue) => issue.status === 'progress').length
  const open = issues.filter((issue) => issue.status !== 'done').length
  const completion = issues.length ? Math.round((completed / issues.length) * 100) : 0

  return (
    <section className="metrics-grid" aria-label="Project summary">
      <article className="metric-card metric-card-total">
        <div className="metric-top"><span className="metric-icon metric-lilac"><Icon name="checklist" size={19} /></span><span className="metric-trend">All work</span></div>
        <span className="metric-label">Total issues</span><strong className="metric-number">{issues.length.toString().padStart(2, '0')}</strong>
        <span className="metric-footnote">Across this project</span>
      </article>
      <article className="metric-card metric-card-open">
        <div className="metric-top"><span className="metric-icon metric-peach"><Icon name="circle" size={19} /></span><span className="metric-trend">{issues.length ? `${Math.round((open / issues.length) * 100)}%` : '—'} of work</span></div>
        <span className="metric-label">Still to do</span><strong className="metric-number">{open.toString().padStart(2, '0')}</strong>
        <span className="metric-footnote">Open issues to move forward</span>
      </article>
      <article className="metric-card metric-card-progress">
        <div className="metric-top"><span className="metric-icon metric-blue"><Icon name="clock" size={19} /></span><span className="metric-trend">In motion</span></div>
        <span className="metric-label">In progress</span><strong className="metric-number">{inProgress.toString().padStart(2, '0')}</strong>
        <span className="metric-footnote">Currently being worked on</span>
      </article>
      <article className="metric-card metric-card-complete">
        <div className="metric-top"><span className="metric-icon metric-green"><Icon name="check" size={19} /></span><span className="metric-trend">{completion}% complete</span></div>
        <span className="metric-label">Completed</span><strong className="metric-number">{completed.toString().padStart(2, '0')}</strong>
        <span className="metric-footnote">Nice work, team</span>
        <span className="metric-progress-track" aria-label={`${completion}% of issues completed`}><span style={{ width: `${completion}%` }} /></span>
      </article>
      <article className="metric-card team-metric">
        <div className="metric-top"><span className="metric-icon metric-peach"><Icon name="users" size={19} /></span><span className="metric-label">Your team</span></div>
        <div className="team-avatars">{members.slice(0, 4).map((person) => <Avatar key={person.email} person={person} size="small" />)}{members.length > 4 && <span className="team-extra">+{members.length - 4}</span>}</div>
        <span className="metric-footnote">{members.length} workspace members</span>
      </article>
    </section>
  )
}
