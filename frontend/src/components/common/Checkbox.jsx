import { forwardRef, useId } from 'react'
import { useLanguage } from '../../hooks/useLanguage'

const Checkbox = forwardRef(function Checkbox (
  { label, hint, id, className = '', ...rest },
  ref
) {
  const { t } = useLanguage()
  const generatedId = useId()
  const inputId = id || generatedId
  const translate = value => (typeof value === 'string' ? t(value) : value)

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className='checkbox'>
        <input ref={ref} id={inputId} type='checkbox' {...rest} />
        <span>{translate(label)}</span>
      </label>
      {hint && <p className='field-hint'>{translate(hint)}</p>}
    </div>
  )
})

export default Checkbox
