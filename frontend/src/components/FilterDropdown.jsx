import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import './FilterDropdown.css'

export default function FilterDropdown({ label, value, options, onChange, icon, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = options[selectedIndex]
  const menuId = `filter-menu-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const closeOnScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnResize = () => setIsOpen(false)

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    window.addEventListener('scroll', closeOnScroll, true)
    window.addEventListener('resize', closeOnResize)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      window.removeEventListener('scroll', closeOnScroll, true)
      window.removeEventListener('resize', closeOnResize)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const optionButtons = menuRef.current?.querySelectorAll('[role="option"]')
      optionButtons?.[Math.max(selectedIndex, 0)]?.focus()
    }
  }, [isOpen, selectedIndex])

  const openMenu = () => {
    const bounds = triggerRef.current.getBoundingClientRect()
    const estimatedHeight = Math.min(320, options.length * 37 + 48)
    const top = bounds.bottom + estimatedHeight + 8 <= window.innerHeight - 12
      ? bounds.bottom + 8
      : Math.max(12, bounds.top - estimatedHeight - 8)
    setMenuPosition({
      top,
      right: Math.max(12, window.innerWidth - bounds.right),
    })
    setIsOpen(true)
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) openMenu()
    }
  }

  const handleMenuKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setIsOpen(false)
      const focusableElements = Array.from(document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length && !menuRef.current?.contains(element))
      const triggerIndex = focusableElements.indexOf(triggerRef.current)
      const nextElement = focusableElements[triggerIndex + (event.shiftKey ? -1 : 1)]
      if (nextElement) {
        event.preventDefault()
        nextElement.focus()
      }
      return
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const optionButtons = Array.from(menuRef.current.querySelectorAll('[role="option"]'))
    const currentIndex = optionButtons.indexOf(document.activeElement)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? optionButtons.length - 1
        : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + optionButtons.length) % optionButtons.length
    optionButtons[nextIndex]?.focus()
  }

  const selectOption = (option) => {
    onChange(option.value)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={`filter-dropdown ${className} ${isOpen ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`filter-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        ref={triggerRef}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        {icon && <Icon name={icon} size={17} />}
        <span className="filter-dropdown-value">{selectedOption?.label ?? value}</span>
        <span className="filter-dropdown-caret"><Icon name="down" size={15} /></span>
      </button>
      {isOpen && menuPosition && createPortal(
        <div
          className="filter-dropdown-menu"
          id={menuId}
          role="listbox"
          aria-label={label}
          ref={menuRef}
          style={{ top: menuPosition.top, right: menuPosition.right }}
          onKeyDown={handleMenuKeyDown}
        >
          <span className="filter-dropdown-heading">{label}</span>
          {options.map((option) => (
            <button
              type="button"
              className="filter-dropdown-option"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
