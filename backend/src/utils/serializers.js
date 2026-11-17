export function serializeUser(user, role) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role,
    workspaceId: user.workspaceId.toString(),
  }
}

export function serializeProject(project) {
  return {
    id: project._id.toString(),
    name: project.name,
    key: project.key,
    description: project.description,
    color: project.color,
    memberIds: project.members.map((member) => member.toString()),
    createdAt: project.createdAt,
  }
}

export function serializeIssue(issue, assignee) {
  return {
    id: issue.key,
    key: issue.key,
    projectId: issue.projectId.toString(),
    title: issue.title,
    description: issue.description,
    type: issue.type,
    priority: issue.priority,
    status: issue.status,
    assignee: assignee?.name ?? '',
    assigneeId: assignee?._id.toString() ?? '',
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    date: issue.createdAt,
  }
}
