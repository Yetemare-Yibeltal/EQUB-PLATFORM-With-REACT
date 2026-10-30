import { useLanguage } from '../../hooks/useLanguage'
import Button from './Button'

export default function Pagination ({ meta, onPageChange, disabled = false }) {
  const { t } = useLanguage()

  if (!meta || meta.totalPages <= 1) return null

  return (
    <nav className='pagination' aria-label={t('Pagination')}>
      <Button
        variant='secondary'
        size='sm'
        disabled={disabled || !meta.hasPreviousPage}
        onClick={() => onPageChange(meta.page - 1)}
      >
        {t('Previous')}
      </Button>
      <span className='muted'>
        {t('Page {page} of {total}', {
          page: meta.page,
          total: meta.totalPages
        })}
      </span>
      <Button
        variant='secondary'
        size='sm'
        disabled={disabled || !meta.hasNextPage}
        onClick={() => onPageChange(meta.page + 1)}
      >
        {t('Next')}
      </Button>
    </nav>
  )
}
