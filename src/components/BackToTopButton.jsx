import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import './back-to-top.css'

// Round button at the bottom-right that appears after scrolling down and takes the visitor back to the top
export default function BackToTopButton({ label, targetId, showAfter = 500 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function check() { setVisible(window.scrollY > showAfter) }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [showAfter])

  function goUp() {
    const target = targetId && document.getElementById(targetId)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
    if (targetId && window.location.hash) history.replaceState(null, '', window.location.pathname)
  }

  if (!visible) return null
  return <button type="button" className="back-to-top" onClick={goUp} aria-label={label} title={label}><ArrowUp size={20} strokeWidth={2.2} /><span>{label}</span></button>
}
