import { useEffect, useState } from 'react'
import { initialIssues, initialMembers, initialProjects } from '../data/seedData'

const STORAGE_KEY = 'plenqora.workspace.v1'

const defaultWorkspace = () => ({
  projects: initialProjects,
  issues: initialIssues,
  members: initialMembers,
  activeProjectId: 'atlas',
  workspace: { name: 'Plenqora Studio', description: 'A calm, clear home for your team’s projects and issues.' },
  profile: { name: 'Olivia Chen', email: 'olivia@example.com' },
})

function readWorkspace() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return { data: defaultWorkspace(), warning: '' }
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.issues) || !Array.isArray(parsed.members)) {
      throw new Error('Saved workspace data has an unexpected format.')
    }
    return { data: { ...defaultWorkspace(), ...parsed }, warning: '' }
  } catch (error) {
    return {
      data: defaultWorkspace(),
      warning: `Saved workspace data could not be loaded: ${error.message}`,
    }
  }
}

export function useWorkspace() {
  const [stored, setStored] = useState(readWorkspace)
  const { data } = stored

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (stored.warning) setStored((current) => ({ ...current, warning: '' }))
    } catch (error) {
      setStored((current) => ({ ...current, warning: `Changes could not be saved in this browser: ${error.message}` }))
    }
  }, [data, stored.warning])

  const updateData = (updater) => setStored((current) => ({ ...current, data: updater(current.data) }))

  const createProject = (input) => {
    const project = { ...input, id: `project-${crypto.randomUUID()}`, color: 'violet' }
    updateData((current) => ({ ...current, projects: [...current.projects, project] }))
    return project
  }

  const createIssue = (project, input) => {
    const nextNumber = data.issues
      .filter((issue) => issue.projectId === project.id)
      .reduce((max, issue) => Math.max(max, Number(issue.id.split('-').at(-1)) || 0), 0) + 1
    const issue = {
      ...input,
      id: `${project.key}-${nextNumber}`,
      projectId: project.id,
      date: 'Just now',
    }
    updateData((current) => ({ ...current, issues: [...current.issues, issue] }))
    return issue
  }

  const updateIssue = (id, changes) => updateData((current) => ({
    ...current,
    issues: current.issues.map((issue) => issue.id === id ? { ...issue, ...changes } : issue),
  }))

  const deleteIssue = (id) => updateData((current) => ({
    ...current,
    issues: current.issues.filter((issue) => issue.id !== id),
  }))

  const inviteMember = (input) => {
    const name = input.name.trim()
    const member = {
      ...input,
      name,
      email: input.email.trim().toLowerCase(),
      initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      color: ['lilac', 'mint', 'peach', 'blue'][data.members.length % 4],
      status: 'Invited',
    }
    updateData((current) => ({ ...current, members: [...current.members, member] }))
    return member
  }

  const upsertMember = (input, previousEmail = input.email) => {
    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    const member = {
      ...input,
      name,
      email,
      initials: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      color: data.members.find((item) => item.email === previousEmail)?.color ?? ['lilac', 'mint', 'peach', 'blue'][data.members.length % 4],
      status: 'Active',
    }
    updateData((current) => {
      const index = current.members.findIndex((item) => item.email === previousEmail || item.email === email)
      const members = [...current.members]
      if (index >= 0) members[index] = { ...members[index], ...member }
      else members.push(member)
      return { ...current, members }
    })
  }

  const updateMemberRole = (email, role) => updateData((current) => ({
    ...current,
    members: current.members.map((member) => member.email === email ? { ...member, role } : member),
  }))

  const updateWorkspace = (changes) => updateData((current) => ({
    ...current,
    workspace: { ...current.workspace, ...changes },
  }))

  const updateProfile = (changes) => updateData((current) => ({
    ...current,
    profile: { ...current.profile, ...changes },
  }))

  const setActiveProjectId = (id) => updateData((current) => ({ ...current, activeProjectId: id }))

  const resetWorkspace = () => updateData(defaultWorkspace)

  return {
    ...data,
    storageWarning: stored.warning,
    setActiveProjectId,
    createProject,
    createIssue,
    updateIssue,
    deleteIssue,
    inviteMember,
    upsertMember,
    updateMemberRole,
    updateWorkspace,
    updateProfile,
    resetWorkspace,
  }
}
