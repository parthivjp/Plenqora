import { useEffect, useMemo, useState } from 'react'
import Icon from './components/Icon'
import IssueDialog from './components/IssueDialog'
import ProjectDialog from './components/ProjectDialog'
import WorkspaceLayout from './components/WorkspaceLayout'
import AuthPage from './pages/AuthPage'
import { useAuth } from './hooks/useAuth'
import { useWorkspace } from './hooks/useWorkspace'
import BoardPage from './pages/BoardPage'
import IssuesPage from './pages/IssuesPage'
import OverviewPage from './pages/OverviewPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import './App.css'

const pageIds = new Set(['overview', 'board', 'issues', 'team', 'settings'])
const authPageIds = new Set(['login', 'signup', 'forgot-password'])
const titles = {
  overview: 'Project overview',
  board: 'Make progress, together.',
  issues: 'All issues',
  team: 'Your team',
  settings: 'Workspace settings',
}
const authTitles = {
  login: 'Sign in',
  signup: 'Create account',
  'forgot-password': 'Password reset',
}

function routeFromPath(path) {
  const page = path.split('/').filter(Boolean)[0]
  return pageIds.has(page) || authPageIds.has(page) ? page : 'board'
}

export default function App() {
  const store = useWorkspace()
  const auth = useAuth()
  const currentUser = auth.currentUser
  const {
    projects, issues, members, workspace, profile, activeProjectId, storageWarning,
    setActiveProjectId, createProject, createIssue, updateIssue, deleteIssue, inviteMember, upsertMember, updateMemberRole,
    updateWorkspace, updateProfile, resetWorkspace,
  } = store
  const [page, setPage] = useState(() => {
    const requested = routeFromPath(window.location.pathname)
    if (auth.currentUser) return authPageIds.has(requested) ? 'board' : requested
    return authPageIds.has(requested) ? requested : 'login'
  })
  const [filters, setFilters] = useState({ search: '', priority: 'All priorities', status: 'All statuses', assignee: 'Everyone' })
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0]
  const isAdmin = currentUser?.role === 'Admin'
  const canEdit = currentUser?.role !== 'Viewer'
  const activeProfile = currentUser ? { ...profile, name: currentUser.name, email: currentUser.email, role: currentUser.role } : profile
  const projectId = project.id
  const projectIssues = useMemo(() => issues.filter((issue) => issue.projectId === projectId), [issues, projectId])
  const visibleIssues = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return projectIssues.filter((issue) => (
      `${issue.title} ${issue.id} ${issue.assignee} ${issue.description}`.toLowerCase().includes(query)
      && (filters.priority === 'All priorities' || issue.priority === filters.priority)
      && (filters.assignee === 'Everyone' || issue.assignee === filters.assignee)
      && (filters.status === 'All statuses' || issue.status === filters.status)
    ))
  }, [projectIssues, filters])

  const navigate = (nextPage) => {
    if (!pageIds.has(nextPage) && !authPageIds.has(nextPage)) return
    window.history.pushState({}, '', `/${nextPage}`)
    setPage(nextPage)
  }

  const notify = (message) => setToast(message)

  useEffect(() => {
    if (window.location.pathname !== `/${page}`) window.history.replaceState({}, '', `/${page}`)
    const onPopState = () => {
      const requested = routeFromPath(window.location.pathname)
      const nextPage = currentUser
        ? authPageIds.has(requested) ? 'board' : requested
        : authPageIds.has(requested) ? requested : 'login'
      if (nextPage !== requested) window.history.replaceState({}, '', `/${nextPage}`)
      setPage(nextPage)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [currentUser, page])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dialog) {
        setDialog(null)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        navigate('issues')
        window.setTimeout(() => document.querySelector('[aria-label="Search issues"]')?.focus(), 0)
      } else if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !dialog) {
        event.preventDefault()
        navigate('issues')
        window.setTimeout(() => document.querySelector('[aria-label="Search issues"]')?.focus(), 0)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialog])

  const openNewIssue = (status = 'todo') => {
    if (!canEdit) return notify('Your Viewer role has read-only access.')
    setDialog({ type: 'issue', status })
  }
  const openEditIssue = (issue) => setDialog({ type: 'issue', issueId: issue.id, readOnly: !canEdit })
  const issueId = dialog?.issueId
  const selectedIssue = issueId ? issues.find((issue) => issue.id === issueId) : null

  const saveIssue = (issueToUpdate, values) => {
    if (!canEdit) return notify('Your Viewer role has read-only access.')
    if (issueToUpdate) {
      updateIssue(issueToUpdate, values)
      notify('Issue updated')
    } else {
      createIssue(project, values)
      notify('Issue created')
    }
    setDialog(null)
  }

  const removeIssue = (issue) => {
    if (!isAdmin) return notify('Only an admin can delete issues.')
    if (!window.confirm(`Delete ${issue.id}: ${issue.title}? This cannot be undone.`)) return
    deleteIssue(issue.id)
    setDialog(null)
    notify('Issue deleted')
  }

  const saveProject = (values) => {
    if (!isAdmin) return notify('Only an admin can create projects.')
    const created = createProject(values)
    setActiveProjectId(created.id)
    setDialog(null)
    navigate('board')
    notify('Project created')
  }

  const exportData = () => {
    if (!isAdmin) return notify('Only an admin can export workspace data.')
    const payload = {
      exportedAt: new Date().toISOString(),
      workspace,
      profile,
      projects,
      issues,
      members,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'plenqora-workspace.json'
    link.click()
    URL.revokeObjectURL(url)
    notify('Workspace data exported')
  }

  const completeAuthentication = (account) => {
    updateProfile({ name: account.name, email: account.email })
    upsertMember(account)
  }

  const registerAccount = async (values) => {
    const account = await auth.register(values)
    completeAuthentication(account)
    return account
  }

  const loginAccount = async (values) => {
    const account = await auth.login(values)
    completeAuthentication(account)
    return account
  }

  const saveAccountProfile = (values) => {
    const { previousEmail, account } = auth.updateAccount(values)
    updateProfile(values)
    upsertMember(account, previousEmail)
  }

  const changeAccountRole = (email, role) => {
    try {
      auth.updateRole(email, role)
      updateMemberRole(email, role)
      notify(`${email} access updated to ${role}`)
    } catch (error) {
      notify(error.message)
    }
  }

  const signOut = () => {
    auth.logout()
    window.history.pushState({}, '', '/login')
    setPage('login')
    setDialog(null)
  }

  const pageContent = page === 'overview'
    ? <OverviewPage project={project} issues={projectIssues} members={members} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} canEdit={canEdit} />
    : page === 'board'
      ? <BoardPage issues={visibleIssues} summaryIssues={projectIssues} members={members} filters={filters} onFiltersChange={setFilters} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} onMoveIssue={(id, status) => { if (canEdit) updateIssue(id, { status }) }} onNavigate={navigate} canEdit={canEdit} />
      : page === 'issues'
        ? <IssuesPage issues={visibleIssues} members={members} filters={filters} onFiltersChange={setFilters} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} onNavigate={navigate} canEdit={canEdit} />
        : page === 'team'
          ? <TeamPage members={members} accounts={auth.accounts} currentEmail={currentUser?.email} canManage={isAdmin} onRoleChange={changeAccountRole} onInvite={inviteMember} notify={notify} />
          : <SettingsPage key={`${workspace.name}|${workspace.description}|${activeProfile.name}|${activeProfile.email}`} workspace={workspace} profile={activeProfile} isAdmin={isAdmin} onSaveWorkspace={updateWorkspace} onSaveProfile={saveAccountProfile} onChangePassword={auth.changePassword} onReset={resetWorkspace} exportData={exportData} notify={notify} />

  const openIssueCount = projectIssues.filter((issue) => issue.status !== 'done').length
  const localStorageWarning = storageWarning || auth.storageWarning

  if (!currentUser) {
    return <AuthPage mode={authPageIds.has(page) ? page : 'login'} onNavigate={navigate} onLogin={loginAccount} onRegister={registerAccount} storageWarning={auth.storageWarning} />
  }

  if (authPageIds.has(page)) {
    return <div className="auth-redirect" role="status">Opening your workspace…</div>
  }

  return (
    <WorkspaceLayout
      page={page}
      project={project}
      projects={projects}
      workspace={workspace}
      profile={activeProfile}
      issueCount={projectIssues.length}
      canCreateProjects={isAdmin}
      onNavigate={navigate}
      onCreateProject={() => { if (isAdmin) setDialog({ type: 'project' }); else notify('Only an admin can create projects.') }}
      onSelectProject={(selected) => { setActiveProjectId(selected.id); navigate('board') }}
      onNotify={() => { setFilters((current) => ({ ...current, status: 'All statuses' })); navigate('issues'); notify(`${openIssueCount} open issues in ${project.name}`) }}
      onLogout={signOut}
    >
      <div className="page-content">
        {localStorageWarning && <div className="storage-warning" role="alert">{localStorageWarning}</div>}
        <section className="welcome-row">
          <div className="welcome-copy">
            <div className="eyebrow"><span className={`project-dot dot-${project.color}`} /> {project.key} <span className="eyebrow-divider">/</span> {project.description || workspace.name}</div>
            <h1>{titles[page] ?? authTitles[page]}</h1>
            <p className="welcome-subtitle">{page === 'board' ? 'A little clarity goes a long way. Here’s what your team is working on.' : `Everything happening across ${project.name}.`}</p>
          </div>
          {page !== 'settings' && canEdit && <button type="button" className="button button-primary" onClick={() => openNewIssue()}><Icon name="plus" size={18} /> New issue</button>}
        </section>
        {pageContent}
        <footer className="page-footer"><span>Made for teams who make things happen.</span><span><span className="footer-shape">✳</span> Plenqora workspace</span></footer>
      </div>
      {dialog?.type === 'project' && <ProjectDialog projects={projects} onClose={() => setDialog(null)} onSave={saveProject} />}
      {dialog?.type === 'issue' && (issueId ? selectedIssue && <IssueDialog key={selectedIssue.id} issue={selectedIssue} project={projects.find((item) => item.id === selectedIssue.projectId) ?? project} members={members} readOnly={dialog.readOnly} canDelete={isAdmin} onClose={() => setDialog(null)} onSave={(values) => saveIssue(issueId, values)} onDelete={removeIssue} /> : <IssueDialog key={`new-${dialog?.status}`} issue={null} initialStatus={dialog?.status} project={project} members={members} onClose={() => setDialog(null)} onSave={(values) => saveIssue(null, values)} onDelete={removeIssue} />)}
      {toast && <div className="toast-message" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </WorkspaceLayout>
  )
}
