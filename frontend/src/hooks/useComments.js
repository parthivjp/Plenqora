import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/client'

export function useComments(issueId) {
  const [comments, setComments] = useState([])
  const [loadedIssueId, setLoadedIssueId] = useState(null)
  const [error, setError] = useState('')
  const loading = Boolean(issueId && loadedIssueId !== issueId)

  useEffect(() => {
    let active = true
    if (!issueId) return () => { active = false }
    apiGet(`/issues/${encodeURIComponent(issueId)}/comments`)
      .then(({ comments: loadedComments }) => {
        if (active) {
          setComments(loadedComments)
          setError('')
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoadedIssueId(issueId)
      })
    return () => { active = false }
  }, [issueId])

  const addComment = async (text, parentId = null) => {
    const { comment } = await apiPost(`/issues/${encodeURIComponent(issueId)}/comments`, { text, parentId })
    setComments((current) => [...current, comment])
    return comment
  }

  return { comments, loading, error, addComment }
}
