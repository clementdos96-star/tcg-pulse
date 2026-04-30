// src/lib/format.js
export const formatEur = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
export const formatUsd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
export const formatPrice = (n, currency = 'EUR') =>
  currency === 'USD' ? formatUsd(n) : formatEur(n)
export const getDisplayName = (card) => card?.name_fr || card?.name || ''

export function computeStats(collection) {
  const totalValue = collection.reduce((s, c) => s + ((c.price_trend || 0) * (c.quantity || 1)), 0)
  const topCard = collection.reduce((top, c) => ((c.price_trend || 0) > (top?.price_trend || 0) ? c : top), null)
  return {
    totalCards: collection.length,
    totalItems: collection.reduce((s, c) => s + (c.quantity || 1), 0),
    totalValue, topCard,
  }
}
export function valueByGame(collection) {
  const map = {}
  for (const c of collection) {
    const v = (c.price_trend || 0) * (c.quantity || 1)
    map[c.game] = (map[c.game] || 0) + v
  }
  return Object.entries(map).map(([game, value]) => ({ game, value }))
}
export function countByRarity(collection) {
  const map = {}
  for (const c of collection) {
    const r = c.rarity || '—'
    map[r] = (map[r] || 0) + (c.quantity || 1)
  }
  return Object.entries(map).map(([rarity, count]) => ({ rarity, count })).sort((a, b) => b.count - a.count)
}
