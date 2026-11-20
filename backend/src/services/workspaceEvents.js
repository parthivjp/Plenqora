const subscribersByWorkspace = new Map()

export function subscribeToWorkspaceUpdates(workspaceId, subscriber) {
  const key = workspaceId.toString()
  let subscribers = subscribersByWorkspace.get(key)
  if (!subscribers) {
    subscribers = new Set()
    subscribersByWorkspace.set(key, subscribers)
  }
  subscribers.add(subscriber)

  return () => {
    subscribers.delete(subscriber)
    if (subscribers.size === 0) subscribersByWorkspace.delete(key)
  }
}

export function publishWorkspaceUpdate(workspaceId) {
  const subscribers = subscribersByWorkspace.get(workspaceId.toString())
  if (!subscribers) return

  for (const subscriber of subscribers) {
    try {
      subscriber()
    } catch (error) {
      console.error('[api] workspace live update could not be delivered', error)
      subscribers.delete(subscriber)
      if (subscribers.size === 0) subscribersByWorkspace.delete(workspaceId.toString())
    }
  }
}
