import { useLanguage } from '../../hooks/useLanguage'
import Button from './Button'
import Modal from './Modal'

const noop = () => {}

export default function ConfirmDialog ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel
}) {
  const { t } = useLanguage()
  const translate = value => (typeof value === 'string' ? t(value) : value)

  return (
    <Modal
      open={open}
      title={title}
      size='sm'
      onClose={loading ? noop : onCancel}
      footer={
        <>
          <Button variant='secondary' onClick={onCancel} disabled={loading}>
            {translate(cancelLabel)}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {translate(confirmLabel)}
          </Button>
        </>
      }
    >
      <p>{translate(message)}</p>
    </Modal>
  )
}
