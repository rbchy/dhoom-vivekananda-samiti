// Shown for a moment while a page or form is being downloaded (see the lazy imports in main.jsx)
export default function PageLoading({ inline = false }) {
  return <div className={inline ? 'page-loading inline' : 'page-loading'} role="status" aria-live="polite">
    <span className="page-loading-dot" /><span className="page-loading-dot" /><span className="page-loading-dot" />
    <span className="sr-only">Loading… / লোড হচ্ছে…</span>
  </div>
}
