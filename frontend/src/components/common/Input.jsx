import { forwardRef, useId, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

const Input = forwardRef(function Input (
  {
    label,
    error,
    hint,
    id,
    type = 'text',
    className = '',
    required = false,
    ...rest
  },
  ref
) {
  const { t } = useLanguage()
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const translate = value => (typeof value === 'string' ? t(value) : value)
  const describedBy = error
    ? `${inputId}-error`
    : hint
    ? `${inputId}-hint`
    : undefined

  return (
    <div
      className={['field', error ? 'field-invalid' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label htmlFor={inputId} className='field-label'>
          {translate(label)}
          {required && <span aria-hidden='true'> *</span>}
        </label>
      )}
      <div className='field-control'>
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          className='input'
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          {...rest}
        />
        {isPassword && (
          <button
            type='button'
            className='field-toggle'
            onClick={() => setVisible(current => !current)}
            aria-label={visible ? t('Hide password') : t('Show password')}
          >
            {visible ? t('Hide') : t('Show')}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className='field-error' role='alert'>
          {translate(error)}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className='field-hint'>
          {translate(hint)}
        </p>
      ) : null}
    </div>
  )
})

export default Input
