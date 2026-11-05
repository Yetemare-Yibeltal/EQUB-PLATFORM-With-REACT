import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import { ACCEPTED_IMAGE_TYPES, prepareImage } from '../../utils/imageCompress'
import '../../styles/upload.css'
import Button from './Button'

export default function ImagePicker ({
  label,
  hint,
  file,
  onChange,
  error,
  disabled = false,
  maxSide
}) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [working, setWorking] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleChange = async event => {
    const chosen = event.target.files?.[0]
    event.target.value = ''

    if (!chosen) return

    setWorking(true)
    setLocalError('')

    try {
      onChange(await prepareImage(chosen, { maxSide }))
    } catch (caught) {
      setLocalError(t(caught.message))
    } finally {
      setWorking(false)
    }
  }

  const handleRemove = () => {
    setLocalError('')
    onChange(null)
  }

  const shownError = localError || error

  return (
    <div className='image-picker'>
      <label className='image-picker-label' htmlFor={inputId}>
        {t(label)}
      </label>
      {hint && <span className='image-picker-hint muted'>{t(hint)}</span>}
      <input
        id={inputId}
        ref={inputRef}
        type='file'
        accept={ACCEPTED_IMAGE_TYPES}
        hidden
        disabled={disabled || working}
        onChange={handleChange}
      />
      {preview && (
        <img
          className='image-picker-preview'
          src={preview}
          alt={t('Selected image preview')}
        />
      )}
      <div className='image-picker-row'>
        <Button
          type='button'
          variant='secondary'
          size='sm'
          loading={working}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {file ? t('Change image') : t('Choose image')}
        </Button>
        {file && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={disabled || working}
            onClick={handleRemove}
          >
            {t('Remove image')}
          </Button>
        )}
      </div>
      {shownError && (
        <p className='field-error' role='alert'>
          {shownError}
        </p>
      )}
    </div>
  )
}
