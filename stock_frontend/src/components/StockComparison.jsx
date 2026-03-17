import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, X, Search, TrendingUp, Loader2 } from 'lucide-react'
import Plot from 'react-plotly.js'
import { compareStocks, searchStocks } from '../services/api'
import { formatNumber, formatPercent, formatPrice } from '../utils/formatters'

const COLORS = { stock1: '#06B6D4', stock2: '#F59E0B' }

function CompareSearch({ onSelect, placeholder }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const wrapRef  = useRef(null)
  const timerRef = useRef(null)

  const doSearch = async (q) => {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const data = await searchStocks(q)
      setResults(data.results || [])
      // Calculate position relative to viewport for fixed dropdown
      if (wrapRef.current) {
        const rect = wrapRef.current.getBoundingClientRect()
        setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
      }
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(e.target.value), 350)
  }

  const handleSelect = (r) => {
    setQuery(r.symbol); setOpen(false); onSelect(r.symbol)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.2s' }}
        onFocusCapture={e => { e.currentTarget.style.borderColor='rgba(6,182,212,0.5)'; e.currentTarget.style.boxShadow='0 0 16px rgba(6,182,212,0.12)' }}
        onBlurCapture={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow='none' }}>
        <Search style={{ width: 15, height: 15, color: 'rgba(6,182,212,0.7)', flexShrink: 0 }} />
        <input value={query} onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-body)', fontSize: 14, color: '#F0F6FF' }} />
        {loading && <Loader2 style={{ width: 14, height: 14, color: '#06B6D4', animation: 'cspin 0.8s linear infinite', flexShrink: 0 }} />}
      </div>

      {/* Fixed-position dropdown — escapes all overflow containers */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999,
              background: 'rgba(2,6,14,0.99)', border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(6,182,212,0.1)' }}>
            {results.slice(0, 7).map((r, i) => (
              <div key={r.symbol} onMouseDown={() => handleSelect(r)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.symbol}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(180,200,220,0.55)', marginTop: 2 }}>{r.name}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: '#8BA3BE', flexShrink: 0 }}>{r.exchange}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes cspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const LOWER_BETTER = new Set(['Trailing P/E', 'Forward P/E', 'Debt/Equity'])
const NEUTRAL      = new Set(['Beta', 'Dividend Yield', '52W High', '52W Low'])

const MetricRow = ({ label, v1, v2, format = 'number' }) => {
  const fmt = (v) => {
    if (v == null || v === 'N/A') return '—'
    if (format === 'percent') return formatPercent(v)
    return formatNumber(v)
  }
  const n1 = parseFloat(v1), n2 = parseFloat(v2)
  const hasValues  = !isNaN(n1) && !isNaN(n2) && !NEUTRAL.has(label)
  const lowerBetter = LOWER_BETTER.has(label)
  const s1better   = hasValues && (lowerBetter ? n1 < n2 : n1 > n2)
  const s2better   = hasValues && (lowerBetter ? n2 < n1 : n2 > n1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', gap: 8, padding: '10px 0',
      borderBottom: '1px solid rgba(40,65,100,0.3)', alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, textAlign: 'right',
        color: s1better ? COLORS.stock1 : '#F0F6FF', fontWeight: s1better ? 700 : 500 }}>{fmt(v1)}</div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: '#6A8BAA',
        textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, textAlign: 'left',
        color: s2better ? COLORS.stock2 : '#F0F6FF', fontWeight: s2better ? 700 : 500 }}>{fmt(v2)}</div>
    </div>
  )
}

export default function StockComparison({ ticker1 }) {
  const [open, setOpen]       = useState(false)
  const [ticker2, setTicker2] = useState(null)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleCompare = async (t2) => {
    setTicker2(t2); setLoading(true); setError(null)
    try { setData(await compareStocks(ticker1, t2)) }
    catch (e) { setError(e.response?.data?.detail || 'Comparison failed') }
    finally { setLoading(false) }
  }

  const close = () => { setOpen(false); setData(null); setTicker2(null); setError(null) }

  const chartTraces = data ? [
    { type: 'scatter', mode: 'lines', x: data.stock1.dates, y: data.stock1.normalized,
      name: data.stock1.ticker, line: { color: COLORS.stock1, width: 2.5 },
      hovertemplate: `${data.stock1.ticker}: %{y:.2f}%<extra></extra>` },
    { type: 'scatter', mode: 'lines', x: data.stock2.dates, y: data.stock2.normalized,
      name: data.stock2.ticker, line: { color: COLORS.stock2, width: 2.5 },
      hovertemplate: `${data.stock2.ticker}: %{y:.2f}%<extra></extra>` },
  ] : []

  const chartLayout = {
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    font: { family: 'Courier Prime, monospace', size: 12, color: '#B8D0E8' },
    margin: { l: 55, r: 20, t: 20, b: 35 },
    xaxis: { gridcolor: 'rgba(40,65,100,0.5)', zeroline: false, tickfont: { size: 11 } },
    yaxis: { gridcolor: 'rgba(40,65,100,0.5)', zeroline: true, zerolinecolor: 'rgba(255,255,255,0.15)',
      tickfont: { size: 11 }, title: { text: '% Change', font: { size: 11 } } },
    legend: { orientation: 'h', x: 0, y: 1.08, font: { size: 13 } },
    hovermode: 'x unified',
    hoverlabel: { bgcolor: '#0D1B2E', bordercolor: '#1E3A5F', font: { size: 13, color: '#F0F6FF' } },
    shapes: [{ type: 'line', x0: 0, x1: 1, xref: 'paper', y0: 0, y1: 0,
      line: { color: 'rgba(255,255,255,0.2)', width: 1, dash: 'dash' } }],
  }

  const METRICS = [
    { label: 'Market Cap',     k: 'Market Cap',     fmt: 'number'  },
    { label: 'Trailing P/E',   k: 'Trailing P/E',   fmt: 'number'  },
    { label: 'Forward P/E',    k: 'Forward P/E',    fmt: 'number'  },
    { label: 'Revenue (TTM)',  k: 'Revenue (TTM)',   fmt: 'number'  },
    { label: 'Profit Margin',  k: 'Profit Margin',  fmt: 'percent' },
    { label: 'Revenue Growth', k: 'Revenue Growth', fmt: 'percent' },
    { label: 'Beta',           k: 'Beta',           fmt: 'number'  },
    { label: 'Dividend Yield', k: 'Dividend Yield', fmt: 'percent' },
    { label: '52W High',       k: '52W High',       fmt: 'number'  },
    { label: '52W Low',        k: '52W Low',        fmt: 'number'  },
  ]

  return (
    <>
      {/* Compare button — pulsating glow */}
      <motion.button
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        animate={{ boxShadow: ['0 0 6px rgba(6,182,212,0.15), 0 0 0px rgba(6,182,212,0)', '0 0 18px rgba(6,182,212,0.5), 0 0 35px rgba(6,182,212,0.15)', '0 0 6px rgba(6,182,212,0.15), 0 0 0px rgba(6,182,212,0)'] }}
        transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.15 } }}
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
          background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.45)', color: '#06B6D4' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(6,182,212,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(6,182,212,0.1)'}
      >
        <GitCompare style={{ width: 16, height: 16, filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.9))' }} />
        Compare
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: 20 }}
            onClick={e => e.target === e.currentTarget && close()}>

            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.22 }}
              style={{ width: '100%', maxWidth: 1000, maxHeight: '92vh', overflowY: 'auto', overflowX: 'visible',
                background: 'rgba(4,8,18,0.98)', border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 20, boxShadow: '0 0 80px rgba(6,182,212,0.1)' }}
              className="no-scrollbar">

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 28px', borderBottom: '1px solid rgba(40,65,100,0.5)', position: 'sticky', top: 0,
                background: 'rgba(4,8,18,0.98)', zIndex: 10, borderRadius: '20px 20px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GitCompare style={{ width: 18, height: 18, color: '#06B6D4' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: '#F0F6FF' }}>
                    Stock Comparison
                  </span>
                </div>
                <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6A8BAA', padding: 6, borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.color='#F0F6FF'}
                  onMouseLeave={e => e.currentTarget.style.color='#6A8BAA'}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              <div style={{ padding: '24px 28px', overflow: 'visible' }}>

                {/* Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(6,182,212,0.08)',
                    border: `1px solid ${COLORS.stock1}50`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.stock1, flexShrink: 0, boxShadow: `0 0 8px ${COLORS.stock1}` }} />
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 700, color: COLORS.stock1 }}>{ticker1}</span>
                  </div>
                  <div style={{ position: 'relative', zIndex: 100 }}>
                    {ticker2 && data ? (
                      <div style={{ padding: '11px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)',
                        border: `1px solid ${COLORS.stock2}50`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.stock2, flexShrink: 0, boxShadow: `0 0 8px ${COLORS.stock2}` }} />
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 700, color: COLORS.stock2 }}>{ticker2}</span>
                        </div>
                        <button onClick={() => { setTicker2(null); setData(null) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6A8BAA' }}>
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    ) : (
                      <CompareSearch onSelect={handleCompare} placeholder="Search stock to compare..." />
                    )}
                  </div>
                </div>

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 0' }}>
                    <Loader2 style={{ width: 22, height: 22, color: '#06B6D4', animation: 'cspin 0.8s linear infinite' }} />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6A8BAA' }}>Fetching comparison data...</span>
                  </div>
                )}

                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)', color: '#F43F5E', fontSize: 14, fontFamily: 'var(--font-body)' }}>
                    {error}
                  </div>
                )}

                {data && !loading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                    {/* Price cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      {[data.stock1, data.stock2].map((s, i) => (
                        <div key={s.ticker} style={{ padding: '16px 20px', borderRadius: 14,
                          background: i === 0 ? 'rgba(6,182,212,0.06)' : 'rgba(245,158,11,0.06)',
                          border: `1px solid ${i === 0 ? COLORS.stock1 : COLORS.stock2}30` }}>
                          <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: i === 0 ? COLORS.stock1 : COLORS.stock2, marginBottom: 4, fontWeight: 600 }}>{s.ticker}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6A8BAA', marginBottom: 10 }}>{s.name}</div>
                          <div style={{ fontFamily: 'var(--font-data)', fontSize: 24, fontWeight: 700, color: '#F0F6FF' }}>
                            {s.current_price ? s.current_price.toLocaleString() : '—'}
                          </div>
                          {s.change_pct != null && (
                            <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 600, marginTop: 6,
                              color: s.change_pct >= 0 ? '#10B981' : '#F43F5E' }}>
                              {s.change_pct >= 0 ? '▲' : '▼'} {Math.abs(s.change_pct).toFixed(2)}% today
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Chart */}
                    <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 14, padding: '8px 0', marginBottom: 20 }}>
                      <div style={{ padding: '12px 20px 4px', fontFamily: 'var(--font-data)', fontSize: 12,
                        color: 'rgba(6,182,212,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                        1-Year Performance (% Change)
                      </div>
                      <div style={{ height: 300 }}>
                        <Plot data={chartTraces} layout={chartLayout}
                          config={{ displayModeBar: false, responsive: true }}
                          style={{ width: '100%', height: '100%' }} useResizeHandler={true} />
                      </div>
                    </div>

                    {/* Metrics table */}
                    <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 14, padding: '18px 24px' }}>
                      <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.7)',
                        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>
                        Key Metrics Comparison
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', gap: 8, marginBottom: 10 }}>
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 700, color: COLORS.stock1, textAlign: 'right' }}>{data.stock1.ticker}</div>
                        <div />
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 700, color: COLORS.stock2, textAlign: 'left' }}>{data.stock2.ticker}</div>
                      </div>
                      {METRICS.map(row => (
                        <MetricRow key={row.k} label={row.label}
                          v1={data.stock1.metrics[row.k]} v2={data.stock2.metrics[row.k]} format={row.fmt} />
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', gap: 8, padding: '10px 0', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, color: COLORS.stock1, textAlign: 'right', fontWeight: 600 }}>{data.stock1.metrics['Sector']}</div>
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: '#6A8BAA', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sector</div>
                        <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, color: COLORS.stock2, textAlign: 'left', fontWeight: 600 }}>{data.stock2.metrics['Sector']}</div>
                      </div>
                    </div>

                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}