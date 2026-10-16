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
  return (
    <Modal
      open={open}
      title={title}
      size='sm'
      onClose={loading ? noop : onCancel}
      footer={
        <>
          <Button variant='secondary' onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}
