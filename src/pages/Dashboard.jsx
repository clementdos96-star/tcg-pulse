// Dashboard V7 — UI refondue (grid cards + structure simplifiée)
import { useState, useMemo } from 'react'
import { Plus, Zap, Package, ScanLine, LogOut, RefreshCw, Sparkles } from 'lucide-react'
import { useCollection } from '../hooks/useCollection'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { StatCard } from '../components/StatCard'
import { GameBadge } from '../components/GameBadge'
import { AddCardModal } from '../components/AddCardModal'
import { EditEntryModal } from '../components/EditEntryModal'
import { ToastContainer } from '../components/ToastContainer'
import { FilterBar } from '../components/FilterBar'
import { PortfolioCharts } from '../components/PortfolioCharts'
import { RarityChip } from '../components/RarityChip'
import { GameIcon } from '../components/GameIcon'
import { CardImage } from '../components/CardImage'
import { ScanPage } from './ScanPage'
import { formatPrice, getDisplayName } from '../lib/format'
import { filterAndSort } from '../lib/filter'

export function Dashboard({ userId, userEmail }) {
  const { collection, stats, loading, error, addCard, addExistingCard, updateCard, removeLocally, restoreLocally, commitRemove, refresh } = useCollection(userId)
  const { signOut } = useAuth()
  const { toasts, dismiss, handleAction, push, success, error: toastError } = useToast()
  const [activeGame, setActiveGame] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [showCharts, setShowCharts] = useState(false)

  const handleRemove = (collectionId, cardName) => {
    const snapshot = removeLocally(collectionId)
    if (!snapshot.snapshot) return
    push({
      type: 'info', text: `${cardName || 'Carte'} retirée`, duration: 5000,
      action: { label: 'Annuler', onClick: () => restoreLocally(snapshot) },
      onTimeout: async () => { const { error: err } = await commitRemove(collectionId, snapshot); if (err) toastError(err) },
    })
  }

  const filtered = useMemo(() => filterAndSort(collection, { game: activeGame, query, sort }), [collection, activeGame, query, sort])
  const portfolioCurrency = collection[0]?.price_currency || 'EUR'

  if (showScan) {
    return <ScanPage onClose={() => setShowScan(false)}
      onScanned={(c) => { success(`${getDisplayName(c) || 'Carte'} ajoutée`); setShowScan(false) }}
      onAddExisting={addExistingCard} />
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="glass sticky top-0 z-50 flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--gold))' }}>
            <Zap size={16} fill="white" color="white" />
          </div>
          <span className="font-display font-bold text-lg">TCG <span className="gradient-text">Pulse</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} aria-label="Rafraîchir" className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}><RefreshCw size={14} /></button>
          <button onClick={signOut} aria-label="Déco" className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}><LogOut size={14} /></button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5 max-w-md mx-auto w-full">
        <p className="text-xs font-mono animate-fade-up" style={{ color: 'var(--muted)' }}>👋 {userEmail}</p>

        <section className="animate-fade-up rounded-3xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(234,179,8,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }} />
          <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Valeur Totale du Portfolio</p>
          <p className="mt-2 text-4xl font-display font-extrabold gradient-text leading-none">{formatPrice(stats.totalValue, portfolioCurrency)}</p>
          {stats.totalItems > 0 ? (
            <p className="mt-3 text-sm font-mono" style={{ color: 'var(--muted)' }}>
              {stats.totalItems} exemplaire{stats.totalItems > 1 ? 's' : ''} · {stats.totalCards} carte{stats.totalCards > 1 ? 's' : ''} unique{stats.totalCards > 1 ? 's' : ''}
            </p>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>Scanne ta 1ère carte ou ajoute-la à la main ✨</p>
          )}
        </section>

        {stats.totalCards > 0 && (
          <section className="grid grid-cols-2 gap-3">
            <StatCard label="Cartes uniques" value={stats.totalCards} sub={`${stats.totalItems} exemplaire${stats.totalItems > 1 ? 's' : ''}`} delay={0.1} />
            <StatCard label="Top carte" value={formatPrice(stats.topCard?.price_trend, stats.topCard?.price_currency || 'EUR')}
              sub={getDisplayName(stats.topCard) || '—'} delay={0.2}
              imageUrl={stats.topCard?.image_url} imageAlt={getDisplayName(stats.topCard)}
              onClick={stats.topCard ? () => setEditingEntry(stats.topCard) : null} />
          </section>
        )}

        {collection.length > 1 && (
          <section className="animate-fade-up anim-delay-2">
            <button onClick={() => setShowCharts(s => !s)} className="text-xs font-mono px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              {showCharts ? '↑ Masquer graphiques' : '↓ Afficher graphiques'}
            </button>
            {showCharts && <div className="mt-3 animate-fade-up"><PortfolioCharts collection={collection} /></div>}
          </section>
        )}

        <section className="animate-fade-up anim-delay-3">
          <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--muted)' }}>Filtrer par jeu</p>
          <div className="flex gap-2">
            <GameBadge game="pokemon" active={activeGame === 'pokemon'} onClick={() => setActiveGame(activeGame === 'pokemon' ? null : 'pokemon')} />
            <GameBadge game="onepiece" active={activeGame === 'onepiece'} onClick={() => setActiveGame(activeGame === 'onepiece' ? null : 'onepiece')} />
          </div>
        </section>

        {collection.length > 0 && (
          <section className="animate-fade-up anim-delay-3">
            <FilterBar query={query} onQuery={setQuery} sort={sort} onSort={setSort} total={collection.length} filtered={filtered.length} />
          </section>
        )}

        {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--red)' }}>⚠️ {error}</div>}

        <section className="animate-fade-up anim-delay-4 pb-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="aspect-[2/3] rounded-2xl skeleton" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState isEmpty={collection.length === 0} activeGame={activeGame} query={query} onScan={() => setShowScan(true)} onAdd={() => setShowModal(true)} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(card => <CollectionCard key={card.id} card={card} onEdit={() => setEditingEntry(card)} onRemove={(e) => { e.stopPropagation(); handleRemove(card.id, getDisplayName(card)) }} />)}
            </div>
          )}
        </section>
      </main>

      <footer className="sticky bottom-0 px-4 pb-6 pt-3 glass" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 max-w-md mx-auto">
          <button onClick={() => setShowScan(true)} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-95"
            style={{ background: 'var(--card)', border: '1.5px solid var(--accent)', color: 'var(--accent-glow)' }}><ScanLine size={18} />Scanner</button>
          <button onClick={() => setShowModal(true)} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-display font-bold text-base transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--accent), #8B5CF6)', color: 'white', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}><Plus size={18} strokeWidth={2.5} />Ajouter</button>
        </div>
      </footer>

      {showModal && <AddCardModal onClose={() => setShowModal(false)}
        onAdd={async (data) => { const { error: err } = await addCard(data); if (!err) { setShowModal(false); success(`${data.name} ajoutée`) } else toastError(err); return { error: err } }}
        onAddExisting={async (data) => { const { error: err } = await addExistingCard(data); if (!err) { setShowModal(false); success(`${getDisplayName(data.cardInfo) || 'Carte'} ajoutée`) } else toastError(err); return { error: err } }} />}

      {editingEntry && <EditEntryModal entry={editingEntry} onClose={() => setEditingEntry(null)}
        onSave={async (u) => { const { error: err } = await updateCard(editingEntry.id, u); if (!err) { setEditingEntry(null); success(`${getDisplayName(editingEntry)} mise à jour`) } else toastError(err); return { error: err } }}
        onDelete={() => handleRemove(editingEntry.id, getDisplayName(editingEntry))} />}

      <ToastContainer toasts={toasts} onDismiss={dismiss} onAction={handleAction} />
    </div>
  )
}

function CollectionCard({ card, onEdit, onRemove }) {
  const currency = card.price_currency || 'EUR'
  const totalValue = (card.price_trend || 0) * card.quantity
  return (
    <div className="card-glow rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: card._pending ? 0.6 : 1 }}>
      <button onClick={onEdit} className="relative w-full aspect-[63/88] overflow-hidden" style={{ background: 'var(--bg-2)' }}>
        {card.image_url ? (
          <img src={card.image_url} alt={getDisplayName(card)} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Package size={32} style={{ color: 'var(--muted-soft)' }} /></div>
        )}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <GameIcon game={card.game} size={10} />
            <RarityChip rarity={card.rarity} />
          </div>
          <button onClick={onRemove} aria-label="Retirer" className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>×</button>
        </div>
        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md flex items-center justify-between text-[10px] font-mono"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}>
          <span>{card.condition} · ×{card.quantity}</span>
          <span style={{ color: 'var(--gold-glow)' }}>{formatPrice(totalValue, currency)}</span>
        </div>
      </button>
      <button onClick={onEdit} className="px-2 py-1.5 text-left">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{getDisplayName(card)}</p>
        <p className="text-[10px] font-mono truncate" style={{ color: 'var(--muted)' }}>{card.card_number}</p>
      </button>
    </div>
  )
}

function EmptyState({ isEmpty, activeGame, query, onScan, onAdd }) {
  if (!isEmpty && (activeGame || query)) {
    return (
      <div className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center" style={{ border: '1px dashed var(--border)' }}>
        <Package size={32} style={{ color: 'var(--border)' }} />
        <p className="font-display font-semibold" style={{ color: 'var(--muted)' }}>Aucun résultat</p>
        <p className="text-sm" style={{ color: 'var(--muted)', opacity: 0.7 }}>Essaie d'autres filtres</p>
      </div>
    )
  }
  return (
    <div className="rounded-3xl p-8 flex flex-col items-center gap-4 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(234,179,8,0.04))', border: '1px dashed rgba(99,102,241,0.3)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--gold))' }}>
        <Sparkles size={28} fill="white" color="white" />
      </div>
      <div>
        <p className="font-display font-bold text-lg gradient-text">Ta collection démarre ici</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Scan ou ajout manuel</p>
      </div>
      <div className="flex gap-2 w-full max-w-xs">
        <button onClick={onScan} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
          style={{ background: 'var(--card)', border: '1.5px solid var(--accent)', color: 'var(--accent-glow)' }}><ScanLine size={14} />Scanner</button>
        <button onClick={onAdd} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg, var(--accent), #8B5CF6)', color: 'white' }}><Plus size={14} />Ajouter</button>
      </div>
    </div>
  )
}
