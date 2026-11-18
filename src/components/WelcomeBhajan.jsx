import { useEffect, useRef, useState } from 'react'
import { Music2, Pause, Play } from 'lucide-react'

// Starts the welcome bhajan when the home page opens. Browsers block sound until the visitor
// touches the page, so if the first try is blocked it starts on the first tap or key press.
// It plays once, fades in softly, and stays off for the rest of the visit once paused.
const STOPPED_KEY = 'dvs-bhajan-stopped'
const readStopped = () => { try { return sessionStorage.getItem(STOPPED_KEY) === '1' } catch { return false } }
const saveStopped = value => { try { value ? sessionStorage.setItem(STOPPED_KEY, '1') : sessionStorage.removeItem(STOPPED_KEY) } catch { /* private mode */ } }

export default function WelcomeBhajan({ url, title, t }) {
  const audioRef = useRef(null)
  const fadeRef = useRef(null)
  const [state, setState] = useState('idle') // idle | waiting | playing | paused | ended

  function fadeIn(audio) {
    clearInterval(fadeRef.current)
    audio.volume = 0
    fadeRef.current = setInterval(() => {
      audio.volume = Math.min(0.45, audio.volume + 0.03)
      if (audio.volume >= 0.45) clearInterval(fadeRef.current)
    }, 200)
  }

  async function start() {
    const audio = audioRef.current
    if (!audio) return false
    try {
      await audio.play()
      fadeIn(audio)
      setState('playing')
      saveStopped(false)
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!url || readStopped()) { setState('paused'); return undefined }
    let waiting = false
    const onFirstTouch = event => {
      if (event.target.closest?.('.welcome-bhajan')) return // the button handles itself
      cleanup()
      start()
    }
    const cleanup = () => { if (!waiting) return; waiting = false; ['pointerdown', 'keydown', 'touchstart'].forEach(name => window.removeEventListener(name, onFirstTouch)) }
    start().then(ok => {
      if (ok) return
      waiting = true
      setState('waiting')
      ;['pointerdown', 'keydown', 'touchstart'].forEach(name => window.addEventListener(name, onFirstTouch, { passive: true }))
    })
    return () => { cleanup(); clearInterval(fadeRef.current) }
  }, [url])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (state === 'playing') { audio.pause(); clearInterval(fadeRef.current); setState('paused'); saveStopped(true) }
    else { if (state === 'ended') audio.currentTime = 0; start() }
  }

  if (!url) return null
  const playing = state === 'playing'
  return <div className={`welcome-bhajan ${state}`}>
    <audio ref={audioRef} src={url} preload="auto" onEnded={() => setState('ended')} />
    <button type="button" onClick={toggle} aria-label={playing ? t('bhajan_pause') : t('bhajan_play')} title={playing ? t('bhajan_pause') : t('bhajan_play')}>
      <span className="welcome-bhajan-icon">{playing ? <Pause size={16} /> : <Play size={16} />}</span>
      <span className="welcome-bhajan-text">
        <small><Music2 size={12} /> {t('bhajan_label')}</small>
        <strong>{state === 'waiting' ? t('bhajan_tap') : title || t('bhajan_label')}</strong>
      </span>
      {playing && <span className="welcome-bhajan-bars" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  </div>
}
