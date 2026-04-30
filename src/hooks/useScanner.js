// useScanner V4 — Claude Vision API au lieu de Tesseract
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

export function useScanner({ enabled = true, onMatch = null } = {}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [debug, setDebug] = useState({ vision: null })

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || busy) return null
    const v = videoRef.current
    const cv = canvasRef.current
    if (v.readyState !== 4) return null
    setBusy(true)
    try {
      cv.width = v.videoWidth
      cv.height = v.videoHeight
      const ctx = cv.getContext('2d')
      ctx.drawImage(v, 0, 0, cv.width, cv.height)
      const dataUrl = cv.toDataURL('image/jpeg', 0.85)
      const url = `${supabase.supabaseUrl}/functions/v1/scan-card-vision`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: dataUrl, media_type: 'image/jpeg' }),
      })
      const data = await res.json()
      setDebug({ vision: data.vision })
      if (data.matches?.length > 0) {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
        onMatch?.(data.matches)
      }
      return data.matches || []
    } catch (e) {
      console.warn('vision err:', e.message)
      return []
    } finally {
      setBusy(false)
    }
  }, [busy, onMatch])

  useEffect(() => {
    if (!enabled) return
    let stream = null
    let mounted = true
    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra non supportée')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch (e) {
        if (!mounted) return
        if (e.name === 'NotAllowedError') setError('Permission caméra refusée')
        else if (e.name === 'NotFoundError') setError('Aucune caméra détectée')
        else setError(e.message || 'Erreur init caméra')
      }
    }
    init()
    return () => {
      mounted = false
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [enabled])

  return { videoRef, canvasRef, ready, busy, error, debug, capture }
}
