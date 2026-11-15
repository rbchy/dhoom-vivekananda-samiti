import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGUAGES, getLanguage } from '../i18n'

export default function LanguageSwitcher({ language, onChange, label }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const current = getLanguage(language)

  useEffect(() => {
    if (!open) return
    function handleOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="lang-switcher" ref={wrapperRef}>
      <button
        type="button"
        className="lang-button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.native}`}
        title={label}
      >
        <Globe size={18} />
        <span className="lang-short">{current.short}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={label}>
          {LANGUAGES.map(item => (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={item.code === language}
                className={item.code === language ? 'lang-option active' : 'lang-option'}
                lang={item.code}
                dir={item.rtl ? 'rtl' : 'ltr'}
                onClick={() => { onChange(item.code); setOpen(false) }}
              >
                <span className="lang-native">{item.native}</span>
                <span className="lang-english">{item.english}</span>
                {item.code === language && <Check size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
