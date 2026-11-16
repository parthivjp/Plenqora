import { useMemo, useState } from 'react'
import './App.css'

const initialProjects = [
  { id: 'atlas', name: 'Atlas workspace', key: 'ATL', description: 'Customer experience platform', color: 'violet' },
  { id: 'mobile', name: 'Mobile app', key: 'MOB', description: 'iOS & Android experience', color: 'blue' },
  { id: 'website', name: 'Website refresh', key: 'WEB', description: 'Marketing site redesign', color: 'orange' },
]

const people = [
  { name: 'Olivia Chen', initials: 'OC', color: 'lilac' },
  { name: 'Marcus Lee', initials: 'ML', color: 'mint' },
  { name: 'Amara Okafor', initials: 'AO', color: 'peach' },
  { name: 'Noah Williams', initials: 'NW', color: 'blue' },
]

const initialIssues = [
  { id: 'ATL-24', projectId: 'atlas', title: 'Checkout page freezes after applying a discount code', description: 'The checkout screen becomes unresponsive after a valid discount is applied. Reproduced on Chrome and Safari.', status: 'todo', priority: 'High', assignee: 'Olivia Chen', type: 'Bug', date: 'Today' },
  { id: 'ATL-23', projectId: 'atlas', title: 'Add a compact view to the activity timeline', description: 'Give workspace members a more condensed way to scan recent project activity.', status: 'todo', priority: 'Medium', assignee: 'Marcus Lee', type: 'Feature', date: 'Today' },
  { id: 'ATL-21', projectId: 'atlas', title: 'Email notifications are sent twice', description: 'Some users receive duplicate email notifications when a ticket is assigned.', status: 'todo', priority: 'Low', assignee: 'Noah Williams', type: 'Bug', date: 'Yesterday' },
  { id: 'ATL-19', projectId: 'atlas', title: 'Polish onboarding empty states', description: 'Make the first-project experience feel more helpful and welcoming.', status: 'progress', priority: 'Medium', assignee: 'Amara Okafor', type: 'Design', date: 'Yesterday' },
  { id: 'ATL-18', projectId: 'atlas', title: 'Improve dashboard loading performance', description: 'Reduce the time required to render the dashboard for large workspaces.', status: 'progress', priority: 'High', assignee: 'Marcus Lee', type: 'Improvement', date: 'Oct 22' },
  { id: 'ATL-16', projectId: 'atlas', title: 'Document workspace permission levels', description: 'Add clear documentation for workspace roles and what each role can do.', status: 'progress', priority: 'Low', assignee: 'Noah Williams', type: 'Documentation', date: 'Oct 21' },
  { id: 'ATL-14', projectId: 'atlas', title: 'Invite teammates by email', description: 'Let project admins invite teammates and assign a workspace role.', status: 'done', priority: 'Medium', assignee: 'Olivia Chen', type: 'Feature', date: 'Oct 20' },
  { id: 'ATL-12', projectId: 'atlas', title: 'Create project overview page', description: 'A quick summary of project health, activity, and outstanding work.', status: 'done', priority: 'Low', assignee: 'Amara Okafor', type: 'Feature', date: 'Oct 18' },
  { id: 'MOB-08', projectId: 'mobile', title: 'Fix profile photo crop on smaller screens', description: 'Avatar crop should stay centered on narrow mobile devices.', status: 'todo', priority: 'Medium', assignee: 'Amara Okafor', type: 'Bug', date: 'Today' },
  { id: 'MOB-07', projectId: 'mobile', title: 'Add biometric sign-in', description: 'Allow users to securely sign in with device biometrics.', status: 'progress', priority: 'High', assignee: 'Noah Williams', type: 'Feature', date: 'Yesterday' },
  { id: 'WEB-11', projectId: 'website', title: 'Update the homepage testimonials', description: 'Refresh customer quotes and profile imagery.', status: 'todo', priority: 'Low', assignee: 'Marcus Lee', type: 'Design', date: 'Today' },
]

const columns = [
  { id: 'todo', title: 'To do', color: 'gray', icon: 'circle' },
  { id: 'progress', title: 'In progress', color: 'violet', icon: 'clock' },
  { id: 'done', title: 'Done', color: 'green', icon: 'check' },
]

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'issues', label: 'All issues', icon: 'checklist' },
  { id: 'team', label: 'Team', icon: 'users' },
]

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    board: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
    checklist: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 .8.8L6 5m-2.5 7 .8.8L6 11m-2.5 7 .8.8L6 17" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1.1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1.1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1.1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1.1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    circle: <circle cx="12" cy="12" r="8" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Avatar({ person, size = 'normal' }) {
  const found = people.find((item) => item.name === person)
  const initials = found?.initials ?? person?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? '?'
  return <span className={`avatar avatar-${found?.color ?? 'lilac'} avatar-${size}`} aria-label={person}>{initials}</span>
}

function App() {
  const [projects, setProjects] = useState(initialProjects)
  const [activeProjectId, setActiveProjectId] = useState('atlas')
  const [issues, setIssues] = useState(initialIssues)
  const [activeView, setActiveView] = useState('board')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All priorities')
  const [assigneeFilter, setAssigneeFilter] = useState('Everyone')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [issueForm, setIssueForm] = useState({ title: '', description: '', priority: 'Medium', status: 'todo', assignee: '', type: 'Bug' })
  const [projectForm, setProjectForm] = useState({ name: '', key: '', description: '' })
  const [errors, setErrors] = useState({})
  const [draggedIssueId, setDraggedIssueId] = useState(null)

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0]
  const projectIssues = issues.filter((issue) => issue.projectId === activeProjectId)
  const visibleIssues = useMemo(() => projectIssues.filter((issue) => {
    const matchesSearch = `${issue.title} ${issue.id} ${issue.assignee}`.toLowerCase().includes(search.trim().toLowerCase())
    return matchesSearch
      && (priorityFilter === 'All priorities' || issue.priority === priorityFilter)
      && (assigneeFilter === 'Everyone' || issue.assignee === assigneeFilter)
      && (statusFilter === 'All statuses' || issue.status === statusFilter)
  }), [projectIssues, search, priorityFilter, assigneeFilter, statusFilter])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const openIssueModal = () => {
    setErrors({})
    setIssueForm({ title: '', description: '', priority: 'Medium', status: 'todo', assignee: '', type: 'Bug' })
    setModal('issue')
  }

  const saveIssue = (event) => {
    event.preventDefault()
    const nextErrors = {}
    const title = issueForm.title.trim()
    const description = issueForm.description.trim()
    if (title.length < 5 || title.length > 100) nextErrors.title = 'Use a clear title between 5 and 100 characters.'
    if (description.length < 10 || description.length > 1000) nextErrors.description = 'Add a description between 10 and 1,000 characters.'
    if (!people.some((person) => person.name === issueForm.assignee)) nextErrors.assignee = 'Choose a project team member.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const nextNumber = projectIssues.reduce((max, issue) => Math.max(max, Number(issue.id.split('-').at(-1)) || 0), 0) + 1
    setIssues((current) => [...current, {
      id: `${activeProject.key}-${nextNumber}`,
      projectId: activeProjectId,
      title,
      description,
      priority: issueForm.priority,
      status: issueForm.status,
      assignee: issueForm.assignee,
      type: issueForm.type,
      date: 'Just now',
    }])
    setModal(null)
    notify('Issue created successfully')
  }

  const saveProject = (event) => {
    event.preventDefault()
    const name = projectForm.name.trim()
    const key = projectForm.key.trim().toUpperCase()
    const nextErrors = {}
    if (name.length < 3 || name.length > 60) nextErrors.name = 'Use a project name between 3 and 60 characters.'
    if (!/^[A-Z][A-Z0-9]{1,5}$/.test(key)) nextErrors.key = 'Use 2–6 letters or numbers, starting with a letter.'
    if (projects.some((project) => project.key.toLowerCase() === key.toLowerCase())) nextErrors.key = 'That project key is already in use.'
    if (projectForm.description.trim().length > 240) nextErrors.description = 'Keep the description under 240 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const project = { id: `project-${Date.now()}`, name, key, description: projectForm.description.trim(), color: 'violet' }
    setProjects((current) => [...current, project])
    setActiveProjectId(project.id)
    setProjectForm({ name: '', key: '', description: '' })
    setModal(null)
    setActiveView('board')
    notify('Project created successfully')
  }

  const moveIssue = (issueId, status) => {
    setIssues((current) => current.map((issue) => issue.id === issueId ? { ...issue, status } : issue))
  }

  const viewTitle = activeView === 'issues' ? 'All issues' : activeView === 'team' ? 'Your team' : activeView === 'overview' ? 'Project overview' : 'Project board'
  const totalDone = projectIssues.filter((issue) => issue.status === 'done').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#board" onClick={(event) => { event.preventDefault(); setActiveView('board') }}>
          <span className="brand-mark"><Icon name="sparkles" size={20} /></span>
          <span>plenum<span className="brand-dot">.</span></span>
        </a>

        <button className="workspace-switcher" type="button" onClick={() => notify('You’re viewing the Plenum demo workspace')}>
          <span className="workspace-avatar">P</span>
          <span className="workspace-copy"><strong>Plenum Studio</strong><small>Free workspace</small></span>
          <Icon name="down" size={15} />
        </button>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button type="button" key={item.id} className={`nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>
              <Icon name={item.icon} size={18} /><span>{item.label}</span>
              {item.id === 'issues' && <span className="nav-count">{projectIssues.length}</span>}
            </button>
          ))}
        </nav>

        <div className="projects-heading">
          <span className="sidebar-label">YOUR PROJECTS</span>
          <button type="button" className="icon-button subtle-icon" aria-label="Create project" onClick={() => { setErrors({}); setModal('project') }}><Icon name="plus" size={16} /></button>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <button type="button" key={project.id} className={`project-link ${project.id === activeProjectId ? 'selected' : ''}`} onClick={() => { setActiveProjectId(project.id); setActiveView('board') }}>
              <span className={`project-dot dot-${project.color}`} />
              <span className="project-name">{project.name}</span>
              {project.id === activeProjectId && <Icon name="chevron" size={15} />}
            </button>
          ))}
        </div>
        <button type="button" className="add-project-link" onClick={() => { setErrors({}); setModal('project') }}><Icon name="plus" size={15} /> Add a project</button>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon"><Icon name="sparkles" size={16} /></span>
            <strong>Good things happen together.</strong>
            <p>Invite your team and make something great.</p>
            <button type="button" onClick={() => setActiveView('team')}>Meet your team <Icon name="arrow" size={14} /></button>
          </div>
          <button className="nav-item settings-link" type="button" onClick={() => notify('Workspace settings are available to admins')}><Icon name="settings" size={18} /><span>Settings</span></button>
          <div className="profile-row">
            <Avatar person="Olivia Chen" />
            <span className="profile-copy"><strong>Olivia Chen</strong><small>Workspace admin</small></span>
            <button type="button" className="icon-button subtle-icon" aria-label="Profile options" onClick={() => notify('Signed in to the local demo workspace')}><Icon name="more" size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Projects</span><Icon name="chevron" size={14} />
            <button type="button" onClick={() => setActiveView('board')}>{activeProject.name}</button><Icon name="chevron" size={14} />
            <strong>{viewTitle}</strong>
          </div>
          <div className="topbar-actions">
            <span className="keyboard-hint"><span>⌘</span> K</span>
            <button type="button" className="icon-button notification-button" aria-label="Notifications" onClick={() => notify('You’re all caught up')}><Icon name="bell" size={19} /><i /></button>
            <Avatar person="Olivia Chen" />
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div className="welcome-copy">
              <div className="eyebrow"><span className={`project-dot dot-${activeProject.color}`} /> {activeProject.key} <span className="eyebrow-divider">/</span> {activeProject.description}</div>
              <h1>{activeView === 'board' ? 'Make progress, together.' : viewTitle}</h1>
              <p className="welcome-subtitle">{activeView === 'board' ? 'A little clarity goes a long way. Here’s what your team is working on.' : `Everything happening across ${activeProject.name}.`}</p>
            </div>
            <button type="button" className="button button-primary" onClick={openIssueModal}><Icon name="plus" size={18} /> New issue</button>
          </section>

          <section className="metrics-grid" aria-label="Project summary">
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon metric-lilac"><Icon name="checklist" size={18} /></span><span className="metric-trend"><Icon name="arrow" size={13} /> 12%</span></div>
              <span className="metric-label">Total issues</span><strong className="metric-number">{projectIssues.length.toString().padStart(2, '0')}</strong>
              <span className="metric-footnote">Across this project</span>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon metric-blue"><Icon name="clock" size={18} /></span><span className="metric-status"><i className="status-dot status-violet" /> In progress</span></div>
              <span className="metric-label">Moving forward</span><strong className="metric-number">{projectIssues.filter((issue) => issue.status === 'progress').length.toString().padStart(2, '0')}</strong>
              <span className="metric-footnote">Issues in progress</span>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span className="metric-icon metric-green"><Icon name="check" size={18} /></span><span className="metric-status"><i className="status-dot status-green" /> Nice work</span></div>
              <span className="metric-label">Completed</span><strong className="metric-number">{totalDone.toString().padStart(2, '0')}</strong>
              <span className="metric-footnote">Ready for the next thing</span>
            </article>
            <article className="metric-card team-metric">
              <div className="metric-top"><span className="metric-icon metric-peach"><Icon name="users" size={18} /></span><span className="metric-label">People making it happen</span></div>
              <div className="team-avatars">{people.slice(0, 4).map((person) => <Avatar key={person.name} person={person.name} size="small" />)}<span className="team-extra">+2</span></div>
              <span className="metric-footnote">4 active contributors</span>
            </article>
          </section>

          <section className="board-panel">
            <div className="board-toolbar">
              <div className="view-tabs" role="tablist" aria-label="Issue views">
                <button type="button" role="tab" aria-selected={activeView === 'board'} className={`view-tab ${activeView === 'board' ? 'active' : ''}`} onClick={() => setActiveView('board')}><Icon name="board" size={16} /> Board</button>
                <button type="button" role="tab" aria-selected={activeView === 'issues'} className={`view-tab ${activeView === 'issues' ? 'active' : ''}`} onClick={() => setActiveView('issues')}><Icon name="checklist" size={16} /> List</button>
              </div>
              <div className="toolbar-controls">
                <label className="search-field">
                  <Icon name="search" size={17} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues..." aria-label="Search issues" maxLength={100} />
                  {search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><Icon name="close" size={14} /></button>}
                  {!search && <kbd>/</kbd>}
                </label>
                <label className="filter-select"><Icon name="filter" size={16} /><span className="sr-only">Filter by priority</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select><Icon name="down" size={13} /></label>
                <label className="filter-select status-select"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All statuses">All statuses</option><option value="todo">To do</option><option value="progress">In progress</option><option value="done">Done</option></select><Icon name="down" size={13} /></label>
                <label className="filter-select assignee-select"><span className="sr-only">Filter by assignee</span><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option>Everyone</option>{people.map((person) => <option key={person.name}>{person.name}</option>)}</select><Icon name="down" size={13} /></label>
                <button type="button" className="icon-button toolbar-more" aria-label="More board options" onClick={() => notify('You’re viewing the latest issues')}><Icon name="more" size={20} /></button>
              </div>
            </div>

            {activeView === 'board' ? (
              <div className="kanban-board">
                {columns.map((column) => {
                  const columnIssues = visibleIssues.filter((issue) => issue.status === column.id)
                  return (
                    <section key={column.id} className={`kanban-column column-${column.color}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (draggedIssueId) moveIssue(draggedIssueId, column.id); setDraggedIssueId(null) }}>
                      <div className="column-heading">
                        <div className="column-title"><span className={`column-icon ${column.color}`}><Icon name={column.icon} size={14} /></span><h2>{column.title}</h2><span className="column-count">{columnIssues.length}</span></div>
                        <button type="button" className="icon-button subtle-icon" aria-label={`Add issue to ${column.title}`} onClick={openIssueModal}><Icon name="plus" size={16} /></button>
                      </div>
                      <div className="issue-stack">
                        {columnIssues.map((issue) => (
                          <article className="issue-card" key={issue.id} role="button" tabIndex={0} aria-label={`${issue.id}: ${issue.title}`} draggable onDragStart={() => setDraggedIssueId(issue.id)} onDragEnd={() => setDraggedIssueId(null)} onClick={() => setModal({ type: 'detail', issue })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setModal({ type: 'detail', issue }) } }}>
                            <div className="issue-card-top"><span className={`issue-type type-${issue.type.toLowerCase()}`}>{issue.type}</span><button type="button" className="icon-button card-menu" aria-label={`More options for ${issue.id}`} onClick={(event) => { event.stopPropagation(); setModal({ type: 'detail', issue }) }}><Icon name="more" size={17} /></button></div>
                            <h3>{issue.title}</h3>
                            <div className="issue-id-row"><span>{issue.id}</span><span className={`priority priority-${issue.priority.toLowerCase()}`}><i />{issue.priority}</span></div>
                            <div className="issue-card-footer"><span className="issue-date"><Icon name="calendar" size={13} /> {issue.date}</span><Avatar person={issue.assignee} size="small" /></div>
                          </article>
                        ))}
                        {columnIssues.length === 0 && <div className="empty-column">{search || priorityFilter !== 'All priorities' || assigneeFilter !== 'Everyone' || statusFilter !== 'All statuses' ? 'No matching issues' : 'A fresh start. Add an issue when you’re ready.'}</div>}
                      </div>
                      <button type="button" className="column-add" onClick={openIssueModal}><Icon name="plus" size={15} /> Add issue</button>
                    </section>
                  )
                })}
              </div>
            ) : activeView === 'issues' ? (
              <div className="issue-list-view">
                <div className="list-heading"><span>Issue</span><span>Status</span><span>Priority</span><span>Assignee</span><span>Created</span></div>
                {visibleIssues.length ? visibleIssues.map((issue) => <button type="button" className="list-row" key={issue.id} onClick={() => setModal({ type: 'detail', issue })}><span className="list-issue-title"><span className={`issue-type type-${issue.type.toLowerCase()}`}>{issue.type}</span><strong>{issue.title}</strong><small>{issue.id}</small></span><span className={`list-status status-${issue.status}`}>{issue.status === 'todo' ? 'To do' : issue.status === 'progress' ? 'In progress' : 'Done'}</span><span className={`priority priority-${issue.priority.toLowerCase()}`}><i />{issue.priority}</span><span className="list-assignee"><Avatar person={issue.assignee} size="small" />{issue.assignee}</span><span className="list-date">{issue.date}</span></button>) : <div className="list-empty">No issues match those filters.</div>}
              </div>
            ) : activeView === 'team' ? (
              <div className="team-view"><div className="team-view-header"><div><h2>Better work, together.</h2><p>Meet the people moving {activeProject.name} forward.</p></div><button type="button" className="button button-secondary" onClick={() => notify('Team invitations require a connected backend')}><Icon name="plus" size={16} /> Invite people</button></div><div className="team-grid">{people.map((person, index) => <article className="member-card" key={person.name}><Avatar person={person.name} size="large" /><div><strong>{person.name}</strong><span>{index === 0 ? 'Admin' : index === 1 ? 'Developer' : index === 2 ? 'Designer' : 'Developer'}</span></div><span className={`member-presence presence-${index}`}><i /> {index === 2 ? 'Away' : 'Active'}</span></article>)}</div><div className="permission-note"><Icon name="lock" size={16} /> Roles are shown for this demo. Enforce project permissions on your server before shipping.</div></div>
            ) : (
              <div className="overview-view"><div className="overview-intro"><span className="overview-art"><Icon name="sparkles" size={27} /></span><h2>Every good project starts somewhere.</h2><p>Your team has <strong>{projectIssues.length} issues</strong> in {activeProject.name}. Keep the momentum going—take a look at what needs attention or add something new.</p><button className="button button-primary" type="button" onClick={openIssueModal}><Icon name="plus" size={17} /> Create an issue</button></div><div className="overview-activity"><h2>Recently updated</h2>{projectIssues.slice(0, 3).map((issue) => <button type="button" className="activity-row" key={issue.id} onClick={() => setModal({ type: 'detail', issue })}><span className="activity-dot" /><span><strong>{issue.title}</strong><small>{issue.id} · {issue.date}</small></span><Avatar person={issue.assignee} size="small" /></button>)}</div></div>
            )}
            <div className="board-footer"><span><span className="live-dot" /> Everything is up to date</span><span>Last updated just now</span></div>
          </section>
          <footer className="page-footer"><span>Made for teams who make things happen.</span><span><span className="footer-shape">✳</span> Plenum workspace</span></footer>
        </div>
      </main>

      {modal === 'issue' && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="issue-modal-title">
            <div className="modal-heading"><div><span className="modal-eyebrow">NEW ISSUE · {activeProject.key}</span><h2 id="issue-modal-title">Add a little detail.</h2><p>Give your team the context they need to get moving.</p></div><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={() => setModal(null)}><Icon name="close" /></button></div>
            <form onSubmit={saveIssue} noValidate>
              <label className="form-field"><span>Issue title <b>*</b></span><input autoFocus value={issueForm.title} onChange={(event) => { setIssueForm({ ...issueForm, title: event.target.value }); setErrors({ ...errors, title: '' }) }} placeholder="What needs to be done?" minLength={5} maxLength={100} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : 'title-hint'} />{errors.title ? <small id="title-error" className="field-error">{errors.title}</small> : <small id="title-hint" className="field-hint">A specific, easy-to-understand summary.</small>}</label>
              <label className="form-field"><span>Description <b>*</b></span><textarea value={issueForm.description} onChange={(event) => { setIssueForm({ ...issueForm, description: event.target.value }); setErrors({ ...errors, description: '' }) }} placeholder="Add steps to reproduce, context, or acceptance criteria…" rows={4} maxLength={1000} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error' : 'description-hint'} />{errors.description ? <small id="description-error" className="field-error">{errors.description}</small> : <small id="description-hint" className="field-hint">{issueForm.description.length}/1,000 · At least 10 characters.</small>}</label>
              <div className="form-grid">
                <label className="form-field"><span>Type</span><select value={issueForm.type} onChange={(event) => setIssueForm({ ...issueForm, type: event.target.value })}><option>Bug</option><option>Feature</option><option>Improvement</option><option>Design</option><option>Documentation</option></select></label>
                <label className="form-field"><span>Priority</span><select value={issueForm.priority} onChange={(event) => setIssueForm({ ...issueForm, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
                <label className="form-field"><span>Status</span><select value={issueForm.status} onChange={(event) => setIssueForm({ ...issueForm, status: event.target.value })}><option value="todo">To do</option><option value="progress">In progress</option><option value="done">Done</option></select></label>
                <label className="form-field"><span>Assignee <b>*</b></span><select value={issueForm.assignee} onChange={(event) => { setIssueForm({ ...issueForm, assignee: event.target.value }); setErrors({ ...errors, assignee: '' }) }} aria-invalid={Boolean(errors.assignee)}><option value="">Choose a teammate</option>{people.map((person) => <option key={person.name} value={person.name}>{person.name}</option>)}</select>{errors.assignee && <small className="field-error">{errors.assignee}</small>}</label>
              </div>
              <div className="modal-actions"><span className="required-note"><b>*</b> Required fields</span><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="button button-primary"><Icon name="plus" size={16} /> Create issue</button></div>
            </form>
          </section>
        </div>
      )}

      {modal === 'project' && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
          <section className="modal-card project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
            <div className="modal-heading"><div><span className="modal-eyebrow">A NEW SPACE TO CREATE</span><h2 id="project-modal-title">Start a project.</h2><p>Give your team a home for the work that matters.</p></div><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={() => setModal(null)}><Icon name="close" /></button></div>
            <form onSubmit={saveProject} noValidate>
              <label className="form-field"><span>Project name <b>*</b></span><input autoFocus value={projectForm.name} onChange={(event) => { setProjectForm({ ...projectForm, name: event.target.value }); setErrors({ ...errors, name: '' }) }} placeholder="e.g. Mobile app" maxLength={60} aria-invalid={Boolean(errors.name)} />{errors.name && <small className="field-error">{errors.name}</small>}</label>
              <label className="form-field"><span>Project key <b>*</b></span><input value={projectForm.key} onChange={(event) => { setProjectForm({ ...projectForm, key: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }); setErrors({ ...errors, key: '' }) }} placeholder="e.g. MOB" maxLength={6} aria-invalid={Boolean(errors.key)} /><small className={errors.key ? 'field-error' : 'field-hint'}>{errors.key || 'A short, unique key for issue IDs (2–6 characters).'}</small></label>
              <label className="form-field"><span>Description <small>(optional)</small></span><textarea value={projectForm.description} onChange={(event) => { setProjectForm({ ...projectForm, description: event.target.value }); setErrors({ ...errors, description: '' }) }} placeholder="What is this project about?" rows={3} maxLength={240} aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}</label>
              <div className="modal-actions"><span className="required-note"><b>*</b> Required fields</span><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="button button-primary"><Icon name="plus" size={16} /> Create project</button></div>
            </form>
          </section>
        </div>
      )}

      {modal?.type === 'detail' && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null) }}>
          <section className="modal-card detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="modal-heading"><div><span className={`issue-type type-${modal.issue.type.toLowerCase()}`}>{modal.issue.type}</span><h2 id="detail-title">{modal.issue.title}</h2><span className="detail-id">{modal.issue.id} · Created {modal.issue.date.toLowerCase()}</span></div><button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={() => setModal(null)}><Icon name="close" /></button></div>
            <p className="detail-description">{modal.issue.description}</p>
            <div className="detail-properties"><div><span>Status</span><select value={modal.issue.status} onChange={(event) => { moveIssue(modal.issue.id, event.target.value); setModal({ type: 'detail', issue: { ...modal.issue, status: event.target.value } }) }}><option value="todo">To do</option><option value="progress">In progress</option><option value="done">Done</option></select></div><div><span>Priority</span><strong className={`priority priority-${modal.issue.priority.toLowerCase()}`}><i />{modal.issue.priority}</strong></div><div><span>Assignee</span><span className="detail-assignee"><Avatar person={modal.issue.assignee} size="small" />{modal.issue.assignee}</span></div></div>
            <div className="detail-footer"><span><Icon name="lock" size={15} /> Changes are saved in this demo session.</span><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Done</button></div>
          </section>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </div>
  )
}

export default App
