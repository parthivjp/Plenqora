import { useState } from 'react'
import Avatar from '../components/Avatar'
import Icon from '../components/Icon'
import IssueFilters from '../components/IssueFilters'
import ProjectMetrics from '../components/ProjectMetrics'
import { columns } from '../data/workspaceConfig'
import { formatIssueDate } from '../utils/formatDate'

export default function BoardPage({ issues, summaryIssues, members, filters, onFiltersChange, onOpenIssue, onCreateIssue, onMoveIssue, onNavigate, canEdit }) {
  const [draggedIssueId, setDraggedIssueId] = useState(null)
  return (
    <>
      <ProjectMetrics issues={summaryIssues} members={members} />
      <section className="board-panel">
        <IssueFilters filters={{ ...filters, view: 'board' }} onChange={onFiltersChange} members={members} onNavigate={onNavigate} />
        <div className="kanban-board">
        {columns.map((column) => {
          const columnIssues = issues.filter((issue) => issue.status === column.id)
          return (
            <section key={column.id} className={`kanban-column column-${column.color}`} onDragOver={(event) => { if (canEdit) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); if (canEdit && draggedIssueId) onMoveIssue(draggedIssueId, column.id); setDraggedIssueId(null) }}>
              <div className="column-heading">
                <div className="column-title"><span className={`column-icon ${column.color}`}><Icon name={column.icon} size={14} /></span><h2>{column.title}</h2><span className="column-count">{columnIssues.length}</span></div>
                {canEdit && <button type="button" className="icon-button subtle-icon" aria-label={`Add issue to ${column.title}`} onClick={() => onCreateIssue(column.id)}><Icon name="plus" size={16} /></button>}
              </div>
              <div className="issue-stack">
                {columnIssues.map((issue) => (
                  <article className="issue-card" key={issue.id} role="button" tabIndex={0} aria-label={`${issue.id}: ${issue.title}`} draggable={canEdit} onDragStart={() => setDraggedIssueId(issue.id)} onDragEnd={() => setDraggedIssueId(null)} onClick={() => onOpenIssue(issue)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpenIssue(issue) } }}>
                    <div className="issue-card-top"><span className={`issue-type type-${issue.type.toLowerCase()}`}>{issue.type}</span>{canEdit && <button type="button" className="icon-button card-menu" aria-label={`Edit ${issue.id}`} onClick={(event) => { event.stopPropagation(); onOpenIssue(issue) }}><Icon name="more" size={17} /></button>}</div>
                    <h3>{issue.title}</h3>
                    <div className="issue-id-row"><span>{issue.id}</span><span className={`priority priority-${issue.priority.toLowerCase()}`}><i />{issue.priority}</span></div>
                    <div className="issue-card-footer"><span className="issue-date"><Icon name="calendar" size={13} /> {formatIssueDate(issue.date)}</span><Avatar person={issue.assignee} size="small" /></div>
                  </article>
                ))}
                {columnIssues.length === 0 && <div className="empty-column">{issues.length ? 'No matching issues' : 'A fresh start. Add an issue when you’re ready.'}</div>}
              </div>
              {canEdit && <button type="button" className="column-add" onClick={() => onCreateIssue(column.id)}><Icon name="plus" size={15} /> Add issue</button>}
            </section>
          )
        })}
        </div>
        <div className="board-footer"><span><span className="live-dot" /> Synced with your workspace</span><span>{issues.length} shown · {summaryIssues.length} total</span></div>
      </section>
    </>
  )
}
