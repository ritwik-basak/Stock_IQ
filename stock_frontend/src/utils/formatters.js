export const formatNumber = (val) => {
  if (val === null || val === undefined || val === 'N/A') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return val
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9)  return `${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6)  return `${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3)  return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

export const formatPercent = (val) => {
  if (val === null || val === undefined || val === 'N/A') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return val
  // yfinance returns decimals like 0.25 for 25%
  const pct = Math.abs(n) <= 1 ? n * 100 : n
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

export const formatPrice = (val, currency = '') => {
  if (val === null || val === undefined || val === 'N/A') return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return val
  return `${currency}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const isPositive = (val) => {
  if (val === null || val === undefined || val === 'N/A') return null
  return parseFloat(val) >= 0
}

export const changeClass = (val) => {
  const pos = isPositive(val)
  if (pos === null) return 'data-neutral'
  return pos ? 'data-positive' : 'data-negative'
}

export const changeSign = (val) => {
  if (val === null || val === undefined || val === 'N/A') return ''
  return parseFloat(val) >= 0 ? '▲' : '▼'
}
