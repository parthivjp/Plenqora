import { useState } from 'react'
import Icon from './Icon'
import { useComments } from '../hooks/useComments'

function CommentEntry({ comment, comments, canComment, onReply }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!text.trim()) return setError('Write a reply before sending.')
    setBusy(true)
    setError('')
    try {
      await onReply(text.trim(), comment.id)
      setText('')
      setReplyOpen(false)
    } catch (replyError) {
      setError(replyError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="comment-entry">
      <div className="comment-content">
        <div className="comment-meta"><strong>{comment.author.name}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div>
        <p>{comment.text}</p>
        {canComment && <button type="button" className="comment-reply" onClick={() => setReplyOpen((open) => !open)}>Reply</button>}
        {replyOpen && <form className="comment-reply-form" onSubmit={submit}><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={2} placeholder="Write a reply…" aria-label={`Reply to ${comment.author.name}`} />{error && <small className="field-error">{error}</small>}<div><button type="button" className="button button-secondary" onClick={() => setReplyOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Sending…' : 'Reply'}</button></div></form>}
      </div>
      {comments.filter((reply) => reply.parentId === comment.id).map((reply) => <CommentEntry key={reply.id} comment={reply} comments={comments} canComment={canComment} onReply={onReply} />)}
    </article>
  )
}

export default function IssueComments({ issueId, canComment }) {
  const { comments, loading, error, addComment } = useComments(issueId)
  const [text, setText] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const roots = comments.filter((comment) => !comment.parentId)

  const submit = async (event) => {
    event.preventDefault()
    if (!text.trim()) return setSubmitError('Write a comment before posting.')
    setBusy(true)
    setSubmitError('')
    try {
      await addComment(text.trim())
      setText('')
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="issue-comments" aria-label="Issue comments">
      <h3><Icon name="users" size={16} /> Discussion <span>{comments.length}</span></h3>
      {loading && <p className="comments-status" role="status">Loading comments…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      {!loading && !roots.length && <p className="comments-status">No comments yet.</p>}
      <div className="comment-list">{roots.map((comment) => <CommentEntry
        key={comment.id}
        comment={comment}
        comments={comments}
        canComment={canComment}
        onReply={addComment}
      />)}</div>
      {canComment && <form className="comment-form" onSubmit={submit}>
        <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={3} placeholder="Add context or ask a question…" aria-label="Write a comment" />
        {submitError && <small className="field-error">{submitError}</small>}
        <button type="submit" className="button button-secondary" disabled={busy}><Icon name="check" size={15} /> {busy ? 'Posting…' : 'Post comment'}</button>
      </form>}
    </section>
  )
}
