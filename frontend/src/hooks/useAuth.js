import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api/client'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState('')
  const [connectionErrorTitle, setConnectionErrorTitle] = useState('')

  useEffect(() => {
    let active = true
    apiGet('/auth/me')
      .then(({ user }) => {
        if (active) setCurrentUser(user)
      })
      .catch((error) => {
        if (active && ![401, 403].includes(error.status)) {
          setConnectionErrorTitle(error.title || 'Unable to connect')
          setConnectionError(error.reason || error.message || 'Unable to reach the Plenqora API.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const login = async (values) => {
    const { user } = await apiPost('/auth/login', values)
    setCurrentUser(user)
    setConnectionError('')
    setConnectionErrorTitle('')
    return user
  }

  const register = async (values) => {
    const { user } = await apiPost('/auth/register', values)
    setCurrentUser(user)
    setConnectionError('')
    setConnectionErrorTitle('')
    return user
  }

  const logout = async () => {
    await apiPost('/auth/logout', {})
    setCurrentUser(null)
  }

  const updateProfile = async (values) => {
    const { user } = await apiPatch('/auth/profile', values)
    setCurrentUser(user)
    return user
  }

  const changePassword = ({ currentPassword, newPassword }) => apiPatch('/auth/password', {
    currentPassword,
    newPassword,
  })

  const requestPasswordReset = ({ email }) => apiPost('/auth/forgot-password', { email })

  const resetPassword = ({ token, newPassword }) => apiPost('/auth/reset-password', { token, newPassword })
  const validateResetToken = useCallback(
    (token) => apiGet(`/auth/reset-password/${encodeURIComponent(token)}`),
    [],
  )

  return {
    currentUser,
    loading,
    connectionError,
    connectionErrorTitle,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    validateResetToken,
  }
}
