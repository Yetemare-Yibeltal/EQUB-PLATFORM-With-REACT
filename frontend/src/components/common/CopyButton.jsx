import { useEffect, useState } from 'react'
import { useLanguage } from '../../hooks/useLanguage'
import Button from './Button'

const copyWithFallback = value => {
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const succeeded = document.execCommand('copy')
  document.body.removeChild(area)
  return succeeded
}

export default function CopyButton ({
  value,
  label = 'Copy',
  variant = 'secondary'
}) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined

    const timer = setTimeout(() => setCopied(false), 2000)

    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(copyWithFallback(value))
    }
  }

  return (
    <Button variant={variant} size='sm' onClick={handleCopy}>
      {copied ? t('Copied') : t(label)}
    </Button>
  )
}
