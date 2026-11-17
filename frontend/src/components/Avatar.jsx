export default function Avatar({ person, size = 'normal' }) {
  const name = typeof person === 'string' ? person : person?.name
  const initials = person?.initials ?? name?.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const colorNames = ['lilac', 'mint', 'peach', 'blue']
  const hash = [...(name ?? '')].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0)
  const color = person?.color ?? colorNames[hash % colorNames.length]
  return <span className={`avatar avatar-${color} avatar-${size}`} aria-label={name}>{initials || '?'}</span>
}
