import { useMemo, useState } from 'react'
import { DISPUTE_CATEGORY_LABELS } from '../../constants/disputes'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage } from '../../utils/errors'
import Button from '../common/Button'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'
import '../../styles/disputes.css'

export default function DisputeForm ({ onSubmit, onCancel }) {
  const { t } = useLanguage()
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categoryOptions = useMemo(
    () =>
      Object.entries(DISPUTE_CATEGORY_LABELS).map(([value, label]) => ({
        value,
        label: t(label)
      })),
    [t]
  )

  const validate = () => {
    const next = {}

    if (!category) next.category = t('Choose a category')
    if (subject.trim().length < 3) {
      next.subject = t('Enter at least {min} characters', { min: 3 })
    }
    if (description.trim().length < 10) {
      next.description = t('Enter at least {min} characters', { min: 10 })
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
        category,
        subject: subject.trim(),
        description: description.trim()
      })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className='form' onSubmit={handleSubmit} noValidate>
      <Select
        label='Category'
        name='category'
        placeholder='Choose a category'
        options={categoryOptions}
        value={category}
        error={errors.category}
        onChange={event => setCategory(event.target.value)}
      />
      <Input
        label='Subject'
        name='subject'
        value={subject}
        maxLength={120}
        required
        error={errors.subject}
        onChange={event => setSubject(event.target.value)}
      />
      <Textarea
        label='What happened?'
        hint='Describe the problem and name the people involved.'
        rows={5}
        value={description}
        maxLength={2000}
        required
        error={errors.description}
        onChange={event => setDescription(event.target.value)}
      />

      {submitError && (
        <p className='field-error' role='alert'>
          {submitError}
        </p>
      )}

      <div className='dispute-actions'>
        <Button type='submit' loading={submitting}>
          {t('Send report')}
        </Button>
        <Button variant='secondary' onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
