import { useEffect, useState } from 'react'
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
const authPageIds = new Set(['login', 'signup', 'forgot-password', 'reset-password'])
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
  'reset-password': 'Reset password',
}

function routeFromPath(path) {
  const page = path.split('/').filter(Boolean)[0]
  return pageIds.has(page) || authPageIds.has(page) ? page : 'board'
}

function LoadingMessage({ children }) {
  return <main className="auth-page"><p role="status">{children}</p></main>
}

export default function App() {
  const auth = useAuth()
  const currentUser = auth.currentUser
  const [filters, setFilters] = useState({
    search: '',
    priority: 'All priorities',
    status: 'All statuses',
    assignee: 'Everyone',
    sortBy: 'createdAt',
    order: 'desc',
  })
  const store = useWorkspace({
    enabled: Boolean(currentUser),
    userId: currentUser?.id,
    userRole: currentUser?.role,
    filters,
  })
  const {
    projects, issues, allIssues, members, invitations, workspace: loadedWorkspace,
    activeProjectId, loading: workspaceLoading, error: workspaceError,
    setActiveProjectId, createProject, updateProject, deleteProject, createIssue, updateIssue, deleteIssue,
    inviteMember, cancelInvitation, resendInvitation, updateMemberRole,
    removeMember, updateWorkspace, updateCurrentMember, exportData,
  } = store
  const [page, setPage] = useState(() => routeFromPath(window.location.pathname))
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState('')

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0] ?? null
  const workspace = loadedWorkspace ?? { name: 'Workspace', description: '' }
  const isAdmin = currentUser?.role === 'Admin'
  const canManageProjects = ['Admin', 'Manager'].includes(currentUser?.role)
  const canEdit = currentUser?.role !== 'Viewer'
  const activeProfile = currentUser ?? { name: '', email: '', role: '' }
  const visiblePage = currentUser
    ? authPageIds.has(page) ? 'board' : page
    : authPageIds.has(page) ? page : 'login'
  const projectIssues = allIssues
  const visibleIssues = issues
  const openIssueCount = projectIssues.filter((issue) => issue.status !== 'done').length

  const navigate = (nextPage) => {
    if (!pageIds.has(nextPage) && !authPageIds.has(nextPage)) return
    window.history.pushState({}, '', `/${nextPage}`)
    setPage(nextPage)
  }

  const notify = (message) => setToast(message)

  useEffect(() => {
    if (auth.loading) return
    if (window.location.pathname !== `/${visiblePage}`) {
      window.history.replaceState({}, '', `/${visiblePage}`)
    }
  }, [auth.loading, visiblePage])

  useEffect(() => {
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
  }, [currentUser])

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
    if (!project) return notify('Create a project before adding issues.')
    setDialog({ type: 'issue', status })
  }

  const openEditIssue = (issue) => setDialog({ type: 'issue', issueId: issue.id, readOnly: !canEdit })
  const issueId = dialog?.issueId
  const selectedIssue = issueId ? projectIssues.find((issue) => issue.id === issueId) : null
  const issueProject = selectedIssue ? projects.find((item) => item.id === selectedIssue.projectId) ?? project : project
  const issueMembers = issueProject
    ? members.filter((member) => issueProject.memberIds.includes(member.id))
    : []

  const saveIssue = async (issueToUpdate, values) => {
    const payload = {
      title: values.title,
      description: values.description,
      type: values.type,
      priority: values.priority,
      status: values.status,
      assigneeId: values.assigneeId || null,
    }
    if (issueToUpdate) {
      await updateIssue(issueToUpdate, payload)
      notify('Issue updated')
    } else {
      await createIssue(project, payload)
      notify('Issue created')
    }
    setDialog(null)
  }

  const removeIssue = async (issue) => {
    if (!canManageProjects) return notify('Only an admin or manager can delete issues.')
    if (!window.confirm(`Delete ${issue.id}: ${issue.title}? This cannot be undone.`)) return
    try {
      await deleteIssue(issue.id)
      setDialog(null)
      notify('Issue deleted')
    } catch (error) {
      notify(error.message)
    }
  }

  const saveProject = async (values) => {
    if (!canManageProjects) return notify('Only an admin or manager can create projects.')
    if (dialog?.projectId) {
      await updateProject(dialog.projectId, { name: values.name, description: values.description })
      setDialog(null)
      notify('Project updated')
      return
    }
    const created = await createProject(values)
    setDialog(null)
    navigate('board')
    notify('Project created')
    return created
  }

  const handleDeleteProject = async (target) => {
    if (!isAdmin) return notify('Only an admin can delete projects.')
    if (!window.confirm(`Delete ${target.name} and all of its issues? This cannot be undone.`)) return
    try {
      await deleteProject(target.id)
      notify(`${target.name} was deleted`)
    } catch (error) {
      notify(error.message)
    }
  }

  const registerAccount = (values) => auth.register(values)
  const loginAccount = (values) => auth.login(values)

  const saveAccountProfile = async (values) => {
    const user = await auth.updateProfile(values)
    updateCurrentMember(user)
  }

  const changeAccountRole = async (id, role) => {
    try {
      await updateMemberRole(id, role)
      const member = members.find((item) => item.id === id)
      notify(`${member?.email ?? 'Member'} access updated to ${role}`)
    } catch (error) {
      notify(error.message)
    }
  }

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from this workspace? Their account and access will be removed.`)) return
    try {
      await removeMember(member.id)
      notify(`${member.name} was removed`)
    } catch (error) {
      notify(error.message)
    }
  }

  const handleInvitationCancel = (id) => cancelInvitation(id)

  const signOut = async () => {
    try {
      await auth.logout()
      window.history.pushState({}, '', '/login')
      setPage('login')
      setDialog(null)
    } catch (error) {
      notify(error.message)
    }
  }

  const moveIssue = async (id, status) => {
    if (!canEdit) return
    try {
      await updateIssue(id, { status })
    } catch (error) {
      notify(error.message)
    }
  }

  const pageContent = visiblePage === 'settings'
    ? <SettingsPage
      key={`${workspace.name}|${workspace.description}|${activeProfile.name}|${activeProfile.email}`}
      workspace={workspace}
      profile={activeProfile}
      projects={projects}
      isAdmin={isAdmin}
      canManageProjects={canManageProjects}
      onSaveWorkspace={updateWorkspace}
      onSaveProfile={saveAccountProfile}
      onChangePassword={auth.changePassword}
      onEditProject={(target) => setDialog({ type: 'project', projectId: target.id })}
      onDeleteProject={handleDeleteProject}
      exportData={exportData}
      notify={notify}
    />
    : visiblePage === 'team'
      ? <TeamPage
        members={members}
        invitations={invitations}
        currentUserId={currentUser.id}
        ownerId={workspace.ownerId}
        canManage={canManageProjects}
        canAdmin={isAdmin}
        onRoleChange={changeAccountRole}
        onRemoveMember={handleRemoveMember}
        onInvite={inviteMember}
        onResendInvitation={resendInvitation}
        onCancelInvitation={handleInvitationCancel}
        notify={notify}
      />
      : !project
        ? <section className="board-panel workspace-empty"><span className="empty-art"><Icon name="board" size={26} /></span><h2>Your workspace is ready.</h2><p>Create a project to start organizing issues and inviting your team.</p>{canManageProjects && <button type="button" className="button button-primary" onClick={() => setDialog({ type: 'project' })}><Icon name="plus" size={16} /> Create your first project</button>}</section>
        : visiblePage === 'overview'
          ? <OverviewPage project={project} issues={projectIssues} members={members} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} canEdit={canEdit} />
          : visiblePage === 'board'
            ? <BoardPage issues={visibleIssues} summaryIssues={projectIssues} members={members} filters={filters} onFiltersChange={setFilters} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} onMoveIssue={moveIssue} onNavigate={navigate} canEdit={canEdit} />
            : <IssuesPage issues={visibleIssues} members={members} filters={filters} onFiltersChange={setFilters} onOpenIssue={openEditIssue} onCreateIssue={openNewIssue} onNavigate={navigate} canEdit={canEdit} />

  if (auth.loading) return <LoadingMessage>Checking your Plenqora session…</LoadingMessage>

  if (!currentUser) {
    return <AuthPage
      mode={authPageIds.has(page) ? page : 'login'}
      onNavigate={navigate}
      onLogin={loginAccount}
      onRegister={registerAccount}
      onRequestPasswordReset={auth.requestPasswordReset}
      onResetPassword={auth.resetPassword}
      onValidateResetToken={auth.validateResetToken}
      connectionError={auth.connectionError}
      connectionErrorTitle={auth.connectionErrorTitle}
    />
  }

  if (workspaceLoading && !loadedWorkspace) return <LoadingMessage>Loading your workspace…</LoadingMessage>
  if (workspaceError) return <main className="auth-page"><section className="auth-card"><h1>Workspace unavailable</h1><p className="auth-error" role="alert">{workspaceError}</p><button className="button button-primary" type="button" onClick={() => window.location.reload()}>Retry</button></section></main>

  return (
    <WorkspaceLayout
      page={visiblePage}
      project={project}
      projects={projects}
      workspace={workspace}
      profile={activeProfile}
      issueCount={projectIssues.length}
      canCreateProjects={canManageProjects}
      onNavigate={navigate}
      onCreateProject={() => { if (canManageProjects) setDialog({ type: 'project' }); else notify('Only an admin or manager can create projects.') }}
      onSelectProject={(selected) => { setActiveProjectId(selected.id); navigate('board') }}
      onNotify={() => { setFilters((current) => ({ ...current, status: 'All statuses' })); navigate('issues'); notify(`${openIssueCount} open issues in ${project?.name ?? workspace.name}`) }}
      onLogout={signOut}
    >
      <div className="page-content">
        <section className="welcome-row">
          <div className="welcome-copy">
            <div className="eyebrow">{project ? <><span className={`project-dot dot-${project.color}`} /> {project.key} <span className="eyebrow-divider">/</span> {project.description || workspace.name}</> : workspace.name}</div>
            <h1>{titles[visiblePage] ?? authTitles[visiblePage]}</h1>
            <p className="welcome-subtitle">{visiblePage === 'board' ? 'A little clarity goes a long way. Here’s what your team is working on.' : `Everything happening across ${project?.name ?? workspace.name}.`}</p>
          </div>
          {project && visiblePage !== 'settings' && visiblePage !== 'team' && canEdit && <button type="button" className="button button-primary" onClick={() => openNewIssue()}><Icon name="plus" size={18} /> New issue</button>}
        </section>
        {pageContent}
        <footer className="page-footer"><span>Made for teams who make things happen.</span><span><span className="footer-shape">✳</span> Plenqora workspace</span></footer>
      </div>
      {dialog?.type === 'project' && <ProjectDialog projects={projects} project={projects.find((item) => item.id === dialog.projectId) ?? null} onClose={() => setDialog(null)} onSave={saveProject} />}
      {dialog?.type === 'issue' && (issueId
        ? selectedIssue && <IssueDialog key={selectedIssue.id} issue={selectedIssue} project={issueProject} members={issueMembers} readOnly={dialog.readOnly} canDelete={canManageProjects} onClose={() => setDialog(null)} onSave={(values) => saveIssue(issueId, values)} onDelete={removeIssue} />
        : project && <IssueDialog key={`new-${dialog.status}`} issue={null} initialStatus={dialog.status} project={project} members={issueMembers} onClose={() => setDialog(null)} onSave={(values) => saveIssue(null, values)} onDelete={removeIssue} />)}
      {toast && <div className="toast-message" role="status"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </WorkspaceLayout>
  )
}
