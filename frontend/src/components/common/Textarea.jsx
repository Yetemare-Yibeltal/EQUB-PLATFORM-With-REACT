import { forwardRef, useId } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

const Textarea = forwardRef(function Textarea (
  {
    label,
    error,
    hint,
    id,
    rows = 3,
    className = '',
    required = false,
    ...rest
  },
  ref
) {
  const { t } = useLanguage()
  const generatedId = useId()
  const areaId = id || generatedId
  const translate = value => (typeof value === 'string' ? t(value) : value)
  const describedBy = error
    ? `${areaId}-error`
    : hint
    ? `${areaId}-hint`
    : undefined

  return (
    <div
      className={['field', error ? 'field-invalid' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label htmlFor={areaId} className='field-label'>
          {translate(label)}
          {required && <span aria-hidden='true'> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        className='input textarea'
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        required={required}
        {...rest}
      />
      {error ? (
        <p id={`${areaId}-error`} className='field-error' role='alert'>
          {translate(error)}
        </p>
      ) : hint ? (
        <p id={`${areaId}-hint`} className='field-hint'>
          {translate(hint)}
        </p>
      ) : null}
    </div>
  )
})

export default Textarea
