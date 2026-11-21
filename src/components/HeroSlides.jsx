import { useEffect, useRef, useState } from 'react'
import './hero-slides.css'

// The three slides of the home-page banner: Thakur (the original banner), Ma and Swamiji.
// Each banner carries its saying in English; other languages show it in the caption under the banner.
export const HERO_SLIDES = [
  { id: 'ramakrishna', image: '/hero-banner-belur.webp', q1: 'quote_1', q2: 'quote_2', by: 'quote_by', name: 'hero_name_ramakrishna' },
  { id: 'sarada', image: '/hero-banner-sarada.webp', q1: 'hero_sarada_1', q2: 'hero_sarada_2', by: 'hero_sarada_by', name: 'hero_name_sarada' },
  { id: 'vivekananda', image: '/hero-banner-vivekananda.webp', q1: 'hero_swamiji_1', q2: 'hero_swamiji_2', by: 'hero_swamiji_by', name: 'hero_name_vivekananda' }
]
const SHOW_MS = 7000
// Once Ma's and Swamiji's pictures are in, they stay ready (also when the page redraws, e.g. on a language change)
let picturesReady = false

export function useHeroSlide() { return useState(0) }

// Cross-fading layers inside the banner. The first banner is the page's own background, so the page
// never waits: Ma's and Swamiji's pictures load only after the page has finished loading.
export default function HeroSlides({ index, setIndex, t }) {
  const [ready, setReady] = useState(picturesReady)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  // Preload the other two pictures once the page is idle; start turning only when they are in
  useEffect(() => {
    if (picturesReady) return
    let cancelled = false
    const load = () => Promise.all(HERO_SLIDES.slice(1).map(slide => new Promise(resolve => {
      const img = new Image(); img.onload = img.onerror = resolve; img.src = base + slide.image
    }))).then(() => { picturesReady = true; if (!cancelled) setReady(true) })
    const start = () => (window.requestIdleCallback ? window.requestIdleCallback(load, { timeout: 2500 }) : setTimeout(load, 1200))
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true })
    return () => { cancelled = true; window.removeEventListener('load', start) }
  }, [])

  useEffect(() => {
    if (!ready || paused || reduceMotion.current) return
    const timer = setInterval(() => { if (!document.hidden) setIndex(i => (i + 1) % HERO_SLIDES.length) }, SHOW_MS)
    return () => clearInterval(timer)
  }, [ready, paused])

  // Pause while the pointer or keyboard focus is on the banner
  useEffect(() => {
    const hero = document.getElementById('home')
    if (!hero) return
    const on = () => setPaused(true), off = () => setPaused(false)
    hero.addEventListener('pointerenter', on); hero.addEventListener('pointerleave', off)
    return () => { hero.removeEventListener('pointerenter', on); hero.removeEventListener('pointerleave', off) }
  }, [])

  if (!ready) return null
  return <>
    <div className="hero-slides" aria-hidden="true">
      {HERO_SLIDES.slice(1).map((slide, i) => <div key={slide.id} className={index === i + 1 ? 'hero-slide active' : 'hero-slide'} style={{ backgroundImage: `url('${base}${slide.image}')` }} />)}
    </div>
    <div className="hero-dots" role="group" aria-label={t('hero_slides_label')}>
      {HERO_SLIDES.map((slide, i) => <button type="button" key={slide.id} className={index === i ? 'active' : ''} aria-label={t(slide.name)} aria-pressed={index === i}
        onClick={() => setIndex(i)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} />)}
    </div>
  </>
}
