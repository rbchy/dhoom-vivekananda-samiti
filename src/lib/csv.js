// Download rows as a CSV file (opens in Excel). Adds a BOM so Bangla text shows correctly.
export function downloadCsv(filename, columns, rows) {
  const escape = value => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map(c => escape(c.label)).join(',')]
  rows.forEach(row => lines.push(columns.map(c => escape(typeof c.value === 'function' ? c.value(row) : row[c.value])).join(',')))
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
