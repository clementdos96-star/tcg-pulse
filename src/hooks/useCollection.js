// src/hooks/useCollection.js — V5 (sans purchase_price)
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../services/supabase'

export function useCollection(userId) {
  const [collection, setCollection] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const stats = useMemo(() => {
    const totalValue = collection.reduce((s, c) => s + ((c.price_trend || 0) * (c.quantity || 1)), 0)
    const topCard = collection.reduce((top, c) => ((c.price_trend || 0) > (top?.price_trend || 0) ? c : top), null)
    return {
      totalCards: collection.length,
      totalItems: collection.reduce((s, c) => s + (c.quantity || 1), 0),
      totalValue, topCard,
    }
  }, [collection])

  const fetchCollection = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data: items, error: collErr } = await supabase.from('user_collection')
        .select(`id, condition, quantity, card_id, cards (id, name, name_fr, game, set_code, card_number, rarity, image_url)`)
        .eq('user_id', userId).order('created_at', { ascending: false })
      if (collErr) throw new Error(collErr.message)
      const cardIds = (items || []).map(i => i.card_id)
      const pricesByCard = {}
      if (cardIds.length > 0) {
        const { data: pricesData, error: pricesErr } = await supabase.from('prices')
          .select('card_id, price_trend, price_avg, price_low, last_updated, currency')
          .in('card_id', cardIds).order('last_updated', { ascending: false })
        if (pricesErr) throw new Error(pricesErr.message)
        for (const p of (pricesData || [])) if (!pricesByCard[p.card_id]) pricesByCard[p.card_id] = p
      }
      const flat = (items || []).map(item => {
        const price = pricesByCard[item.card_id] || null
        return {
          id: item.id, card_id: item.card_id, condition: item.condition, quantity: item.quantity,
          name: item.cards?.name, name_fr: item.cards?.name_fr, game: item.cards?.game,
          set_code: item.cards?.set_code, card_number: item.cards?.card_number,
          rarity: item.cards?.rarity, image_url: item.cards?.image_url,
          price_trend: price?.price_trend ?? 0, price_avg: price?.price_avg ?? 0,
          price_low: price?.price_low ?? 0, price_currency: price?.currency ?? 'EUR',
          price_last_updated: price?.last_updated ?? null,
        }
      })
      setCollection(flat)
    } catch (err) { setError(err.message || 'Erreur de chargement') }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { fetchCollection() }, [fetchCollection])

  const addCard = useCallback(async (cardData) => {
    if (!userId) return { error: 'Non connecté' }
    try {
      const { data: existing } = await supabase.from('cards')
        .select('id, name, name_fr, game, set_code, card_number, rarity, image_url')
        .eq('card_number', cardData.card_number).eq('game', cardData.game).maybeSingle()
      let cardInfo = existing
      if (!cardInfo) {
        const { data: newCard, error: insertErr } = await supabase.from('cards').insert({
          name: cardData.name, game: cardData.game, set_code: cardData.set_code || '',
          card_number: cardData.card_number, rarity: cardData.rarity || null,
          image_url: cardData.image_url || null,
        }).select('id, name, name_fr, game, set_code, card_number, rarity, image_url').single()
        if (insertErr) throw new Error(insertErr.message)
        cardInfo = newCard
      }
      const { data: upserted, error: upsertErr } = await supabase.from('user_collection').upsert({
        user_id: userId, card_id: cardInfo.id,
        condition: cardData.condition || 'NM',
        quantity: parseInt(cardData.quantity, 10) || 1,
      }, { onConflict: 'user_id,card_id,condition' }).select('id, condition, quantity, card_id').single()
      if (upsertErr) throw new Error(upsertErr.message)
      const newEntry = {
        id: upserted.id, card_id: upserted.card_id, condition: upserted.condition, quantity: upserted.quantity,
        name: cardInfo.name, name_fr: cardInfo.name_fr, game: cardInfo.game,
        set_code: cardInfo.set_code, card_number: cardInfo.card_number,
        rarity: cardInfo.rarity, image_url: cardInfo.image_url,
        price_trend: 0, price_avg: 0, price_low: 0, price_currency: 'EUR', price_last_updated: null,
      }
      setCollection(prev => {
        const idx = prev.findIndex(c => c.id === newEntry.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = newEntry; return next }
        return [newEntry, ...prev]
      })
      fetchCollection()
      return { error: null }
    } catch (err) { return { error: err.message || 'Erreur' } }
  }, [userId, fetchCollection])

  const addExistingCard = useCallback(async ({ card_id, cardInfo = null, condition = 'NM', quantity = 1 }) => {
    if (!userId) return { error: 'Non connecté' }
    if (!card_id) return { error: 'card_id manquant' }
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    setCollection(prev => [{
      id: tempId, card_id, condition, quantity: parseInt(quantity, 10) || 1,
      name: cardInfo?.name, name_fr: cardInfo?.name_fr, game: cardInfo?.game,
      set_code: cardInfo?.set_code, card_number: cardInfo?.card_number,
      rarity: cardInfo?.rarity, image_url: cardInfo?.image_url,
      price_trend: 0, price_avg: 0, price_low: 0, price_currency: 'EUR', price_last_updated: null, _pending: true,
    }, ...prev])
    try {
      const { data: upserted, error: upsertErr } = await supabase.from('user_collection').upsert({
        user_id: userId, card_id, condition, quantity: parseInt(quantity, 10) || 1,
      }, { onConflict: 'user_id,card_id,condition' }).select('id, condition, quantity, card_id').single()
      if (upsertErr) throw new Error(upsertErr.message)
      setCollection(prev => prev.map(c => c.id !== tempId ? c : { ...c, id: upserted.id, quantity: upserted.quantity, _pending: false }))
      fetchCollection()
      return { error: null }
    } catch (err) {
      setCollection(prev => prev.filter(c => c.id !== tempId))
      return { error: err.message || 'Erreur' }
    }
  }, [userId, fetchCollection])

  const updateCard = useCallback(async (collectionId, updates) => {
    if (!userId) return { error: 'Non connecté' }
    const allowed = {}
    if (updates.condition !== undefined) allowed.condition = updates.condition
    if (updates.quantity !== undefined) allowed.quantity = parseInt(updates.quantity, 10) || 1
    let prevSnapshot = null
    setCollection(prev => {
      const idx = prev.findIndex(c => c.id === collectionId)
      if (idx < 0) return prev
      prevSnapshot = prev[idx]
      const next = [...prev]; next[idx] = { ...prev[idx], ...allowed }
      return next
    })
    if (!prevSnapshot) return { error: 'Entrée introuvable' }
    try {
      const { error: upErr } = await supabase.from('user_collection').update(allowed).eq('id', collectionId).eq('user_id', userId)
      if (upErr) throw new Error(upErr.message)
      return { error: null }
    } catch (err) {
      setCollection(prev => prev.map(c => c.id === collectionId ? prevSnapshot : c))
      return { error: err.message || 'Erreur' }
    }
  }, [userId])

  const removeCard = useCallback(async (collectionId) => {
    let removed = null, removedIndex = -1
    setCollection(prev => {
      removedIndex = prev.findIndex(c => c.id === collectionId)
      if (removedIndex < 0) return prev
      removed = prev[removedIndex]
      return prev.filter(c => c.id !== collectionId)
    })
    try {
      const { error: delErr } = await supabase.from('user_collection').delete().eq('id', collectionId).eq('user_id', userId)
      if (delErr) throw new Error(delErr.message)
      return { error: null }
    } catch (err) {
      if (removed) setCollection(prev => { const next = [...prev]; next.splice(Math.min(removedIndex, next.length), 0, removed); return next })
      return { error: err.message || 'Erreur' }
    }
  }, [userId])

  const removeLocally = useCallback((collectionId) => {
    let snapshot = null, index = -1
    setCollection(prev => {
      index = prev.findIndex(c => c.id === collectionId)
      if (index < 0) return prev
      snapshot = prev[index]
      return prev.filter(c => c.id !== collectionId)
    })
    return { snapshot, index }
  }, [])

  const restoreLocally = useCallback(({ snapshot, index }) => {
    if (!snapshot) return
    setCollection(prev => {
      if (prev.some(c => c.id === snapshot.id)) return prev
      const next = [...prev]; next.splice(Math.min(Math.max(index, 0), next.length), 0, snapshot); return next
    })
  }, [])

  const commitRemove = useCallback(async (collectionId, snapshotForRollback) => {
    try {
      const { error: delErr } = await supabase.from('user_collection').delete().eq('id', collectionId).eq('user_id', userId)
      if (delErr) throw new Error(delErr.message)
      return { error: null }
    } catch (err) {
      if (snapshotForRollback) restoreLocally(snapshotForRollback)
      return { error: err.message || 'Erreur' }
    }
  }, [userId, restoreLocally])

  return { collection, stats, loading, error, addCard, addExistingCard, updateCard, removeCard, removeLocally, restoreLocally, commitRemove, refresh: fetchCollection }
}
