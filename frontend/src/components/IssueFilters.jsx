import Icon from './Icon'
import FilterDropdown from './FilterDropdown'

const priorityOptions = ['All priorities', 'High', 'Medium', 'Low'].map((value) => ({ value, label: value }))
const statusOptions = [
  { value: 'All statuses', label: 'All statuses' },
  { value: 'todo', label: 'To do' },
  { value: 'progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]
const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'priority:desc', label: 'Priority' },
  { value: 'status:asc', label: 'Status' },
]

export default function IssueFilters({ filters, onChange, members, onNavigate }) {
  const setFilter = (key, value) => onChange((current) => ({ ...current, [key]: value }))
  const assigneeOptions = [{ value: 'Everyone', label: 'Everyone' }, ...members.map((member) => ({ value: member.id, label: member.name }))]

  return (
    <div className="board-toolbar">
      <div className="view-tabs" role="tablist" aria-label="Issue views">
        <button type="button" role="tab" aria-selected={filters.view === 'board'} className={`view-tab ${filters.view === 'board' ? 'active' : ''}`} onClick={() => onNavigate('board')}><Icon name="board" size={16} /> Board</button>
        <button type="button" role="tab" aria-selected={filters.view === 'issues'} className={`view-tab ${filters.view === 'issues' ? 'active' : ''}`} onClick={() => onNavigate('issues')}><Icon name="checklist" size={16} /> List</button>
      </div>
      <div className="toolbar-controls">
        <label className="search-field">
          <Icon name="search" size={17} />
          <input value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search issues..." aria-label="Search issues" maxLength={100} />
          {filters.search && <button type="button" aria-label="Clear search" onClick={() => setFilter('search', '')}><Icon name="close" size={14} /></button>}
          {!filters.search && <kbd>/</kbd>}
        </label>
        <FilterDropdown label="Filter by priority" value={filters.priority} options={priorityOptions} onChange={(value) => setFilter('priority', value)} icon="filter" />
        <FilterDropdown label="Filter by status" value={filters.status} options={statusOptions} onChange={(value) => setFilter('status', value)} className="status-select" />
        <FilterDropdown label="Filter by assignee" value={filters.assignee} options={assigneeOptions} onChange={(value) => setFilter('assignee', value)} className="assignee-select" />
        <FilterDropdown label="Sort issues" value={`${filters.sortBy}:${filters.order}`} options={sortOptions} onChange={(value) => { const [sortBy, order] = value.split(':'); onChange((current) => ({ ...current, sortBy, order })) }} className="sort-select" />
      </div>
    </div>
  )
}
