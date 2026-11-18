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

// Bangla (and other) digits for the serial number and years when the language uses them
export function localDigits(text, locale) {
  if (!/^(bn|hi|ar)/.test(locale)) return String(text)
  const digits = Array.from(new Intl.NumberFormat(locale, { useGrouping: false }).format(1234567890))
  let out = String(text)
  if (locale.startsWith('bn')) out = out.replace(/\bpresent\b/i, 'বর্তমান')
  if (digits.length !== 10) return out
  return out.replace(/[0-9]/g, d => digits[(Number(d) + 9) % 10])
}

// A large memorial pillar with the names, serial numbers and years engraved on the stone.
// people: [{ id, name, years, is_late }]
export function StambhaMonument({ title, dedication, people = [], locale = 'en', lateLabel = '' }) {
  return (
    <figure className="stambha-monument" aria-label={title}>
      <svg className="stambha-top" viewBox="0 0 400 190" aria-hidden="true">
        <defs>
          <linearGradient id="mon-gold" x1="0" x2="1"><stop offset="0" stopColor="#a8742a" /><stop offset=".5" stopColor="#f2c86b" /><stop offset="1" stopColor="#a8742a" /></linearGradient>
          <linearGradient id="mon-marble" x1="0" x2="1"><stop offset="0" stopColor="#d9cdb8" /><stop offset=".35" stopColor="#fbf6ec" /><stop offset=".65" stopColor="#f3ebdc" /><stop offset="1" stopColor="#c9bba2" /></linearGradient>
          <radialGradient id="mon-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffd98a" stopOpacity=".95" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
          <radialGradient id="mon-flame" cx=".5" cy=".7" r=".6"><stop offset="0" stopColor="#fff6c8" /><stop offset=".45" stopColor="#ffc34d" /><stop offset="1" stopColor="#e2601d" /></radialGradient>
        </defs>
        <circle className="stambha-glow" cx="200" cy="52" r="58" fill="url(#mon-glow)" />
        <path className="stambha-flame mon-flame" d="M200 14 C214 34 216 48 200 66 C184 48 186 34 200 14 Z" fill="url(#mon-flame)" />
        <path d="M160 70 Q200 98 240 70 Q234 88 200 91 Q166 88 160 70 Z" fill="url(#mon-gold)" />
        <rect x="192" y="90" width="16" height="10" fill="#a8742a" />
        <path d="M70 136 Q92 104 118 124 Q132 100 150 120 Q166 96 184 118 Q200 92 216 118 Q234 96 250 120 Q268 100 282 124 Q308 104 330 136 Z" fill="url(#mon-gold)" />
        <rect x="52" y="134" width="296" height="22" rx="3" fill="url(#mon-marble)" stroke="#b9a684" />
        <rect x="70" y="156" width="260" height="12" fill="url(#mon-gold)" />
        <rect x="80" y="168" width="240" height="22" fill="url(#mon-marble)" stroke="#b9a684" />
      </svg>
      <div className="stambha-shaft">
        <div className="stambha-panel">
          <p className="stambha-title">{title}</p>
          {dedication && <p className="stambha-dedication">{dedication}</p>}
          <span className="stambha-rule" aria-hidden="true" />
          <ol className="stambha-names">{people.map((person, index) => <li key={person.id}>
            <span className="stambha-sl">{localDigits(index + 1, locale)}.</span>
            <span className="stambha-name">{person.name}{person.is_late && <abbr className="stambha-late" title={lateLabel} aria-label={lateLabel}>🪔</abbr>}</span>
            {person.years && <span className="stambha-years">{localDigits(person.years, locale)}</span>}
          </li>)}</ol>
          <span className="stambha-rule" aria-hidden="true" />
          <p className="stambha-om" aria-hidden="true">ॐ</p>
        </div>
      </div>
      <svg className="stambha-base" viewBox="0 0 400 110" aria-hidden="true">
        <rect x="70" y="0" width="260" height="22" fill="url(#mon-marble)" stroke="#b9a684" />
        <rect x="40" y="22" width="320" height="26" fill="url(#mon-marble)" stroke="#b9a684" />
        <rect x="40" y="31" width="320" height="4" fill="url(#mon-gold)" opacity=".85" />
        <rect x="10" y="48" width="380" height="32" fill="url(#mon-marble)" stroke="#b9a684" />
        {[30, 58, 86, 314, 342, 370].map(x => <g key={x}><circle cx={x} cy="88" r="11" fill="#f2a52a" /><circle cx={x} cy="88" r="4.5" fill="#c96a26" /></g>)}
        <ellipse cx="200" cy="102" rx="196" ry="6" fill="#000" opacity=".18" />
      </svg>
    </figure>
  )
}
