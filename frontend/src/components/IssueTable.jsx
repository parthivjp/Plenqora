import Avatar from './Avatar'

export default function IssueTable({ issues, onOpen }) {
  return (
    <div className="issue-list-view">
      <div className="list-heading"><span>Issue</span><span>Status</span><span>Priority</span><span>Assignee</span><span>Created</span></div>
      {issues.length ? issues.map((issue) => (
        <button type="button" className="list-row" key={issue.id} onClick={() => onOpen(issue)}>
          <span className="list-issue-title"><span className={`issue-type type-${issue.type.toLowerCase()}`}>{issue.type}</span><strong>{issue.title}</strong><small>{issue.id}</small></span>
          <span className={`list-status status-${issue.status}`}>{issue.status === 'todo' ? 'To do' : issue.status === 'progress' ? 'In progress' : 'Done'}</span>
          <span className={`priority priority-${issue.priority.toLowerCase()}`}><i />{issue.priority}</span>
          <span className="list-assignee"><Avatar person={issue.assignee} size="small" />{issue.assignee}</span>
          <span className="list-date">{issue.date}</span>
        </button>
      )) : <div className="list-empty">No issues match those filters. Try changing your search or filters.</div>}
    </div>
  )
}
