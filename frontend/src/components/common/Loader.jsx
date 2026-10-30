import { useLanguage } from '../../hooks/useLanguage'

export default function Loader ({ label = 'Loading', fullScreen = false }) {
  const { t } = useLanguage()

  return (
    <div
      className={fullScreen ? 'center-screen' : 'loader'}
      role='status'
      aria-live='polite'
    >
      <span className='spinner' aria-hidden='true' />
      <span className='visually-hidden'>{t(label)}</span>
    </div>
  )
}
