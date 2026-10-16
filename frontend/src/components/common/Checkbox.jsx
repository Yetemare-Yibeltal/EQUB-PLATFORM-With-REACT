import { forwardRef, useId } from 'react'

const Checkbox = forwardRef(function Checkbox (
  { label, hint, id, className = '', ...rest },
  ref
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className='checkbox'>
        <input ref={ref} id={inputId} type='checkbox' {...rest} />
        <span>{label}</span>
      </label>
      {hint && <p className='field-hint'>{hint}</p>}
    </div>
  )
})

export default Checkbox
