// src/components/CardImage.jsx
import { useState } from 'react'
import { ImageOff } from 'lucide-react'

const SIZES = {
  xs: { w: 32, h: 44, icon: 11 },
  sm: { w: 40, h: 55, icon: 14 },
  md: { w: 48, h: 66, icon: 16 },
  lg: { w: 64, h: 88, icon: 18 },
  xl: { w: 96, h: 132, icon: 22 },
}

export function CardImage({ src, alt, size = 'sm', className = '' }) {
  const [errored, setErrored] = useState(false)
  const dim = SIZES[size] || SIZES.sm
  if (!src || errored) {
    return (
      <div className={`rounded flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: dim.w, height: dim.h, background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <ImageOff size={dim.icon} style={{ color: 'var(--muted)' }} />
      </div>
    )
  }
  return (
    <img src={src} alt={alt || ''} loading="lazy" onError={() => setErrored(true)}
      className={`rounded flex-shrink-0 object-cover ${className}`}
      style={{ width: dim.w, height: dim.h, border: '1px solid var(--border)' }} />
  )
}
