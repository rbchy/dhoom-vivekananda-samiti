import { useEffect, useRef, useState } from 'react'
import { translate } from '../i18n'
import './hero-slides.css'

// The three slides of the home-page banner: Thakur (the original banner), Ma and Swamiji.
// The pictures carry no text: the saying is written over the picture in English,
// and other languages show it in the caption under the banner.
export const HERO_SLIDES = [
  { id: 'ramakrishna', image: '/hero-banner-belur.webp', q1: 'quote_1', q2: 'quote_2', by: 'quote_by', name: 'hero_name_ramakrishna' },
  { id: 'sarada', image: '/hero-banner-sarada.webp', q1: 'hero_sarada_1', q2: 'hero_sarada_2', by: 'hero_sarada_by', name: 'hero_name_sarada' },
  { id: 'vivekananda', image: '/hero-banner-vivekananda.webp', q1: 'hero_swamiji_1', q2: 'hero_swamiji_2', by: 'hero_swamiji_by', name: 'hero_name_vivekananda' }
]
const SHOW_MS = 7000

// The sayings (Niti Bakya) of Thakur, Ma and Swamiji. Each time a picture comes back, it shows the next saying.
// The first saying of each uses the i18n keys of HERO_SLIDES, so it is translated into every language;
// the others are in English and Bangla (other languages show no caption for them).
export const HERO_QUOTES = {
  ramakrishna: [
    null,
    { en: ['“Not pity for living beings,', 'but service to them as Shiva.”'], bn: ['“জীবে দয়া নয়,', 'শিবজ্ঞানে জীবসেবা।”'] },
    { en: ['“The goal of human life', 'is to realise God.”'], bn: ['“ঈশ্বরলাভই', 'মানবজীবনের উদ্দেশ্য।”'] },
    { en: ['“Make your mind', 'and your words one.”'], bn: ['“মন মুখ', 'এক করো।”'] }
  ],
  sarada: [
    null,
    { en: ['“If you want peace,', 'do not find fault with others.”'], bn: ['“যদি শান্তি চাও, মা,', 'কারও দোষ দেখো না।”'] },
    { en: ['“I am the mother of the good,', 'and the mother of the wicked too.”'], bn: ['“আমি সতেরও মা,', 'অসতেরও মা।”'] },
    { en: ['“Learn to make', 'the whole world your own.”'], bn: ['“জগৎকে আপনার', 'করে নিতে শেখো।”'] }
  ],
  vivekananda: [
    null,
    { en: ['“They alone live', 'who live for others.”'], bn: ['“যারা অপরের জন্য বাঁচে,', 'তারাই প্রকৃত বাঁচে।”'] },
    { en: ['“Strength is life;', 'weakness is death.”'], bn: ['“শক্তিই জীবন,', 'দুর্বলতাই মৃত্যু।”'] },
    { en: ['“Each soul is', 'potentially divine.”'], bn: ['“প্রত্যেক আত্মাই', 'অব্যক্ত ব্রহ্ম।”'] },
    { en: ['“He who loves all beings', 'is serving God.”'], bn: ['“জীবে প্রেম করে যেই জন,', 'সেই জন সেবিছে ঈশ্বর।”'] }
  ]
}

// The next visit carries on where this one stopped, so returning visitors read new sayings
const QUOTE_STORE = 'hero-quote-next'
function readNext() {
  try { return JSON.parse(localStorage.getItem(QUOTE_STORE)) || {} } catch { return {} }
}
function saveNext(next) {
  try { localStorage.setItem(QUOTE_STORE, JSON.stringify(next)) } catch { /* storage unavailable */ }
}

// Which saying is showing for the current picture: the first time a picture appears in a visit it keeps the
// saying it started with; every later return moves on to the next one
export function useHeroQuote(index) {
  const [turn, setTurn] = useState(() => readNext())
  const seen = useRef(new Set())
  const id = HERO_SLIDES[index].id
  useEffect(() => {
    if (seen.current.has(id)) setTurn(current => ({ ...current, [id]: (current[id] || 0) + 1 }))
    seen.current.add(id)
  }, [index])
  const list = HERO_QUOTES[id]
  const position = ((turn[id] || 0) % list.length + list.length) % list.length
  useEffect(() => { saveNext({ ...readNext(), [id]: position + 1 }) }, [id, position])
  return { slide: HERO_SLIDES[index], entry: list[position], position }
}

// Text of a saying in one language: [line 1, line 2, author], or null when it has no translation
export function quoteText({ slide, entry }, language) {
  const by = translate(language, slide.by)
  if (!entry) return [translate(language, slide.q1), translate(language, slide.q2), by]
  const lines = entry[language]
  return lines ? [...lines, by] : null
}

// The saying written over the banner picture (always in English, as on the original banners)
export function HeroQuote({ quote }) {
  const text = quoteText(quote, 'en')
  return <div className="hero-quote-area">
    <blockquote className="hero-quote" key={`${quote.slide.id}-${quote.position}`} lang="en">
      <p>{text[0]}<br />{text[1]}</p>
      <span className="hero-quote-by">{text[2]}</span>
    </blockquote>
  </div>
}

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
