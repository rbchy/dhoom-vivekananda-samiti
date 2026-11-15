import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import './photo-slideshow.css'

const SLIDE_MS = 7000 // each photo stays about 7 seconds (slow, calm "video")

// Slow photo film made from the published gallery photos:
// each photo gently zooms (Ken Burns effect) and fades into the next one.
export default function PhotoSlideshow({ photos, t, getTitle, getOrg }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [hovered, setHovered] = useState(false)
  const reduceMotion = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const count = photos.length

  useEffect(() => { if (index >= count) setIndex(0) }, [count, index])

  useEffect(() => {
    if (!playing || hovered || count < 2) return
    const timer = setTimeout(() => setIndex(i => (i + 1) % count), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index, playing, hovered, count])

  // Load the next photo early so the change is smooth
  useEffect(() => {
    if (count < 2) return
    const next = new Image()
    next.src = photos[(index + 1) % count].image_url
  }, [index, count, photos])

  if (!count) return null
  const go = step => setIndex(i => (i + step + count) % count)

  return <section className="slideshow-section" aria-label={t('slides_title')}>
    <span className="section-eyebrow">{t('slides_eyebrow')}</span>
    <h2>{t('slides_title')}</h2>
    <div className="slideshow" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {photos.map((photo, i) => {
        const visible = i === index
        // only the current, previous and next photos are kept on the page
        const near = visible || i === (index + 1) % count || i === (index - 1 + count) % count
        if (!near) return null
        return <figure key={photo.id} className={`slide${visible ? ' active' : ''}${i % 2 ? ' zoom-left' : ' zoom-right'}${reduceMotion.current ? ' still' : ''}`} aria-hidden={!visible}>
          <img src={photo.image_url} alt="" style={{ animationDuration: `${SLIDE_MS + 1500}ms` }} />
          <div className="slide-backdrop" style={{ backgroundImage: `url("${photo.image_url}")` }} />
        </figure>
      })}
      <div className="slide-caption" aria-live="polite">
        <strong>{getTitle(photos[index])}</strong>
        {getOrg(photos[index]) && <span>{getOrg(photos[index])}</span>}
      </div>
      {count > 1 && <>
        <button type="button" className="slide-nav prev" onClick={() => go(-1)} aria-label={t('slides_prev')}><ChevronLeft size={26} /></button>
        <button type="button" className="slide-nav next" onClick={() => go(1)} aria-label={t('slides_next')}><ChevronRight size={26} /></button>
        <button type="button" className="slide-play" onClick={() => setPlaying(p => !p)} aria-label={playing ? t('slides_pause') : t('slides_play')}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <div className="slide-progress"><span key={`${index}-${playing && !hovered}`} className={playing && !hovered ? 'run' : ''} style={{ animationDuration: `${SLIDE_MS}ms` }} /></div>
      </>}
    </div>
    {count > 1 && <div className="slide-dots" role="group" aria-label={t('slides_title')}>{photos.map((photo, i) => <button type="button" key={photo.id} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`${i + 1} / ${count}`} aria-current={i === index} />)}</div>}
  </section>
}
