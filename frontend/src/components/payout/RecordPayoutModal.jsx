import { useEffect, useId, useMemo, useState } from 'react'
import { PROOF_METHOD_LABELS } from '../../constants/paymentProof'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage } from '../../utils/errors'
import Button from '../common/Button'
import Input from '../common/Input'
import Modal from '../common/Modal'
import Select from '../common/Select'
import Textarea from '../common/Textarea'

const noop = () => {}

export default function RecordPayoutModal ({
  open,
  title,
  summary,
  onSubmit,
  onClose
}) {
  const { t } = useLanguage()
  const formId = useId()
  const [method, setMethod] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const methodOptions = useMemo(
    () =>
      Object.entries(PROOF_METHOD_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  useEffect(() => {
    if (open) {
      setMethod('')
      setReference('')
      setNote('')
      setErrors({})
      setSubmitError('')
    }
  }, [open])

  const validate = () => {
    const next = {}

    if (!method) next.method = t('Choose a payment method')
    if (reference.trim().length < 4) {
      next.reference = t('Write the transaction reference')
    }

    setErrors(next)

    return Object.keys(next).length === 0
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (!validate()) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await onSubmit({
        paymentMethod: method,
        reference: reference.trim(),
        ...(note.trim() ? { note: note.trim() } : {})
      })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
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
            {t('common.cancel')}
          </Button>
          <Button type='submit' form={formId} loading={submitting}>
            {t('Record payout')}
          </Button>
        </>
      }
    >
      <form id={formId} className='form' onSubmit={handleSubmit} noValidate>
        {summary && <p>{summary}</p>}
        <p className='muted'>
          {t(
            'Send the money by CBE or Telebirr first, then record the reference here.'
          )}
        </p>

        <Select
          label='Payment method'
          name='method'
          placeholder='Choose how you sent the payout'
          options={methodOptions}
          value={method}
          error={errors.method}
          onChange={event => setMethod(event.target.value)}
        />
        <Input
          label='Transaction reference'
          hint='Enter the reference number of the transfer you sent to the winner.'
          name='reference'
          value={reference}
          maxLength={100}
          required
          error={errors.reference}
          onChange={event => setReference(event.target.value)}
        />
        <Textarea
          label='Note (optional)'
          rows={2}
          value={note}
          maxLength={500}
          onChange={event => setNote(event.target.value)}
        />

        {submitError && (
          <p className='field-error' role='alert'>
            {submitError}
          </p>
        )}
      </form>
    </Modal>
  )
}
