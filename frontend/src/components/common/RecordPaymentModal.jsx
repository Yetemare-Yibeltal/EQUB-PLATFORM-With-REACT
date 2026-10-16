import { useEffect, useId, useState } from 'react'
import { MANUAL_PAYMENT_METHODS } from '../../constants/paymentMethods'
import { localInputToIso, nowLocalInputValue } from '../../utils/dateInput'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import Button from './Button'
import ErrorMessage from './ErrorMessage'
import Input from './Input'
import Modal from './Modal'
import Select from './Select'
import Textarea from './Textarea'

const noop = () => {}

const INITIAL = { paymentMethod: 'cash', reference: '', note: '', paidAt: '' }

export default function RecordPaymentModal ({
  open,
  title,
  summary,
  submitLabel = 'Record payment',
  onSubmit,
  onClose
}) {
  const formId = useId()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(INITIAL)
      setErrors({})
      setSubmitError('')
    }
  }, [open])

  const handleChange = event => {
    const { name, value } = event.target
    setValues(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const paidAt = localInputToIso(values.paidAt)

    if (paidAt && new Date(paidAt).getTime() > Date.now()) {
      setErrors({ paidAt: 'Payment time cannot be in the future' })
      return
    }

    const payload = { paymentMethod: values.paymentMethod }

    if (values.reference.trim()) payload.reference = values.reference.trim()
    if (values.note.trim()) payload.note = values.note.trim()
    if (paidAt) payload.paidAt = paidAt

    setSubmitting(true)
    setSubmitError('')

    try {
      await onSubmit(payload)
    } catch (requestError) {
      setErrors(getFieldErrors(requestError))
      setSubmitError(getErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={submitting ? noop : onClose}
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type='submit' form={formId} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} className='form' onSubmit={handleSubmit} noValidate>
        {summary && <div className='alert alert-info'>{summary}</div>}
        <ErrorMessage message={submitError} />
        <Select
          label='Payment method'
          name='paymentMethod'
          options={MANUAL_PAYMENT_METHODS}
          value={values.paymentMethod}
          onChange={handleChange}
          error={errors.paymentMethod}
          required
        />
        <Input
          label='Reference (optional)'
          name='reference'
          maxLength={100}
          hint='Receipt number or transfer reference'
          value={values.reference}
          onChange={handleChange}
          error={errors.reference}
        />
        <Input
          label='Paid at (optional)'
          name='paidAt'
          type='datetime-local'
          max={nowLocalInputValue()}
          hint='Leave empty to use the current time'
          value={values.paidAt}
          onChange={handleChange}
          error={errors.paidAt}
        />
        <Textarea
          label='Note (optional)'
          name='note'
          maxLength={500}
          value={values.note}
          onChange={handleChange}
          error={errors.note}
        />
      </form>
    </Modal>
  )
}
