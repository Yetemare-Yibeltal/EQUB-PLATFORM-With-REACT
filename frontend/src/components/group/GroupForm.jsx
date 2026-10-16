import { useState } from 'react'
import { FREQUENCY_LABELS, PAYOUT_ORDER_LABELS } from '../../constants/statuses'
import { todayInputValue } from '../../utils/dateInput'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import { toBirr, toSantim } from '../../utils/formatCurrency'
import { hasErrors } from '../../utils/validators'
import Button from '../common/Button'
import Checkbox from '../common/Checkbox'
import ErrorMessage from '../common/ErrorMessage'
import Input from '../common/Input'
import Select from '../common/Select'
import Textarea from '../common/Textarea'

const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(
  ([value, label]) => ({
    value,
    label
  })
)

const PAYOUT_OPTIONS = Object.entries(PAYOUT_ORDER_LABELS).map(
  ([value, label]) => ({
    value,
    label
  })
)

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/

const buildInitial = group =>
  group
    ? {
        name: group.name,
        description: group.description ?? '',
        contributionAmount: String(toBirr(group.contributionAmount)),
        frequency: group.frequency,
        maxMembers: String(group.maxMembers),
        startDate: group.startDate.slice(0, 10),
        requireApproval: group.requireApproval,
        latePenaltyAmount: String(toBirr(group.latePenaltyAmount)),
        gracePeriodDays: String(group.gracePeriodDays),
        payoutOrderMethod: group.payoutOrderMethod
      }
    : {
        name: '',
        description: '',
        contributionAmount: '',
        frequency: 'monthly',
        maxMembers: '',
        startDate: '',
        requireApproval: false,
        latePenaltyAmount: '0',
        gracePeriodDays: '0',
        payoutOrderMethod: 'random_draw'
      }

const toPayload = values => ({
  name: values.name.trim(),
  description: values.description.trim(),
  contributionAmount: toSantim(values.contributionAmount),
  frequency: values.frequency,
  maxMembers: Number(values.maxMembers),
  startDate: values.startDate,
  requireApproval: values.requireApproval,
  latePenaltyAmount: toSantim(values.latePenaltyAmount || 0),
  gracePeriodDays: Number(values.gracePeriodDays || 0),
  payoutOrderMethod: values.payoutOrderMethod
})

const validate = (values, group) => {
  const errors = {}
  const name = values.name.trim()
  const amount = Number(values.contributionAmount)
  const members = Number(values.maxMembers)
  const penaltyText = values.latePenaltyAmount || '0'
  const penalty = Number(penaltyText)
  const grace = Number(values.gracePeriodDays || 0)

  if (name.length < 3) errors.name = 'Group name must be at least 3 characters'
  else if (name.length > 100)
    errors.name = 'Group name must not exceed 100 characters'

  if (!MONEY_PATTERN.test(values.contributionAmount)) {
    errors.contributionAmount =
      'Enter an amount in ETB with at most two decimals'
  } else if (amount < 1) {
    errors.contributionAmount = 'Contribution must be at least 1 ETB'
  } else if (amount > 1000000) {
    errors.contributionAmount = 'Contribution is too large'
  }

  if (!Number.isInteger(members) || members < 2 || members > 100) {
    errors.maxMembers = 'Enter a whole number from 2 to 100'
  } else if (group && members < group.memberCount) {
    errors.maxMembers = 'Cannot be lower than the current member count'
  }

  if (!values.startDate) {
    errors.startDate = 'Start date is required'
  } else if (!group && values.startDate < todayInputValue()) {
    errors.startDate = 'Start date cannot be in the past'
  }

  if (!MONEY_PATTERN.test(penaltyText)) {
    errors.latePenaltyAmount =
      'Enter an amount in ETB with at most two decimals'
  } else if (!errors.contributionAmount && penalty > amount) {
    errors.latePenaltyAmount =
      'Late penalty cannot exceed the contribution amount'
  }

  if (!Number.isInteger(grace) || grace < 0 || grace > 30) {
    errors.gracePeriodDays = 'Enter a whole number from 0 to 30'
  }

  return errors
}

export default function GroupForm ({ group = null, onSubmit, submitLabel }) {
  const [initial] = useState(() => buildInitial(group))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const locked = Boolean(group) && group.memberCount > 1

  const handleChange = event => {
    const { name, value, type, checked } = event.target
    setValues(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const nextErrors = validate(values, group)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    let payload = toPayload(values)

    if (group) {
      const baseline = toPayload(initial)
      payload = Object.fromEntries(
        Object.entries(payload).filter(
          ([key, value]) => value !== baseline[key]
        )
      )

      if (Object.keys(payload).length === 0) {
        setSubmitError('There are no changes to save')
        return
      }
    }

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
    <form className='form' onSubmit={handleSubmit} noValidate>
      <ErrorMessage message={submitError} />
      <Input
        label='Group name'
        name='name'
        value={values.name}
        onChange={handleChange}
        error={errors.name}
        maxLength={100}
        required
      />
      <Textarea
        label='Description (optional)'
        name='description'
        value={values.description}
        onChange={handleChange}
        error={errors.description}
        maxLength={1000}
      />
      <div className='grid-2'>
        <Input
          label='Contribution per cycle (ETB)'
          name='contributionAmount'
          inputMode='decimal'
          value={values.contributionAmount}
          onChange={handleChange}
          error={errors.contributionAmount}
          disabled={locked}
          hint={locked ? 'Locked after other members have joined' : undefined}
          required
        />
        <Select
          label='Frequency'
          name='frequency'
          options={FREQUENCY_OPTIONS}
          value={values.frequency}
          onChange={handleChange}
          error={errors.frequency}
          disabled={locked}
          required
        />
      </div>
      <div className='grid-2'>
        <Input
          label='Number of members'
          name='maxMembers'
          type='number'
          min='2'
          max='100'
          value={values.maxMembers}
          onChange={handleChange}
          error={errors.maxMembers}
          hint='Each member receives the pot once, so this is also the number of cycles'
          required
        />
        <Input
          label='Start date'
          name='startDate'
          type='date'
          min={group ? undefined : todayInputValue()}
          value={values.startDate}
          onChange={handleChange}
          error={errors.startDate}
          required
        />
      </div>
      <div className='grid-2'>
        <Input
          label='Late penalty (ETB)'
          name='latePenaltyAmount'
          inputMode='decimal'
          value={values.latePenaltyAmount}
          onChange={handleChange}
          error={errors.latePenaltyAmount}
        />
        <Input
          label='Grace period (days)'
          name='gracePeriodDays'
          type='number'
          min='0'
          max='30'
          value={values.gracePeriodDays}
          onChange={handleChange}
          error={errors.gracePeriodDays}
          hint='A payment is late after the due date plus these days'
        />
      </div>
      <Select
        label='Payout order'
        name='payoutOrderMethod'
        options={PAYOUT_OPTIONS}
        value={values.payoutOrderMethod}
        onChange={handleChange}
        error={errors.payoutOrderMethod}
      />
      <Checkbox
        label='Require my approval before members join'
        name='requireApproval'
        checked={values.requireApproval}
        onChange={handleChange}
      />
      <Button type='submit' loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
