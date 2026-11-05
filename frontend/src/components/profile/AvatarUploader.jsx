import { useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { getErrorMessage } from '../../utils/errors'
import { ACCEPTED_IMAGE_TYPES, prepareImage } from '../../utils/imageCompress'
import Avatar from '../common/Avatar'
import Button from '../common/Button'
import ErrorMessage from '../common/ErrorMessage'

export default function AvatarUploader () {
  const { user, updateAvatar, removeAvatar } = useAuth()
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const describe = caught =>
    caught.response ? getErrorMessage(caught) : t(caught.message)

  const handleChoose = async event => {
    const chosen = event.target.files?.[0]
    event.target.value = ''

    if (!chosen) return

    setBusy('upload')
    setError('')
    setMessage('')

    try {
      const file = await prepareImage(chosen, { maxSide: 512 })
      await updateAvatar(file)
      setMessage(t('Profile photo updated'))
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setBusy('')
    }
  }

  const handleRemove = async () => {
    setBusy('remove')
    setError('')
    setMessage('')

    try {
      await removeAvatar()
      setMessage(t('Profile photo removed'))
    } catch (caught) {
      setError(describe(caught))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className='avatar-uploader'>
      <Avatar name={user.fullName} src={user.avatarUrl} size={96} />
      <div className='avatar-uploader-actions'>
        <p className='muted'>
          {t(
            'Upload a clear photo. It is shrunk automatically before sending.'
          )}
        </p>
        <input
          ref={inputRef}
          type='file'
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={handleChoose}
        />
        <div className='avatar-uploader-buttons'>
          <Button
            type='button'
            size='sm'
            loading={busy === 'upload'}
            disabled={busy === 'remove'}
            onClick={() => inputRef.current?.click()}
          >
            {user.avatarUrl ? t('Change photo') : t('Choose photo')}
          </Button>
          {user.avatarUrl && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              loading={busy === 'remove'}
              disabled={busy === 'upload'}
              onClick={handleRemove}
            >
              {t('Remove photo')}
            </Button>
          )}
        </div>
        <ErrorMessage message={error} />
        {message && (
          <p className='alert alert-success' role='status'>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
