import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, X } from 'lucide-react'
import { searchStocks } from '../services/api'

const EXCHANGE_COLORS = {
  'NSE India': 'text-orange-400',
  'BSE India': 'text-orange-300',
  'NASDAQ': 'text-blue-400',
  'NYSE': 'text-blue-300',
  default: 'text-text-secondary',
}

export default function StockSearch({ onSelect, variant = 'nav' }) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [open, setOpen]             = useState(false)
  const [focused, setFocused]       = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const data = await searchStocks(q)
      setResults(data.results || [])
      setOpen(true)
      setHighlighted(0)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 350)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch])

  const handleSelect = (item) => {
    setQuery(item.symbol)
    setOpen(false)
    setResults([])
    onSelect(item.symbol, { symbol: item.symbol, name: item.name, exchange: item.exchange })
    inputRef.current?.blur()
  }

  const handleKey = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter')      { handleSelect(results[highlighted]) }
    if (e.key === 'Escape')     { setOpen(false); inputRef.current?.blur() }
  }

  const clear = () => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }

  const exchColor = (exch) => EXCHANGE_COLORS[exch] || EXCHANGE_COLORS.default

  const isHero = variant === 'hero'

  return (
    <div className={`relative ${isHero ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`} onKeyDown={handleKey}>
      <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${
        focused
          ? 'border-accent-cyan/60 shadow-glow-cyan bg-bg-elevated'
          : 'border-bg-border bg-bg-secondary'
      } ${isHero ? 'py-1' : ''}`}>
        <Search className={`absolute left-3.5 w-4 h-4 transition-colors duration-300 ${focused ? 'text-accent-cyan' : 'text-text-muted'}`} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true) }}
          onBlur={() => { setTimeout(() => { setOpen(false); setFocused(false) }, 150) }}
          placeholder={isHero ? 'Search any stock — RELIANCE, AAPL, TCS, TSLA...' : 'Search stocks — RELIANCE, AAPL, TCS...'}
          className={`w-full bg-transparent pl-10 pr-10 outline-none font-body text-text-primary placeholder-text-muted ${
            isHero ? 'py-4 text-base' : 'py-3 text-sm'
          }`}
        />
        {loading && (
          <div className="absolute right-3.5">
            <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button onClick={clear} className="absolute right-3.5 text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full z-50 card border border-bg-border rounded-xl overflow-hidden shadow-card-hover"
          >
            {results.map((r, i) => (
              <motion.button
                key={r.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onMouseDown={() => handleSelect(r)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-150 border-b border-bg-border/50 last:border-0 ${
                  highlighted === i ? 'bg-accent-cyan/8' : 'hover:bg-bg-elevated'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-bg-border flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <div>
                    <div className="font-mono text-sm font-medium text-text-primary">{r.symbol}</div>
                    <div className="text-xs text-text-secondary mt-0.5 truncate max-w-[200px]">{r.name}</div>
                  </div>
                </div>
                <div className={`text-xs font-mono font-medium ${exchColor(r.exchange)}`}>
                  {r.exchange}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}