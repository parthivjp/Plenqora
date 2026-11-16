import { initialMembers } from '../data/seedData'

export default function Avatar({ person, size = 'normal' }) {
  const found = initialMembers.find((item) => item.name === person?.name || item.name === person)
    ?? (typeof person === 'object' ? person : null)
  const name = typeof person === 'string' ? person : person?.name
  const initials = found?.initials ?? name?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? '?'
  return <span className={`avatar avatar-${found?.color ?? 'lilac'} avatar-${size}`} aria-label={name}>{initials}</span>
}
