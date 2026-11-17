import { useState } from 'react'
import Icon from './Icon'

export default function ProjectDialog({ projects, project = null, onClose, onSave }) {
  const editing = Boolean(project)
  const [form, setForm] = useState(project
    ? { name: project.name, key: project.key, description: project.description }
    : { name: '', key: '', description: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const key = form.key.trim().toUpperCase()
    const nextErrors = {}
    if (name.length < 3 || name.length > 60) nextErrors.name = 'Use a project name between 3 and 60 characters.'
    if (!/^[A-Z][A-Z0-9]{1,5}$/.test(key)) nextErrors.key = 'Use 2–6 letters or numbers, starting with a letter.'
    if (projects.some((item) => item.id !== project?.id && item.key.toLowerCase() === key.toLowerCase())) nextErrors.key = 'That project key is already in use.'
    if (form.description.trim().length > 240) nextErrors.description = 'Keep the description under 240 characters.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setBusy(true)
    setErrors({})
    try {
      await onSave({ name, key, description: form.description.trim() })
    } catch (error) {
      setErrors({ form: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
        <div className="modal-heading">
          <div><span className="modal-eyebrow">{editing ? 'PROJECT SETTINGS' : 'A NEW SPACE TO CREATE'}</span><h2 id="project-modal-title">{editing ? 'Update project.' : 'Start a project.'}</h2><p>{editing ? 'Keep the name and description up to date.' : 'Give your team a home for the work that matters.'}</p></div>
          <button type="button" className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label className="form-field"><span>Project name <b>*</b></span><input autoFocus value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setErrors({ ...errors, name: '' }) }} placeholder="e.g. Mobile app" maxLength={60} aria-invalid={Boolean(errors.name)} />{errors.name && <small className="field-error">{errors.name}</small>}</label>
          <label className="form-field"><span>Project key <b>*</b></span><input value={form.key} readOnly={editing} onChange={(event) => { setForm({ ...form, key: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }); setErrors({ ...errors, key: '' }) }} placeholder="e.g. MOB" maxLength={6} aria-invalid={Boolean(errors.key)} /><small className={errors.key ? 'field-error' : 'field-hint'}>{errors.key || (editing ? 'Issue keys cannot be changed after creation.' : 'A short, unique key for issue IDs (2–6 characters).')}</small></label>
          <label className="form-field"><span>Description <small>(optional)</small></span><textarea value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setErrors({ ...errors, description: '' }) }} placeholder="What is this project about?" rows={3} maxLength={240} aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}</label>
          {errors.form && <small className="field-error" role="alert">{errors.form}</small>}
          <div className="modal-actions"><span className="required-note"><b>*</b> Required fields</span><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}><Icon name={editing ? 'check' : 'plus'} size={16} /> {busy ? 'Saving…' : editing ? 'Save changes' : 'Create project'}</button></div>
        </form>
      </section>
    </div>
  )
}
