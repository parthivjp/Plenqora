import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import ProjectMetrics from '../components/ProjectMetrics'
import { formatIssueDate } from '../utils/formatDate'
import './OverviewPage.css'

export default function OverviewPage({ project, issues, members, onOpenIssue, onCreateIssue, canEdit }) {
  return (
    <>
      <ProjectMetrics issues={issues} members={members} />
      <section className="board-panel overview-page-panel">
        <div className="overview-view">
          <div className="overview-intro"><span className="overview-art"><Icon name="checklist" size={27} /></span><h2>Make progress, together.</h2><p>Your team has <strong>{issues.length} issues</strong> in {project.name}. Take a look at what needs attention or add something new.</p>{canEdit && <button className="button button-primary" type="button" onClick={() => onCreateIssue('todo')}><Icon name="plus" size={17} /> Create an issue</button>}</div>
          <div className="overview-activity"><h2>Recently updated</h2>{issues.slice(0, 5).map((issue) => <button type="button" className="activity-row" key={issue.id} onClick={() => onOpenIssue(issue)}><span className="activity-dot" /><span><strong>{issue.title}</strong><small>{issue.id} · {formatIssueDate(issue.updatedAt)}</small></span><Avatar person={issue.assignee} size="small" /></button>)}{!issues.length && <p className="overview-empty">No issues yet. Create one to get started.</p>}</div>
        </div>
        <div className="board-footer"><span><span className="live-dot" /> Synced with your workspace</span><span>{project.key} workspace</span></div>
      </section>
    </>
  )
}
