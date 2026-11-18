// A memorial pillar (smriti stambha) with a lit lamp on top, drawn in SVG.
// `label` is engraved on the shaft; `compact` hides the engraving for small sizes.
export default function StambhaPillar({ label = '', compact = false, className = '' }) {
  return (
    <svg className={`stambha-pillar ${className}`} viewBox="0 0 200 460" role="img" aria-label={label || 'Smriti Stambha'}>
      <defs>
        <linearGradient id="stambha-marble" x1="0" x2="1">
          <stop offset="0" stopColor="#d9cdb8" />
          <stop offset=".35" stopColor="#fbf6ec" />
          <stop offset=".65" stopColor="#f3ebdc" />
          <stop offset="1" stopColor="#c9bba2" />
        </linearGradient>
        <linearGradient id="stambha-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#a8742a" />
          <stop offset=".5" stopColor="#f2c86b" />
          <stop offset="1" stopColor="#a8742a" />
        </linearGradient>
        <radialGradient id="stambha-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="stambha-flame" cx=".5" cy=".7" r=".6">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset=".45" stopColor="#ffc34d" />
          <stop offset="1" stopColor="#e2601d" />
        </radialGradient>
      </defs>

      {/* glow and flame */}
      <circle className="stambha-glow" cx="100" cy="44" r="46" fill="url(#stambha-glow)" />
      <path className="stambha-flame" d="M100 14 C110 30 112 40 100 54 C88 40 90 30 100 14 Z" fill="url(#stambha-flame)" />
      {/* lamp (diya) */}
      <path d="M72 56 Q100 76 128 56 Q124 70 100 72 Q76 70 72 56 Z" fill="url(#stambha-gold)" />
      <rect x="94" y="72" width="12" height="8" fill="#a8742a" />

      {/* capital: lotus and abacus */}
      <path d="M58 98 Q70 80 84 92 Q92 78 100 90 Q108 78 116 92 Q130 80 142 98 Z" fill="url(#stambha-gold)" />
      <rect x="52" y="96" width="96" height="12" rx="2" fill="url(#stambha-marble)" stroke="#b9a684" />
      <rect x="60" y="108" width="80" height="8" fill="url(#stambha-gold)" />

      {/* shaft */}
      <path d="M66 116 L134 116 L128 380 L72 380 Z" fill="url(#stambha-marble)" stroke="#b9a684" />
      <rect x="68" y="134" width="64" height="4" fill="url(#stambha-gold)" opacity=".85" />
      <rect x="71" y="356" width="58" height="4" fill="url(#stambha-gold)" opacity=".85" />
      {/* engraved panel */}
      <rect x="80" y="150" width="40" height="196" rx="3" fill="none" stroke="#b9a684" strokeDasharray="2 3" />
      {!compact && label && (
        <text x="100" y="248" textAnchor="middle" dominantBaseline="middle" transform="rotate(-90 100 248)"
          className="stambha-engraving" fill="#7a5a1e">{label}</text>
      )}

      {/* base steps */}
      <rect x="56" y="380" width="88" height="16" fill="url(#stambha-marble)" stroke="#b9a684" />
      <rect x="40" y="396" width="120" height="18" fill="url(#stambha-marble)" stroke="#b9a684" />
      <rect x="40" y="402" width="120" height="3" fill="url(#stambha-gold)" opacity=".8" />
      <rect x="22" y="414" width="156" height="22" fill="url(#stambha-marble)" stroke="#b9a684" />
      {/* flowers at the foot */}
      {[34, 52, 148, 166].map(x => <g key={x}><circle cx={x} cy="442" r="7" fill="#f2a52a" /><circle cx={x} cy="442" r="3" fill="#c96a26" /></g>)}
      <rect x="10" y="446" width="180" height="6" rx="3" fill="#000" opacity=".12" />
    </svg>
  )
}
