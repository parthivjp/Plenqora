import { useState } from 'react'
import Icon from './Icon'

export default function PasswordInput({ value, onChange, autoComplete, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="password-input">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
      </button>
    </span>
  )
}
