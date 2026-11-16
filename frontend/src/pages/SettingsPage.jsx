import { useState } from 'react'
import Icon from '../components/Icon'
import './SettingsPage.css'

export default function SettingsPage({ workspace, profile, isAdmin, onSaveWorkspace, onSaveProfile, onChangePassword, onReset, exportData, notify }) {
  const [workspaceForm, setWorkspaceForm] = useState(workspace)
  const [profileForm, setProfileForm] = useState(profile)
  const [errors, setErrors] = useState({})
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  const saveWorkspace = (event) => {
    event.preventDefault()
    if (workspaceForm.name.trim().length < 2) return setErrors({ workspace: 'Workspace name must have at least 2 characters.' })
    onSaveWorkspace({ name: workspaceForm.name.trim(), description: workspaceForm.description.trim() })
    setErrors({})
    notify('Workspace settings saved')
  }

  const saveProfile = (event) => {
    event.preventDefault()
    if (profileForm.name.trim().length < 2) return setErrors({ profile: 'Your name must have at least 2 characters.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) return setErrors({ profile: 'Enter a valid email address.' })
    try {
      onSaveProfile({ name: profileForm.name.trim(), email: profileForm.email.trim() })
    } catch (error) {
      return setErrors({ profile: error.message })
    }
    setErrors({})
    notify('Profile saved')
  }

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    if (passwordForm.newPassword.length < 8) return setPasswordError('Use a new password with at least 8 characters.')
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

  const reset = () => {
    if (window.confirm('Reset your workspace to the original Plenqora sample data? Your saved changes will be removed.')) {
      onReset()
      notify('Workspace restored to the original sample data')
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
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="users" size={17} /></span><div><h2>Your profile</h2><p>Update your local workspace profile.</p></div></div>
        <form onSubmit={saveProfile} className="settings-form settings-profile-form">
          <label className="form-field"><span>Your name</span><input value={profileForm.name} maxLength={80} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label>
          <label className="form-field"><span>Email address</span><input type="email" value={profileForm.email} maxLength={254} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label>
          {errors.profile && <small className="field-error">{errors.profile}</small>}
          <div className="settings-actions"><button type="submit" className="button button-primary">Save profile</button></div>
        </form>
      </section>
      <section className="settings-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="lock" size={17} /></span><div><h2>Account security</h2><p>Change your password for this browser-local account.</p></div></div>
        <form onSubmit={changePassword} className="settings-form security-form" noValidate>
          <label className="form-field"><span>Current password</span><input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
          <label className="form-field"><span>New password</span><input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /></label>
          <label className="form-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
          {passwordError && <small className="field-error">{passwordError}</small>}
          <div className="settings-actions"><button type="submit" className="button button-primary" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</button></div>
        </form>
      </section>
      {isAdmin && <section className="settings-card settings-data-card">
        <div className="settings-card-heading"><span className="settings-card-icon"><Icon name="lock" size={17} /></span><div><h2>Your data</h2><p>Your workspace is stored in this browser, not on a server.</p></div></div>
        <div className="settings-data-actions"><button type="button" className="button button-secondary" onClick={exportData}><Icon name="download" size={15} /> Export workspace data</button><button type="button" className="button button-danger" onClick={reset}><Icon name="trash" size={15} /> Restore sample data</button></div>
      </section>}
    </div>
  )
}
