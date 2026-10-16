export default function Loader ({ label = 'Loading', fullScreen = false }) {
  return (
    <div
      className={fullScreen ? 'center-screen' : 'loader'}
      role='status'
      aria-live='polite'
    >
      <span className='spinner' aria-hidden='true' />
      <span className='visually-hidden'>{label}</span>
    </div>
  )
}
