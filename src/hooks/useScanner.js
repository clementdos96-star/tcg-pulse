// src/hooks/useScanner.js — V3
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../services/supabase'

const SCAN_INTERVAL_MS = 2500
const CROP = { x: 0.05, y: 0.55, w: 0.9, h: 0.4 }

export function useScanner({ enabled = true, onMatch = null } = {}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const workerRef = useRef(null)
  const intervalRef = useRef(null)
  const lastSentRef = useRef('')
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [debug, setDebug] = useState({ ocr: '', matches: 0 })

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) return
    const v = videoRef.current
    const cv = canvasRef.current
    if (v.readyState !== 4 || busy) return
    setBusy(true)
    try {
      const cw = Math.round(v.videoWidth * CROP.w)
      const ch = Math.round(v.videoHeight * CROP.h)
      const cx = Math.round(v.videoWidth * CROP.x)
      const cy = Math.round(v.videoHeight * CROP.y)
      cv.width = cw; cv.height = ch
      const ctx = cv.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(v, cx, cy, cw, ch, 0, 0, cw, ch)
      const img = ctx.getImageData(0, 0, cw, ch)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
        const a = g > 128 ? 255 : 0
        d[i] = d[i + 1] = d[i + 2] = a
      }
      ctx.putImageData(img, 0, 0)
      const { data: { text } } = await workerRef.current.recognize(cv)
      const cleaned = text.replace(/\s+/g, ' ').trim()
      if (!cleaned || cleaned === lastSentRef.current) {
        setBusy(false)
        return
      }
      lastSentRef.current = cleaned
      const { data: matches } = await supabase.rpc('scan_match_cards', { ocr_text: cleaned, limit_results: 5 })
      setDebug({ ocr: cleaned.slice(0, 60), matches: matches?.length || 0 })
      if (matches && matches.length > 0) {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(40)
        onMatch?.(matches)
      }
    } catch (e) {
      console.warn('scan err:', e.message)
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
        const Tesseract = await import('tesseract.js')
        if (!mounted) return
        const worker = await Tesseract.createWorker('eng', 1)
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: '7',
        })
        if (!mounted) { await worker.terminate(); return }
        workerRef.current = worker
        setReady(true)
        intervalRef.current = setInterval(scanFrame, SCAN_INTERVAL_MS)
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
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (workerRef.current) workerRef.current.terminate().catch(() => {})
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [enabled, scanFrame])

  return { videoRef, canvasRef, ready, busy, error, debug }
}
