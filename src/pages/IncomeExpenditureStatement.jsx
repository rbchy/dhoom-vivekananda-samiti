import { useMemo } from 'react'
import { formatMoney } from '../lib/money'
import { downloadCsv } from '../lib/csv'
import { todayISO } from '../lib/validation'
import { receiptUrl } from '../lib/receipts'

// Line name in the statement for one ledger row
function lineName(row) {
  if (row.source === 'Donation (office)') return 'Donations received at office — অফিসে প্রাপ্ত দান'
  if (row.source === 'Donation (online)') return 'Donations received online — অনলাইনে প্রাপ্ত দান'
  if (row.source === 'Monthly subscription') return 'Monthly subscriptions — মাসিক চাঁদা'
  return row.category
}

function prettyDate(iso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`))
}

export default function IncomeExpenditureStatement({ rows, start, end, templeName = 'Dhoom Vivekananda Samiti' }) {
  const toDate = end > todayISO() ? todayISO() : end
  const periodText = start === '2000-01-01' ? `up to ${prettyDate(toDate)}` : `for the period ${prettyDate(start)} to ${prettyDate(toDate)}`

  const statements = useMemo(() => {
    const currencies = [...new Set(rows.map(r => r.currency))].sort()
    return currencies.map(currency => {
      const group = type => {
        const map = new Map()
        const receipts = new Map()
        rows.filter(r => r.currency === currency && r.type === type).forEach(r => {
          const name = lineName(r)
          map.set(name, (map.get(name) || 0) + Number(r.amount))
          if (r.receiptType) receipts.set(name, (receipts.get(name) || 0) + 1)
        })
        return [...map.entries()].map(([name, amount]) => ({ name, amount, receipts: receipts.get(name) || 0 })).sort((a, b) => b.amount - a.amount)
      }
      const income = group('income')
      const expense = group('expense')
      const totalIncome = income.reduce((s, l) => s + l.amount, 0)
      const totalExpense = expense.reduce((s, l) => s + l.amount, 0)
      return { currency, income, expense, totalIncome, totalExpense, result: totalIncome - totalExpense }
    })
  }, [rows])

  function exportCsv() {
    const lines = []
    statements.forEach(s => {
      s.income.forEach(l => lines.push({ currency: s.currency, side: 'Income', head: l.name, amount: l.amount.toFixed(2) }))
      lines.push({ currency: s.currency, side: 'Income', head: 'TOTAL INCOME', amount: s.totalIncome.toFixed(2) })
      s.expense.forEach(l => lines.push({ currency: s.currency, side: 'Expenditure', head: l.name, amount: l.amount.toFixed(2) }))
      lines.push({ currency: s.currency, side: 'Expenditure', head: 'TOTAL EXPENDITURE', amount: s.totalExpense.toFixed(2) })
      lines.push({ currency: s.currency, side: s.result >= 0 ? 'Surplus' : 'Deficit', head: s.result >= 0 ? 'Excess of income over expenditure' : 'Excess of expenditure over income', amount: Math.abs(s.result).toFixed(2) })
    })
    downloadCsv(`income-expenditure-statement-${start}-to-${toDate}.csv`, [
      { label: 'Currency', value: 'currency' }, { label: 'Side', value: 'side' }, { label: 'Head', value: 'head' }, { label: 'Amount', value: 'amount' }
    ], lines)
  }

  // Every earning with its receipt, as the annex to the statement (audit trail: each income line ↔ its receipts)
  const register = useMemo(() => rows.filter(r => r.type === 'income').sort((a, b) => a.date.localeCompare(b.date) || String(a.number).localeCompare(String(b.number))), [rows])

  function exportRegister() {
    downloadCsv(`receipt-register-${start}-to-${toDate}.csv`, [
      { label: 'Date', value: 'date' }, { label: 'Receipt No', value: 'number' }, { label: 'Received From', value: 'party' },
      { label: 'Head', value: r => lineName(r) }, { label: 'Description', value: 'description' }, { label: 'Currency', value: 'currency' }, { label: 'Amount', value: r => Number(r.amount).toFixed(2) }
    ], register)
  }

  return <div>
    <div className="form-actions no-print">
      <button type="button" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
      <button type="button" onClick={exportCsv} disabled={!statements.length}>Download CSV</button>
      <button type="button" onClick={exportRegister} disabled={!register.length}>Receipt register CSV / রসিদ খাতা</button>
    </div>
    <div className="print-area statement">
      <header className="statement-header">
        <h2>{templeName}</h2>
        <p>A religious, non-profit humanitarian organisation</p>
        <h3>Income &amp; Expenditure Account / আয়-ব্যয় হিসাব</h3>
        <p>{periodText}</p>
      </header>
      {statements.length === 0 ? <p className="field-hint">No income or expenditure in this period.</p> : statements.map(s => {
        const surplus = s.result >= 0
        const leftRows = [...s.expense, ...(surplus && s.result > 0 ? [{ name: 'Excess of income over expenditure (Surplus) — উদ্বৃত্ত', amount: s.result, balancing: true }] : [])]
        const rightRows = [...s.income, ...(!surplus ? [{ name: 'Excess of expenditure over income (Deficit) — ঘাটতি', amount: -s.result, balancing: true }] : [])]
        const total = Math.max(s.totalIncome, s.totalExpense)
        const count = Math.max(leftRows.length, rightRows.length)
        return <section className="statement-block" key={s.currency}>
          <h4>Currency: {s.currency === 'BDT' ? 'Bangladeshi Taka (৳)' : 'US Dollar ($)'}</h4>
          <table className="statement-table">
            <thead><tr><th>Expenditure / ব্যয়</th><th className="num">Amount</th><th>Income / আয়</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {Array.from({ length: count }).map((_, i) => <tr key={i}>
                <td className={leftRows[i]?.balancing ? 'balancing' : ''}>{leftRows[i]?.name || ''}</td>
                <td className={`num ${leftRows[i]?.balancing ? 'balancing' : ''}`}>{leftRows[i] ? formatMoney(leftRows[i].amount, s.currency) : ''}</td>
                <td className={rightRows[i]?.balancing ? 'balancing' : ''}>{rightRows[i]?.name || ''}{rightRows[i]?.receipts > 0 && <small className="cell-sub">{rightRows[i].receipts} receipt{rightRows[i].receipts > 1 ? 's' : ''} / রসিদ</small>}</td>
                <td className={`num ${rightRows[i]?.balancing ? 'balancing' : ''}`}>{rightRows[i] ? formatMoney(rightRows[i].amount, s.currency) : ''}</td>
              </tr>)}
            </tbody>
            <tfoot><tr><th>Total</th><th className="num">{formatMoney(total, s.currency)}</th><th>Total</th><th className="num">{formatMoney(total, s.currency)}</th></tr></tfoot>
          </table>
          <p className="statement-summary">Total income {formatMoney(s.totalIncome, s.currency)} · Total expenditure {formatMoney(s.totalExpense, s.currency)} · <b>{surplus ? 'Surplus' : 'Deficit'} {formatMoney(Math.abs(s.result), s.currency)}</b></p>
        </section>
      })}
      {register.length > 0 && <section className="statement-block statement-register">
        <h4>Annexure — Receipt register / রসিদ খাতা ({register.length})</h4>
        <table className="statement-table">
          <thead><tr><th>Date</th><th>Receipt No.</th><th>Received from</th><th>Head</th><th className="num">Amount</th></tr></thead>
          <tbody>{register.map(r => <tr key={r.key}>
            <td>{r.date}</td>
            <td>{r.receiptType ? <a href={receiptUrl(r.receiptType, r.receiptId)} target="_blank" rel="noopener">{r.number}</a> : r.number || '—'}</td>
            <td>{r.party || '—'}</td>
            <td>{lineName(r)}</td>
            <td className="num">{formatMoney(r.amount, r.currency)}</td>
          </tr>)}</tbody>
        </table>
      </section>}
      <div className="statement-signatures">
        <div><span />Prepared by</div><div><span />Treasurer / কোষাধ্যক্ষ</div><div><span />President / সভাপতি</div>
      </div>
      <p className="statement-printed">Printed on {prettyDate(todayISO())}</p>
    </div>
  </div>
}
