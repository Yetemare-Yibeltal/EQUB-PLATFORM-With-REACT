import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../hooks/useLanguage'

export default function Modal ({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md'
}) {
  const { t } = useLanguage()
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined

    const previous = document.activeElement

    const handleKey = event => {
      if (event.key === 'Escape') closeRef.current()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className='modal-backdrop'
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={`modal modal-${size}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className='modal-header'>
          <h2 id={titleId}>{typeof title === 'string' ? t(title) : title}</h2>
          <button
            type='button'
            className='icon-button'
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className='modal-body'>{children}</div>
        {footer && <div className='modal-footer'>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
