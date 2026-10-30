import { forwardRef, useId } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

const Select = forwardRef(function Select (
  {
    label,
    error,
    hint,
    id,
    options = [],
    placeholder,
    className = '',
    required = false,
    ...rest
  },
  ref
) {
  const { t } = useLanguage()
  const generatedId = useId()
  const selectId = id || generatedId
  const translate = value => (typeof value === 'string' ? t(value) : value)
  const describedBy = error
    ? `${selectId}-error`
    : hint
    ? `${selectId}-hint`
    : undefined

  return (
    <div
      className={['field', error ? 'field-invalid' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label htmlFor={selectId} className='field-label'>
          {translate(label)}
          {required && <span aria-hidden='true'> *</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className='input'
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        required={required}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value=''>{translate(placeholder)}</option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {translate(option.label)}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className='field-error' role='alert'>
          {translate(error)}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className='field-hint'>
          {translate(hint)}
        </p>
      ) : null}
    </div>
  )
})

export default Select
