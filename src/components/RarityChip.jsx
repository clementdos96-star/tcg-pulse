// src/components/RarityChip.jsx
const RARITY_PALETTE = {
  C:   { fg: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.3)' },
  UC:  { fg: '#10B981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)' },
  R:   { fg: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)' },
  RR:  { fg: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)' },
  SR:  { fg: '#EC4899', bg: 'rgba(236,72,153,0.15)',  border: 'rgba(236,72,153,0.3)' },
  SAR: { fg: '#F472B6', bg: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.3)' },
  UR:  { fg: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)' },
  HR:  { fg: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.3)' },
  AR:  { fg: '#FB923C', bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.3)' },
  L:   { fg: '#EF4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)' },
  SEC: { fg: '#A855F7', bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.3)' },
  SP:  { fg: '#06B6D4', bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.3)' },
}
const FALLBACK = { fg: 'var(--muted)', bg: 'var(--bg)', border: 'var(--border)' }
export function RarityChip({ rarity, size = 'sm' }) {
  if (!rarity) return null
  const palette = RARITY_PALETTE[rarity] || FALLBACK
  const padding = size === 'lg' ? 'px-2.5 py-0.5' : 'px-1.5 py-0.5'
  const fontSize = size === 'lg' ? '11px' : '10px'
  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-semibold tracking-wide ${padding}`}
      style={{ color: palette.fg, background: palette.bg, border: `1px solid ${palette.border}`, fontSize }}>
      {rarity}
    </span>
  )
}
