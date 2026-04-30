import { useState, useEffect } from 'react'
import { X, Loader, ChevronDown, Search, Check } from 'lucide-react'
import { useCardSearch } from '../hooks/useCardSearch'
import { CardImage } from './CardImage'
import { RarityChip } from './RarityChip'
import { GameIcon } from './GameIcon'
import { getDisplayName } from '../lib/format'

const CONDITIONS = ['M', 'NM', 'EX', 'GD', 'LP', 'PL', 'P']
const CONDITION_LABELS = { M: 'Mint', NM: 'Near Mint', EX: 'Excellent', GD: 'Good', LP: 'Light Played', PL: 'Played', P: 'Poor' }
const RARITIES_POKEMON = ['C', 'UC', 'R', 'RR', 'SR', 'SAR', 'UR', 'HR', 'AR', 'SP']
const RARITIES_ONEPIECE = ['C', 'UC', 'R', 'SR', 'SEC', 'L', 'SP']

export function AddCardModal({ onClose, onAdd, onAddExisting }) {
  const [form, setForm] = useState({ game: 'onepiece', name: '', card_number: '', set_code: '', rarity: '', condition: 'NM', quantity: 1 })
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [selectedCardInfo, setSelectedCardInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const { results, searching, search, clear } = useCardSearch()
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const rarities = form.game === 'pokemon' ? RARITIES_POKEMON : RARITIES_ONEPIECE

  useEffect(() => { setHighlightedIndex(results.length > 0 ? 0 : -1) }, [results])
  useEffect(() => {
    if (selectedCardId) return
    if (form.name.length >= 2) { search(form.name, form.game); setShowResults(true) }
    else { clear(); setShowResults(false) }
  }, [form.name, form.game, selectedCardId, search, clear])

  const handleSearchKeyDown = (e) => {
    if (!showResults || results.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); const pick = results[highlightedIndex] || results[0]; if (pick) selectResult(pick) }
    else if (e.key === 'Escape') { e.preventDefault(); setShowResults(false) }
  }
  const selectResult = (card) => {
    setSelectedCardId(card.id); setSelectedCardInfo(card)
    setForm(f => ({ ...f, game: card.game, name: card.name, card_number: card.card_number, set_code: card.set_code, rarity: card.rarity || '' }))
    setShowResults(false); clear()
  }
  const clearSelection = () => { setSelectedCardId(null); setSelectedCardInfo(null) }

  const handleSubmit = async () => {
    setError(null)
    if (!form.name || !form.card_number) { setError('Nom et numéro de carte sont obligatoires'); return }
    setLoading(true)
    const payload = { ...form, quantity: parseInt(form.quantity, 10) || 1 }
    let result
    if (selectedCardId && onAddExisting) {
      result = await onAddExisting({ card_id: selectedCardId, cardInfo: selectedCardInfo, condition: payload.condition, quantity: payload.quantity })
    } else { result = await onAdd(payload) }
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl pb-8 pt-5 px-5 animate-fade-up max-h-[92dvh] overflow-y-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Ajouter une carte</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-2 block" style={{ color: 'var(--muted)' }}>Jeu</label>
            <div className="flex gap-2">
              {['onepiece', 'pokemon'].map(g => (
                <button key={g} onClick={() => { set('game', g); set('rarity', ''); clearSelection() }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.game === g ? (g === 'pokemon' ? 'rgba(234,179,8,0.15)' : 'rgba(244,63,94,0.15)') : 'var(--bg)',
                    border: `1px solid ${form.game === g ? (g === 'pokemon' ? 'var(--gold)' : 'var(--red)') : 'var(--border)'}`,
                    color: form.game === g ? (g === 'pokemon' ? 'var(--gold)' : 'var(--red)') : 'var(--muted)',
                  }}>
                  {g === 'pokemon' ? '⚡ Pokémon' : '☠️ One Piece'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest uppercase mb-2 block" style={{ color: 'var(--muted)' }}>
              Nom de la carte *{selectedCardId && <span className="ml-2" style={{ color: 'var(--green)' }}>· réf</span>}
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
              <input type="text" placeholder="ex: Monkey D. Luffy, Pikachu, Dracaufeu..."
                value={form.name} onChange={e => { set('name', e.target.value); clearSelection() }}
                onFocus={() => form.name.length >= 2 && setShowResults(true)} onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: `1px solid ${selectedCardId ? 'var(--green)' : 'var(--border)'}`, color: 'var(--text)' }} />
              {searching && <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: 'var(--muted)' }} />}
            </div>
            {showResults && results.length > 0 && !selectedCardId && (
              <div role="listbox" className="mt-2 rounded-xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                {results.map((r, idx) => {
                  const isHighlighted = idx === highlightedIndex
                  return (
                    <button key={r.id} role="option" onClick={() => selectResult(r)} onMouseEnter={() => setHighlightedIndex(idx)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
                      style={{ borderBottom: '1px solid var(--border)', background: isHighlighted ? 'var(--accent-soft)' : 'transparent' }}>
                      <CardImage src={r.image_url} alt={getDisplayName(r)} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: isHighlighted ? 'var(--accent-glow)' : 'var(--text)' }}>{getDisplayName(r)}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <GameIcon game={r.game} size={10} />
                          <RarityChip rarity={r.rarity} />
                          <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>{r.card_number}</span>
                        </div>
                      </div>
                      <Check size={14} style={{ color: isHighlighted ? 'var(--accent-glow)' : 'var(--muted)', flexShrink: 0 }} />
                    </button>
                  )
                })}
                <p className="text-[10px] font-mono px-3 py-1.5 text-center" style={{ color: 'var(--muted)', background: 'rgba(0,0,0,0.2)' }}>↑↓ naviguer · ⏎ choisir · Esc fermer</p>
              </div>
            )}
            {selectedCardId && selectedCardInfo?.image_url && (
              <div className="mt-3 flex justify-center">
                <img src={selectedCardInfo.image_url} alt={selectedCardInfo.name} loading="lazy" className="rounded-lg" style={{ maxHeight: 180, border: '1px solid var(--border)' }} />
              </div>
            )}
            {selectedCardId && <p className="mt-2 text-xs text-center" style={{ color: 'var(--muted)' }}>Modifie le nom pour repartir de zéro.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numéro *">
              <input type="text" placeholder="ex: OP05-060" value={form.card_number}
                onChange={e => { set('card_number', e.target.value); clearSelection() }} disabled={!!selectedCardId}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none disabled:opacity-60"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </Field>
            <Field label="Set">
              <input type="text" placeholder="ex: OP05" value={form.set_code}
                onChange={e => { set('set_code', e.target.value); clearSelection() }} disabled={!!selectedCardId}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none disabled:opacity-60"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rareté">
              <div className="relative">
                <select value={form.rarity} onChange={e => { set('rarity', e.target.value); clearSelection() }} disabled={!!selectedCardId}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none disabled:opacity-60"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: form.rarity ? 'var(--text)' : 'var(--muted)' }}>
                  <option value="">— Rareté</option>
                  {rarities.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
              </div>
            </Field>
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
          </div>
          <Field label="Quantité">
            <input type="number" min="1" max="99" value={form.quantity} onChange={e => set('quantity', e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </Field>
          {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--red)', border: '1px solid rgba(244,63,94,0.3)' }}>⚠️ {error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent), #8B5CF6)', color: 'white', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}>
            {loading ? <Loader size={18} className="animate-spin" /> : null}
            {selectedCardId ? 'Ajouter à ma collection' : 'Enregistrer la carte'}
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
