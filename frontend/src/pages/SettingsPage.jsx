import { useState } from 'react'
import Icon from '../components/Icon'
import PasswordInput from '../components/PasswordInput'
import { validateEmail } from '../utils/emailValidator'
import './SettingsPage.css'

export default function SettingsPage({
  workspace,
  profile,
  projects,
  isAdmin,
  canManageProjects,
  onSaveWorkspace,
  onSaveProfile,
  onChangePassword,
  onEditProject,
  onDeleteProject,
  exportData,
  notify,
}) {
  const [workspaceForm, setWorkspaceForm] = useState(workspace)
  const [profileForm, setProfileForm] = useState(profile)
  const [emailValidation, setEmailValidation] = useState(null)
  const [errors, setErrors] = useState({})
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)

  const saveWorkspace = async (event) => {
    event.preventDefault()
    if (workspaceForm.name.trim().length < 2) return setErrors({ workspace: 'Workspace name must have at least 2 characters.' })
    try {
      await onSaveWorkspace({ name: workspaceForm.name.trim(), description: workspaceForm.description.trim() })
      setErrors({})
      notify('Workspace settings saved')
    } catch (error) {
      setErrors({ workspace: error.message })
    }
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    const emailResult = validateEmail(profileForm.email)
    setEmailValidation(emailResult)
    setProfileForm((current) => ({ ...current, email: emailResult.email }))
    if (!emailResult.valid) return
    if (profileForm.name.trim().length < 2) return setErrors({ profile: 'Your name must have at least 2 characters.' })
    try {
      await onSaveProfile({ name: profileForm.name.trim(), email: emailResult.email })
    } catch (error) {
      return setErrors({ profile: error.message })
    }
    setErrors({})
    notify('Profile saved')
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    if (
      passwordForm.newPassword.length < 12
      || !/[a-z]/.test(passwordForm.newPassword)
      || !/[A-Z]/.test(passwordForm.newPassword)
      || !/\d/.test(passwordForm.newPassword)
      || new TextEncoder().encode(passwordForm.newPassword).length > 72
    ) return setPasswordError('Use at least 12 characters with uppercase, lowercase, and a number.')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordError('The new passwords do not match.')
    setPasswordBusy(true)
    try {
      await onChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      notify('Password updated')
    } catch (error) {
      setPasswordError(error.message)
    } finally {
      setPasswordBusy(false)
    }
  }

  const handleExport = async () => {
    setExportBusy(true)
    try {
      await exportData()
      notify('Workspace data exported')
    } catch (error) {
      notify(error.message)
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <div className="settings-page">
      {isAdmin && <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="grid" size={17} /></span><div><h2>Workspace</h2><p>Set the name and description your team sees.</p></div></div>
        <form onSubmit={saveWorkspace} className="settings-form">
          <label className="form-field"><span>Workspace name</span><input value={workspaceForm.name} maxLength={60} onChange={(event) => setWorkspaceForm({ ...workspaceForm, name: event.target.value })} /></label>
          <label className="form-field"><span>Description</span><textarea rows={3} maxLength={240} value={workspaceForm.description} onChange={(event) => setWorkspaceForm({ ...workspaceForm, description: event.target.value })} /></label>
          {errors.workspace && <small className="field-error">{errors.workspace}</small>}
          <div className="settings-actions"><button type="submit" className="button button-primary">Save workspace</button></div>
        </form>
      </section>}
      {canManageProjects && <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="board" size={17} /></span><div><h2>Projects</h2><p>Update project details or remove a project and its issues.</p></div></div>
        <div className="project-settings-list">{projects.map((project) => <article className="project-settings-row" key={project.id}>
          <span className={`project-dot dot-${project.color}`} />
          <span className="project-settings-copy"><strong>{project.name}</strong><small>{project.key} · {project.description || 'No description'}</small></span>
          <button type="button" className="text-action" onClick={() => onEditProject(project)}>Edit</button>
          {isAdmin && <button type="button" className="text-action project-delete-action" onClick={() => onDeleteProject(project)}>Delete</button>}
        </article>)}</div>
      </section>}
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="users" size={17} /></span><div><h2>Your profile</h2><p>Update your account name and email address.</p></div></div>
        <form onSubmit={saveProfile} className="settings-form settings-profile-form">
          <label className="form-field"><span>Your name</span><input value={profileForm.name} maxLength={80} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label>
          <label className="form-field"><span>Email address</span><input type="email" value={profileForm.email} maxLength={254} onChange={(event) => { setProfileForm({ ...profileForm, email: event.target.value }); setEmailValidation(null); setErrors((current) => ({ ...current, profile: '' })) }} onBlur={() => { const result = validateEmail(profileForm.email); setEmailValidation(result); setProfileForm((current) => ({ ...current, email: result.email })) }} aria-invalid={Boolean(emailValidation && !emailValidation.valid)} aria-describedby={emailValidation && !emailValidation.valid ? 'profile-email-error' : undefined} />{emailValidation && !emailValidation.valid && <small id="profile-email-error" className="field-error" role="alert">{emailValidation.error}{emailValidation.suggestion && <> <button type="button" className="text-action" onClick={() => { setProfileForm((current) => ({ ...current, email: emailValidation.suggestion })); setEmailValidation(null) }}>Use this</button></>}</small>}</label>
          {errors.profile && <small className="field-error">{errors.profile}</small>}
          <div className="settings-actions"><button type="submit" className="button button-primary">Save profile</button></div>
        </form>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="lock" size={17} /></span><div><h2>Account security</h2><p>Change the password that protects your Plenqora account.</p></div></div>
        <form onSubmit={changePassword} className="settings-form security-form" noValidate>
          <label className="form-field"><span>Current password</span><PasswordInput autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
          <label className="form-field"><span>New password</span><PasswordInput autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label>
          <label className="form-field"><span>Confirm new password</span><PasswordInput autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
          {passwordError && <small className="field-error">{passwordError}</small>}
          <div className="settings-actions"><button type="submit" className="button button-primary" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</button></div>
        </form>
      </section>
      {isAdmin && <section className="settings-card settings-data-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="lock" size={17} /></span><div><h2>Your data</h2><p>Export your workspace data from the Plenqora server.</p></div></div>
        <div className="settings-data-actions"><button type="button" className="button button-secondary" onClick={handleExport} disabled={exportBusy}><Icon name="download" size={15} /> {exportBusy ? 'Preparing export…' : 'Export workspace data'}</button></div>
      </section>}
    </div>
  )
}
