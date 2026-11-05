import { useEffect, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { paymentProofService } from '../../services/paymentProofService'
import { getErrorMessage } from '../../utils/errors'
import '../../styles/upload.css'
import Button from '../common/Button'
import Modal from '../common/Modal'

const groupIdOf = proof =>
  proof.group !== null && typeof proof.group === 'object'
    ? proof.group.id ?? proof.group._id
    : proof.group

export default function ProofScreenshot ({ proof, groupId }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const proofId = proof.id
  const resolvedGroupId = groupId ?? groupIdOf(proof)

  useEffect(() => {
    if (!open) return undefined

    let objectUrl = ''
    let cancelled = false

    setLoading(true)
    setError('')

    paymentProofService
      .screenshot(resolvedGroupId, proofId)
      .then(blob => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(caught => {
        if (!cancelled) setError(getErrorMessage(caught))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl('')
    }
  }, [open, resolvedGroupId, proofId])

  const close = () => setOpen(false)

  return (
    <>
      <Button size='sm' variant='ghost' onClick={() => setOpen(true)}>
        {t('View screenshot')}
      </Button>
      <Modal
        open={open}
        title={t('Payment screenshot')}
        onClose={close}
        footer={
          <Button variant='secondary' onClick={close}>
            {t('Close')}
          </Button>
        }
      >
        {loading && <p className='muted'>{t('Loading image…')}</p>}
        {error && (
          <p className='field-error' role='alert'>
            {error}
          </p>
        )}
        {url && (
          <img
            className='proof-screenshot'
            src={url}
            alt={t('Payment screenshot')}
          />
        )}
      </Modal>
    </>
  )
}
