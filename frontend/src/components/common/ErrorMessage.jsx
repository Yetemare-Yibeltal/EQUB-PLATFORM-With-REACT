import Button from './Button'

export default function ErrorMessage ({
  message,
  onRetry,
  retryLabel = 'Try again'
}) {
  if (!message) return null

  return (
    <div className='alert alert-error' role='alert'>
      <p>{message}</p>
      {onRetry && (
        <Button variant='secondary' size='sm' onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
