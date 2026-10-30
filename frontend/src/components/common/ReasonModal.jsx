import { useEffect, useId, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage } from '../../utils/errors'
import Button from './Button'
import Modal from './Modal'
import Textarea from './Textarea'

const noop = () => {}

export default function ReasonModal ({
  open,
  title,
  description,
  label = 'Reason',
  submitLabel = 'Submit',
  variant = 'primary',
  required = true,
  minLength = 3,
  maxLength = 500,
  onSubmit,
  onClose
}) {
  const { t } = useLanguage()
  const formId = useId()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const translate = value => (typeof value === 'string' ? t(value) : value)

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open])

  const handleSubmit = async event => {
    event.preventDefault()

    const value = reason.trim()

    if (required && value.length < minLength) {
      setError(t('Enter at least {min} characters', { min: minLength }))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onSubmit(value)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      size='sm'
      onClose={submitting ? noop : onClose}
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            type='submit'
            form={formId}
            variant={variant}
            loading={submitting}
          >
            {translate(submitLabel)}
          </Button>
        </>
      }
    >
      <form id={formId} className='form' onSubmit={handleSubmit} noValidate>
        {description && <p>{translate(description)}</p>}
        <Textarea
          label={label}
          value={reason}
          maxLength={maxLength}
          error={error}
          required={required}
          onChange={event => {
            setReason(event.target.value)
            setError('')
          }}
        />
      </form>
    </Modal>
  )
}
