// src/components/StatCard.jsx
import { CardImage } from './CardImage'
export function StatCard({ label, value, sub, accent = false, delay = 0, imageUrl = null, imageAlt = '', onClick = null }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick}
      className={`animate-fade-up card-glow rounded-2xl p-4 text-left w-full transition-all ${onClick ? 'active:scale-[0.98]' : ''}`}
      style={{
        animationDelay: `${delay}s`, opacity: 0,
        background: accent ? 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(245,158,11,0.08))' : 'var(--card)',
        border: accent ? '1px solid rgba(124,58,237,0.3)' : '1px solid var(--border)',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono tracking-widest uppercase truncate" style={{ color: 'var(--muted)' }}>{label}</p>
          <p className={`mt-1 text-2xl font-display font-bold tracking-tight truncate ${accent ? 'gradient-text' : ''}`}
             style={!accent ? { color: 'var(--text)' } : {}}>{value}</p>
          {sub && <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--muted)' }}>{sub}</p>}
        </div>
        {imageUrl && <CardImage src={imageUrl} alt={imageAlt} size="sm" />}
      </div>
    </Tag>
  )
}
