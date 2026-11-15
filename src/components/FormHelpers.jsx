import { useNavigate } from 'react-router-dom'
import '../forms.css'

export function FieldError({ id, message }) {
  if (!message) return null
  return <small id={id} className="field-error">{message}</small>
}

// Props for an input that marks it invalid and links it to its error text
export function invalidProps(errors, name, prefix) {
  return errors[name]
    ? { 'aria-invalid': true, 'aria-describedby': `${prefix}-${name}-error` }
    : {}
}

export function ErrorSummary({ errors }) {
  const messages = Object.values(errors).filter(Boolean)
  if (!messages.length) return null
  return (
    <div className="form-error-summary" role="alert">
      <strong>Please fix {messages.length} {messages.length === 1 ? 'problem' : 'problems'} below:</strong>
      <ul>{messages.map(message => <li key={message}>{message}</li>)}</ul>
    </div>
  )
}

export function BackToMainButton({ dirty = false, className = 'back-to-main-btn', label = '← Back to Main Site' }) {
  const navigate = useNavigate()
  function goHome() {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    navigate('/')
  }
  return <button type="button" className={className} onClick={goHome}>{label}</button>
}
