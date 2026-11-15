import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, closeLabel = 'Close', children }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const firstField = dialogRef.current?.querySelector('input, select, textarea, button:not(.modal-close)')
    firstField?.focus()
    function handleKey(event) { if (event.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialogRef}>
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={closeLabel}><X size={22} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
