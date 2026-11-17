import { useState } from 'react'
import Avatar from './Avatar'
import Icon from './Icon'
import IssueComments from './IssueComments'
import './IssueComments.css'

const blankIssue = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'todo',
  assignee: '',
  assigneeId: '',
  type: 'Bug',
}

export default function IssueDialog({ issue, initialStatus = 'todo', project, members, readOnly = false, canDelete = true, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(issue ? { ...issue } : { ...blankIssue, status: initialStatus })
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(issue)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (readOnly) return
    setSaveError('')
    const nextErrors = {}
    if (form.title.trim().length < 5 || form.title.trim().length > 100) {
      nextErrors.title = 'Use a clear title between 5 and 100 characters.'
    }
    if (form.description.trim().length < 10 || form.description.trim().length > 1000) {
      nextErrors.description = 'Add a description between 10 and 1,000 characters.'
    }
    if (!members.some((member) => member.id === form.assigneeId)) {
      nextErrors.assignee = 'Choose a workspace teammate.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    try {
      await onSave({ ...form, title: form.title.trim(), description: form.description.trim(), assigneeId: form.assigneeId || null })
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="issue-modal-title">
        <div className="modal-heading">
          <div>
            <span className="modal-eyebrow">{editing ? `${issue.id} · ${project.key}` : `NEW ISSUE · ${project.key}`}</span>
            <h2 id="issue-modal-title">{readOnly ? 'Issue details.' : editing ? 'Update this issue.' : 'Add a little detail.'}</h2>
            <p>{readOnly ? 'You have view-only access to this workspace.' : editing ? 'Keep your team up to date with the latest details.' : 'Give your team the context they need to get moving.'}</p>
          </div>
          <button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label className="form-field">
            <span>Issue title <b>*</b></span>
            <input autoFocus value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="What needs to be done?" maxLength={100} aria-invalid={Boolean(errors.title)} readOnly={readOnly} />
            {errors.title && <small className="field-error">{errors.title}</small>}
          </label>
          <label className="form-field">
            <span>Description <b>*</b></span>
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Add context or acceptance criteria…" rows={4} maxLength={1000} aria-invalid={Boolean(errors.description)} readOnly={readOnly} />
            {errors.description ? <small className="field-error">{errors.description}</small> : <small className="field-hint">{form.description.length}/1,000 · At least 10 characters.</small>}
          </label>
          <div className="form-grid">
            <label className="form-field"><span>Type</span><select value={form.type} onChange={(event) => updateField('type', event.target.value)} disabled={readOnly}><option>Bug</option><option>Feature</option><option>Improvement</option><option>Design</option><option>Documentation</option></select></label>
            <label className="form-field"><span>Priority</span><select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} disabled={readOnly}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label className="form-field"><span>Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)} disabled={readOnly}><option value="todo">To do</option><option value="progress">In progress</option><option value="done">Done</option></select></label>
            <label className="form-field"><span>Assignee <b>*</b></span><select value={form.assigneeId} onChange={(event) => { const selected = members.find((member) => member.id === event.target.value); setForm((current) => ({ ...current, assigneeId: event.target.value, assignee: selected?.name ?? '' })); setErrors((current) => ({ ...current, assignee: '' })) }} aria-invalid={Boolean(errors.assignee)} disabled={readOnly}><option value="">Choose a teammate</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>{errors.assignee && <small className="field-error">{errors.assignee}</small>}</label>
          </div>
          {editing && <div className="issue-dialog-meta"><span><Avatar person={form.assignee} size="small" /> Assigned to {form.assignee || 'nobody'}</span>{canDelete && <button type="button" className="danger-button" onClick={() => onDelete(issue)}> <Icon name="trash" size={15} /> Delete issue</button>}</div>}
          {saveError && <small className="field-error" role="alert">{saveError}</small>}
          <div className="modal-actions">
            {!readOnly && <span className="required-note"><b>*</b> Required fields</span>}
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            {readOnly ? <button type="button" className="button button-primary" onClick={onClose}>Done</button> : <button type="submit" className="button button-primary" disabled={busy}><Icon name={editing ? 'check' : 'plus'} size={16} /> {busy ? 'Saving…' : editing ? 'Save changes' : 'Create issue'}</button>}
          </div>
        </form>
        {editing && <IssueComments issueId={issue.id} canComment={!readOnly} />}
      </section>
    </div>
  )
}
