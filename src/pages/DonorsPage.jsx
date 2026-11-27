import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, CalendarDays, Gift, HandHeart, MapPin } from 'lucide-react'
import SubPageShell, { pickText, useSubPage, samitiPhotoHero } from '../components/SubPageShell'
import { localDigits } from '../components/StambhaPillar'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/money'
import { initials } from '../lib/smriti'
import '../visits.css'
import '../honours.css'

function formatDate(value, locale) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

// Public page: the Samiti's honoured donors (/donors). Reads the public view, which already
// leaves out donors who did not agree, and the amount or address the admin chose to hide.
export default function DonorsPage() {
  const page = useSubPage('dn_title')
  const { language, t, locale } = page
  const [donors, setDonors] = useState(undefined)

  useEffect(() => {
    supabase.from('donor_honours_public').select('*').order('sort_order').order('amount', { ascending: false, nullsFirst: false }).order('donated_on')
      .then(({ data }) => setDonors(data || []))
  }, [])

  const [first, ...rest] = donors || []

  return <SubPageShell page={page} className="dn-page">
    <section className="hv-hero hv-hero-photo dn-hero" style={samitiPhotoHero('linear-gradient(160deg,rgba(60,30,8,.86) 0%,rgba(90,40,20,.62) 50%,rgba(122,36,48,.80) 100%)')}>
      <div className="hv-hero-text">
        <span className="hv-kicker">{t('dn_kicker')}</span>
        <h1>{t('dn_title')}</h1>
        <p>{t('dn_intro')}</p>
        {donors?.length > 0 && <p className="dn-count"><HandHeart size={18} /> {localDigits(donors.length, locale)} {t('dn_total')}</p>}
      </div>
    </section>

    <main className="dn-main">
      {donors === undefined && <p className="hv-empty">{t('hv_loading')}</p>}
      {donors?.length === 0 && <p className="hv-empty">{t('dn_empty')}</p>}
      {first && <DonorCard donor={first} rank={1} featured language={language} locale={locale} t={t} />}
      {rest.length > 0 && <ol className="dn-grid">{rest.map((donor, i) => <li key={donor.id}><DonorCard donor={donor} rank={i + 2} language={language} locale={locale} t={t} /></li>)}</ol>}
      <div className="dn-cta"><Link to="/#donate" className="bd-add-btn"><HandHeart size={18} /> {t('dn_cta')}</Link></div>
    </main>
  </SubPageShell>
}

function DonorCard({ donor, rank, featured = false, language, locale, t }) {
  const name = pickText(donor, 'name', language)
  const address = pickText(donor, 'address', language)
  const gift = pickText(donor, 'gift', language)
  const purpose = pickText(donor, 'purpose', language)
  return <article className={featured ? 'dn-card dn-featured' : 'dn-card'} id={`donor-${donor.id}`}>
    {featured && <span className="dn-ribbon"><Award size={16} /> {t('dn_top')}</span>}
    <div className="dn-photo">{donor.photo_url ? <img src={donor.photo_url} alt={name} loading="lazy" /> : <span aria-hidden="true">{initials(name)}</span>}</div>
    <div className="dn-body">
      <p className="dn-rank">{localDigits(rank, locale)}</p>
      <h2>{name}</h2>
      {language !== 'bn' && donor.name_bn && <p className="hv-name-bn" lang="bn">{donor.name_bn}</p>}
      {address && <p className="dn-line"><MapPin size={15} /> {address}</p>}
      <dl className="dn-facts">
        {donor.amount != null && <div><dt>{t('dn_amount')}</dt><dd className="dn-amount">{localDigits(formatMoney(donor.amount, donor.currency, locale), locale)}</dd></div>}
        {gift && <div><dt>{t('dn_gift')}</dt><dd><Gift size={15} /> {gift}</dd></div>}
        {donor.donated_on && <div><dt>{t('dn_date')}</dt><dd><CalendarDays size={15} /> {formatDate(donor.donated_on, locale)}</dd></div>}
      </dl>
      {purpose && <p className="dn-purpose"><strong>{t('dn_purpose')}:</strong> {purpose}</p>}
      {donor.in_memory_of && <p className="dn-memory">{t('dn_memory')}: {donor.in_memory_of}</p>}
    </div>
  </article>
}
