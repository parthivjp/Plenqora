import { useEffect, useRef, useState } from 'react'
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, subscribeToWorkspaceUpdates } from '../api/client'

const emptyWorkspace = {
  workspace: null,
  projects: [],
  members: [],
  invitations: [],
  activeProjectId: null,
  allIssues: [],
  issues: [],
  userId: null,
  allIssuesProjectId: null,
  issuesProjectId: null,
}

export function useWorkspace({ enabled, userId, userRole, filters }) {
  const [data, setData] = useState(emptyWorkspace)
  const [loadedUserId, setLoadedUserId] = useState(null)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const requestVersion = useRef(0)
  const search = filters?.search ?? ''
  const priority = filters?.priority ?? 'All priorities'
  const status = filters?.status ?? 'All statuses'
  const assignee = filters?.assignee ?? 'Everyone'
  const sortBy = filters?.sortBy ?? 'createdAt'
  const order = filters?.order ?? 'desc'
  const visibleData = data.userId === userId ? data : emptyWorkspace
  const activeProjectId = visibleData.activeProjectId
  const allIssues = visibleData.allIssuesProjectId === activeProjectId ? visibleData.allIssues : []
  const issues = visibleData.issuesProjectId === activeProjectId ? visibleData.issues : []

  useEffect(() => {
    let active = true
    if (!enabled || !userId) return () => { active = false }

    Promise.all([
      apiGet('/workspace/bootstrap'),
      ['Admin', 'Manager'].includes(userRole) ? apiGet('/workspace/invitations') : Promise.resolve({ invitations: [] }),
    ])
      .then(([workspaceData, invitationData]) => {
        if (!active) return
        setData((current) => {
          const projects = workspaceData.projects
          const currentProjectId = current.userId === userId ? current.activeProjectId : null
          const retainedId = projects.some((project) => project.id === currentProjectId)
            ? currentProjectId
            : projects[0]?.id ?? null
          return {
            ...current,
            userId,
            workspace: workspaceData.workspace,
            projects,
            members: workspaceData.members,
            invitations: invitationData.invitations,
            activeProjectId: retainedId,
          }
        })
        setError('')
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoadedUserId(userId)
      })
    return () => { active = false }
  }, [enabled, userId, userRole, refreshVersion])

  useEffect(() => {
    if (!enabled || !userId) return undefined
    return subscribeToWorkspaceUpdates(() => {
      setRefreshVersion((current) => current + 1)
    })
  }, [enabled, userId])

  useEffect(() => {
    if (!enabled || !userId || !activeProjectId) return undefined
    let active = true
    const projectId = activeProjectId
    apiGet(`/projects/${projectId}/issues?sortBy=updatedAt&order=desc`)
      .then(({ issues }) => {
        if (active) setData((current) => ({ ...current, allIssues: issues, allIssuesProjectId: projectId }))
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
    return () => { active = false }
  }, [enabled, userId, activeProjectId, refreshVersion])

  useEffect(() => {
    if (!enabled || !userId || !activeProjectId) return undefined
    let active = true
    const currentRequest = ++requestVersion.current
    const projectId = activeProjectId
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams()
      params.set('search', search.trim())
      params.set('priority', priority === 'All priorities' ? 'all' : priority)
      params.set('status', status === 'All statuses' ? 'all' : status)
      params.set('assignee', assignee === 'Everyone' ? 'all' : assignee)
      params.set('sortBy', sortBy)
      params.set('order', order)
      apiGet(`/projects/${projectId}/issues?${params}`)
        .then(({ issues }) => {
          if (active && requestVersion.current === currentRequest) {
            setData((current) => ({ ...current, issues, issuesProjectId: projectId }))
          }
        })
        .catch((loadError) => {
          if (active && requestVersion.current === currentRequest) setError(loadError.message)
        })
    }, search ? 220 : 0)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [enabled, userId, activeProjectId, refreshVersion, search, priority, status, assignee, sortBy, order])

  const setActiveProjectId = (id) => setData((current) => ({ ...current, activeProjectId: id, userId }))

  const createProject = async (values) => {
    const { project } = await apiPost('/projects', values)
    setData((current) => ({
      ...current,
      projects: [project, ...current.projects],
      activeProjectId: project.id,
    }))
    return project
  }

  const updateProject = async (id, values) => {
    const { project } = await apiPatch(`/projects/${id}`, values)
    setData((current) => ({
      ...current,
      projects: current.projects.map((entry) => entry.id === id ? project : entry),
    }))
    return project
  }

  const deleteProject = async (id) => {
    await apiDelete(`/projects/${id}`)
    setData((current) => {
      const projects = current.projects.filter((project) => project.id !== id)
      return {
        ...current,
        projects,
        activeProjectId: current.activeProjectId === id ? projects[0]?.id ?? null : current.activeProjectId,
      }
    })
    setRefreshVersion((current) => current + 1)
  }

  const createIssue = async (project, values) => {
    const { issue } = await apiPost(`/projects/${project.id}/issues`, values)
    setRefreshVersion((current) => current + 1)
    return issue
  }

  const updateIssue = async (id, changes) => {
    const { issue } = await apiPatch(`/issues/${encodeURIComponent(id)}`, changes)
    setRefreshVersion((current) => current + 1)
    return issue
  }

  const deleteIssue = async (id) => {
    await apiDelete(`/issues/${encodeURIComponent(id)}`)
    setRefreshVersion((current) => current + 1)
  }

  const inviteMember = async ({ email, role }) => {
    const { invitation } = await apiPost('/workspace/invitations', { email, role })
    setData((current) => ({ ...current, invitations: [invitation, ...current.invitations] }))
    return invitation
  }

  const cancelInvitation = async (id) => {
    await apiDelete(`/workspace/invitations/${id}`)
    setData((current) => ({
      ...current,
      invitations: current.invitations.filter((invitation) => invitation.id !== id),
    }))
  }

  const resendInvitation = async (id) => {
    const { invitation } = await apiPost(`/workspace/invitations/${id}/resend`, {})
    setData((current) => ({
      ...current,
      invitations: current.invitations.map((entry) => entry.id === id ? invitation : entry),
    }))
    return invitation
  }

  const updateMemberRole = async (id, role) => {
    await apiPatch(`/workspace/members/${id}`, { role })
    setData((current) => ({
      ...current,
      members: current.members.map((member) => member.id === id ? { ...member, role } : member),
    }))
  }

  const removeMember = async (id) => {
    await apiDelete(`/workspace/members/${id}`)
    setData((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== id),
    }))
  }

  const updateWorkspace = async (changes) => {
    const { workspace } = await apiPatch('/workspace', changes)
    setData((current) => ({ ...current, workspace }))
  }

  const updateCurrentMember = (user) => {
    setData((current) => ({
      ...current,
      members: current.members.map((member) => member.id === user.id
        ? { ...member, name: user.name, email: user.email }
        : member),
    }))
  }

  const exportData = async () => {
    const payload = await apiGet('/workspace/export')
    if (
      typeof payload?.exportedAt !== 'string'
      || !payload.workspace
      || !Array.isArray(payload.projects)
      || !Array.isArray(payload.issues)
      || !Array.isArray(payload.members)
      || !Array.isArray(payload.comments)
    ) {
      throw new ApiError('The server returned incomplete workspace data. Please try again.', 502, 'INVALID_EXPORT_RESPONSE')
    }

    let url
    const link = document.createElement('a')
    try {
      url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      link.href = url
      link.download = 'plenqora-workspace.json'
      link.hidden = true
      document.body.append(link)
      link.click()
    } catch (error) {
      if (url) URL.revokeObjectURL(url)
      console.error('[ui] workspace data download failed', error)
      throw new ApiError('Your workspace data could not be downloaded. Please try again.', 500, 'WORKSPACE_EXPORT_DOWNLOAD_FAILED')
    } finally {
      link.remove()
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return {
    ...data,
    ...visibleData,
    allIssues,
    issues,
    loading: Boolean(enabled && userId && loadedUserId !== userId),
    error,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
    createIssue,
    updateIssue,
    deleteIssue,
    inviteMember,
    cancelInvitation,
    resendInvitation,
    updateMemberRole,
    removeMember,
    updateWorkspace,
    updateCurrentMember,
    exportData,
  }
}
