import { useState } from 'react'
import { X, Loader, ChevronDown, Trash2 } from 'lucide-react'
import { CardImage } from './CardImage'
import { RarityChip } from './RarityChip'
import { GameIcon, GAME_LABEL, GAME_COLOR } from './GameIcon'
import { formatPrice, getDisplayName } from '../lib/format'

const CONDITIONS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'P']
const CONDITION_LABELS = { M: 'Mint', NM: 'Near Mint', EX: 'Excellent', GD: 'Good', LP: 'Light Played', PL: 'Played', P: 'Poor' }

export function EditEntryModal({ entry, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ condition: entry.condition || 'NM', quantity: entry.quantity || 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async () => {
    setError(null); setLoading(true)
    const { error: err } = await onSave({ condition: form.condition, quantity: parseInt(form.quantity, 10) || 1 })
    if (err) setError(err)
    setLoading(false)
  }
  const gameLabel = GAME_LABEL[entry.game] || entry.game
  const gameColor = GAME_COLOR[entry.game] || 'var(--muted)'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl pb-8 pt-5 px-5 animate-fade-up max-h-[92dvh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Modifier</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}><X size={16} /></button>
        </div>
        <div className="rounded-xl p-3 mb-5 flex gap-3 items-start" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <CardImage src={entry.image_url} alt={getDisplayName(entry)} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <GameIcon game={entry.game} size={11} />
              <span className="text-[11px] font-mono font-semibold" style={{ color: gameColor }}>{gameLabel}</span>
              <RarityChip rarity={entry.rarity} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text)' }}>{getDisplayName(entry)}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted)' }}>{entry.card_number}</p>
            {entry.price_trend > 0 && (
              <p className="text-sm font-mono font-semibold mt-1" style={{ color: 'var(--gold)' }}>
                {formatPrice(entry.price_trend, entry.price_currency || 'EUR')}
                <span className="text-[10px] ml-1" style={{ color: 'var(--muted)' }}>/ unité</span>
              </p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="État">
              <div className="relative">
                <select value={form.condition} onChange={e => set('condition', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c} — {CONDITION_LABELS[c]}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
              </div>
            </Field>
            <Field label="Quantité">
              <input type="number" min="1" max="99" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </Field>
          </div>
          {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}>⚠️ {error}</p>}
          <button onClick={handleSave} disabled={loading}
            className="w-full py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
            {loading ? <Loader size={18} className="animate-spin" /> : null}Enregistrer
          </button>
          <button onClick={() => { onDelete(); onClose() }}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}>
            <Trash2 size={14} />Retirer de la collection
          </button>
        </div>
      </div>
    </div>
  )
}
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-mono tracking-widest uppercase mb-2 block" style={{ color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  )
}
