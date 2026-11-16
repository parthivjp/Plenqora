import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'plenqora.auth.v1'
const ITERATIONS = 120000
const accessRoles = ['Admin', 'Member', 'Viewer']

function readAuth() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return { accounts: [], sessionId: null, warning: '' }
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed.accounts)) throw new Error('Saved sign-in data has an unexpected format.')
    return { accounts: parsed.accounts, sessionId: parsed.sessionId ?? null, warning: '' }
  } catch (error) {
    return { accounts: [], sessionId: null, warning: `Local sign-in data could not be loaded: ${error.message}` }
  }
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

async function derivePasswordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return toBase64(bits)
}

async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { salt: toBase64(salt), passwordHash: await derivePasswordHash(password, salt) }
}

function decodeBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

export function useAuth() {
  const [stored, setStored] = useState(readAuth)
  const currentUser = useMemo(
    () => stored.accounts.find((account) => account.id === stored.sessionId) ?? null,
    [stored.accounts, stored.sessionId],
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        accounts: stored.accounts,
        sessionId: stored.sessionId,
      }))
      if (stored.warning) setStored((current) => ({ ...current, warning: '' }))
    } catch (error) {
      setStored((current) => ({ ...current, warning: `Sign-in data could not be saved in this browser: ${error.message}` }))
    }
  }, [stored.accounts, stored.sessionId, stored.warning])

  const register = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    if (stored.accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account with this email already exists. Sign in instead.')
    }
    if (!crypto?.subtle) throw new Error('This browser does not support secure local password hashing.')
    const credentials = await createPasswordHash(password)
    const account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      role: stored.accounts.length === 0 ? 'Admin' : 'Member',
      ...credentials,
    }
    setStored((current) => ({ ...current, accounts: [...current.accounts, account], sessionId: account.id }))
    return account
  }

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const account = stored.accounts.find((user) => user.email === normalizedEmail)
    if (!account) throw new Error('Email or password is incorrect.')
    const hash = await derivePasswordHash(password, decodeBase64(account.salt))
    if (hash !== account.passwordHash) throw new Error('Email or password is incorrect.')
    setStored((current) => ({ ...current, sessionId: account.id }))
    return account
  }

  const logout = () => setStored((current) => ({ ...current, sessionId: null }))

  const updateAccount = (changes) => {
    if (!currentUser) throw new Error('Sign in before updating your account.')
    const email = changes.email.trim().toLowerCase()
    if (stored.accounts.some((account) => account.id !== currentUser.id && account.email === email)) {
      throw new Error('An account with this email already exists.')
    }
    const updated = { ...currentUser, name: changes.name.trim(), email }
    setStored((current) => ({
      ...current,
      accounts: current.accounts.map((account) => account.id === currentUser.id ? updated : account),
    }))
    return { previousEmail: currentUser.email, account: updated }
  }

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!currentUser) throw new Error('Sign in before changing your password.')
    const hash = await derivePasswordHash(currentPassword, decodeBase64(currentUser.salt))
    if (hash !== currentUser.passwordHash) throw new Error('Your current password is incorrect.')
    const credentials = await createPasswordHash(newPassword)
    setStored((current) => ({
      ...current,
      accounts: current.accounts.map((account) => account.id === currentUser.id ? { ...account, ...credentials } : account),
    }))
  }

  const updateRole = (email, role) => {
    if (currentUser?.role !== 'Admin') throw new Error('Only an admin can change account access.')
    if (!accessRoles.includes(role)) throw new Error('Choose a valid access role.')
    const target = stored.accounts.find((account) => account.email === email)
    if (!target) throw new Error('This teammate does not have a local sign-in account.')
    const remainingAdmins = stored.accounts.filter((account) => account.role === 'Admin' && account.id !== target.id)
    if (target.role === 'Admin' && role !== 'Admin' && remainingAdmins.length === 0) {
      throw new Error('The workspace must keep at least one admin.')
    }
    setStored((current) => ({
      ...current,
      accounts: current.accounts.map((account) => account.id === target.id ? { ...account, role } : account),
    }))
  }

  return {
    accounts: stored.accounts,
    currentUser,
    storageWarning: stored.warning,
    register,
    login,
    logout,
    updateAccount,
    changePassword,
    updateRole,
  }
}
