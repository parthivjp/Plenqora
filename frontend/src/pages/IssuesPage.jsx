import IssueFilters from '../components/IssueFilters'
import IssueTable from '../components/IssueTable'

export default function IssuesPage({ issues, members, filters, onFiltersChange, onOpenIssue, onCreateIssue, onNavigate, canEdit }) {
  return (
    <section className="board-panel">
      <IssueFilters filters={{ ...filters, view: 'issues' }} onChange={onFiltersChange} members={members} onNavigate={onNavigate} />
      <IssueTable issues={issues} onOpen={onOpenIssue} />
      <div className="board-footer"><span><span className="live-dot" /> Synced with your workspace</span>{canEdit && <button type="button" className="text-action" onClick={() => onCreateIssue('todo')}>Create an issue</button>}</div>
    </section>
  )
}
