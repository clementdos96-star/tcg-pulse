// src/pages/ScanPage.jsx — V4 (auto-scan continu)
import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Camera, Loader, Check, Search } from 'lucide-react'
import { useScanner } from '../hooks/useScanner'
import { useCardSearch } from '../hooks/useCardSearch'
import { CardImage } from '../components/CardImage'
import { RarityChip } from '../components/RarityChip'
import { GameIcon } from '../components/GameIcon'
import { getDisplayName } from '../lib/format'

export function ScanPage({ onClose, onScanned, onAddExisting }) {
  const [matches, setMatches] = useState([])
  const [adding, setAdding] = useState(false)
  const [addedCount, setAddedCount] = useState(0)
  const [manualQuery, setManualQuery] = useState('')
  const lastVibrateRef = useRef(0)

  const handleMatch = useCallback((found) => {
    const now = Date.now()
    if (now - lastVibrateRef.current > 2000) lastVibrateRef.current = now
    setMatches(found)
  }, [])

  const { videoRef, canvasRef, ready, busy, error, debug } = useScanner({ enabled: true, onMatch: handleMatch })
  const { results: manualResults, search: manualSearch, clear: clearManual } = useCardSearch()

  useEffect(() => {
    if (manualQuery.trim().length >= 2) manualSearch(manualQuery)
    else clearManual()
  }, [manualQuery, manualSearch, clearManual])

  const suggestions = manualQuery.trim().length >= 2 ? manualResults : matches

  async function handleAdd(card) {
    if (!card || adding) return
    setAdding(true)
    const { error: err } = await onAddExisting({ card_id: card.id, cardInfo: card, condition: 'NM', quantity: 1 })
    setAdding(false)
    if (!err) {
      setAddedCount(c => c + 1)
      setMatches([]); setManualQuery(''); clearManual()
      onScanned?.(card)
    }
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--bg)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(239,68,68,0.2)' }}>
          <Camera size={28} style={{ color: 'var(--red)' }} />
        </div>
        <h1 className="font-display font-bold text-xl mb-2 text-center">Caméra inaccessible</h1>
        <p className="text-sm font-mono px-4 py-3 rounded-xl mb-6 max-w-sm text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{error}</p>
        <button onClick={onClose}
          className="px-6 py-3 rounded-xl font-display font-bold transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: 'white' }}>Retour</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative w-full" style={{ height: '50vh' }}>
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}><X size={18} color="white" /></button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            {!ready ? (<><Loader size={12} color="white" className="animate-spin" /><span className="text-xs font-mono text-white">Init…</span></>)
              : busy ? (<><Loader size={12} color="#7C3AED" className="animate-spin" /><span className="text-xs font-mono text-white">Analyse…</span></>)
              : (<><span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} /><span className="text-xs font-mono text-white">Scan auto</span></>)}
          </div>
          {addedCount > 0 && <div className="px-3 py-1.5 rounded-full text-xs font-mono" style={{ background: 'rgba(16,185,129,0.85)', color: 'white' }}>+{addedCount}</div>}
        </div>
        <div className="absolute pointer-events-none" style={{ left: '5%', right: '5%', top: '55%', bottom: '5%', border: '2px dashed white', borderRadius: 12, opacity: 0.6 }} />
        {ready && matches.length === 0 && manualQuery.length < 2 && (
          <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
            <p className="inline-block text-xs font-mono px-3 py-1.5 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
              Place le numéro de la carte dans le cadre
            </p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3" style={{ background: 'var(--bg)' }}>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
          <input type="text" autoComplete="off" placeholder="Pas trouvé ? Tape le numéro ou nom…"
            value={manualQuery} onChange={e => setManualQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        {suggestions.length > 0 && (
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            {manualQuery.length >= 2 ? 'Recherche manuelle' : 'Détecté par caméra'} · {suggestions.length} résultat{suggestions.length > 1 ? 's' : ''}
          </p>
        )}
        <div className="space-y-2">
          {suggestions.map(card => (
            <button key={card.id} onClick={() => handleAdd(card)} disabled={adding}
              className="w-full rounded-xl p-3 flex items-stretch gap-3 text-left transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <CardImage src={card.image_url} alt={getDisplayName(card)} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5"><GameIcon game={card.game} size={11} /><RarityChip rarity={card.rarity} /></div>
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{getDisplayName(card)}</p>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>{card.card_number}</p>
              </div>
              <div className="self-center">
                {adding ? <Loader size={18} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#9333EA)', color: 'white' }}><Check size={16} /></div>}
              </div>
            </button>
          ))}
        </div>
        {suggestions.length === 0 && manualQuery.length < 2 && (
          <div className="text-center pt-6 pb-4">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{ready ? '👀 Cadre une carte devant la caméra' : 'Préparation du scanner…'}</p>
            {debug.ocr && <p className="text-[10px] font-mono mt-3 px-2 py-1 inline-block rounded" style={{ color: 'var(--muted)', opacity: 0.5, background: 'var(--card)' }}>OCR: {debug.ocr}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
