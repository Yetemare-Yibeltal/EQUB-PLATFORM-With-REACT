import Button from './Button'

export default function Pagination ({ meta, onPageChange, disabled = false }) {
  if (!meta || meta.totalPages <= 1) return null

  return (
    <nav className='pagination' aria-label='Pagination'>
      <Button
        variant='secondary'
        size='sm'
        disabled={disabled || !meta.hasPreviousPage}
        onClick={() => onPageChange(meta.page - 1)}
      >
        Previous
      </Button>
      <span className='muted'>
        Page {meta.page} of {meta.totalPages}
      </span>
      <Button
        variant='secondary'
        size='sm'
        disabled={disabled || !meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Next
      </Button>
    </nav>
  )
}
