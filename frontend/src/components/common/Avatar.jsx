import { useEffect, useState } from 'react'
import '../../styles/upload.css'

export default function Avatar ({ name = '', src = '', size }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const initial = (name || '?').trim().charAt(0).toUpperCase()
  const showImage = Boolean(src) && !failed
  const style = size
    ? { width: size, height: size, fontSize: Math.round(size * 0.42) }
    : undefined

  return (
    <span className='avatar' style={style} aria-hidden='true'>
      {showImage
        ? (
          <img src={src} alt='' onError={() => setFailed(true)} />
          )
        : (
            initial
          )}
    </span>
  )
}