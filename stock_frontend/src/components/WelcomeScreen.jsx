import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp, Brain, BarChart2, Zap, Search } from 'lucide-react'
import { searchStocks, fetchLiveTickers } from '../services/api'

const FALLBACK_TICKERS = [
  { sym: 'RELIANCE.NS', val: '+2.3%', up: true },
  { sym: 'AAPL',        val: '-0.8%', up: false },
  { sym: 'TCS.NS',      val: '+1.1%', up: true },
  { sym: 'TSLA',        val: '+4.2%', up: true },
  { sym: 'INFY.NS',     val: '-0.5%', up: false },
  { sym: 'MSFT',        val: '+1.7%', up: true },
  { sym: 'HDFC.NS',     val: '+0.9%', up: true },
  { sym: 'NVDA',        val: '+3.1%', up: true },
]

const FEATURES = [
  { icon: BarChart2,  title: 'Universal Search',  desc: 'NSE, BSE, NASDAQ, NYSE & more' },
  { icon: TrendingUp, title: 'Live Charts',        desc: 'Candlestick with SMA, RSI, MACD' },
  { icon: Zap,        title: '35+ Metrics',        desc: 'Valuation, income, balance sheet' },
  { icon: Brain,      title: 'Gemini AI',          desc: 'Real-time intelligence on any stock' },
]

const EXCHANGE_COLORS = {
  'NSE India': '#fb923c', 'BSE India': '#fdba74',
  'NASDAQ': '#60a5fa', 'NYSE': '#93c5fd', default: '#8BA3BE',
}

function HeroSearch({ onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const wrapRef  = useRef(null)

  const doSearch = async (q) => {
    if (!q.trim() || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const data = await searchStocks(q)
      setResults(data.results || [])
      setOpen(true)
    } catch { setResults([]) }
    finally { setLoading(false) }
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(e.target.value), 350)
  }

  const handleSelect = (item) => {
    setQuery(''); setOpen(false); setResults([])
    setExpanded(false)
    onSelect(item.symbol, { symbol: item.symbol, name: item.name, exchange: item.exchange })
  }

  const handleMouseEnter = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const handleMouseLeave = () => {
    if (!query) { setExpanded(false); setOpen(false) }
  }

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        if (!query) setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query])

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{ width: expanded ? 560 : 64, height: expanded ? 62 : 64, borderRadius: expanded ? 18 : 32 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{
          background: expanded ? 'rgba(6,182,212,0.06)' : 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.4)',
          boxShadow: expanded ? '0 0 30px rgba(6,182,212,0.25), 0 0 80px rgba(6,182,212,0.1)' : '0 0 20px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.12)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: expanded ? 'flex-start' : 'center',
          overflow: 'hidden', padding: expanded ? '0 20px' : '0', position: 'relative',
        }}
      >
        {!expanded && (
          <motion.div animate={{ opacity: [0.4,0.9,0.4], scale: [1,1.15,1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, borderRadius: 32, background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)' }} />
        )}
        <Search style={{ color: '#06B6D4', width: expanded ? 20 : 24, height: expanded ? 20 : 24, flexShrink: 0, transition: 'all 0.3s', filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.9))' }} />
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', marginLeft: 12, width: '100%' }}>
              <input ref={inputRef} value={query} onChange={handleChange}
                onKeyDown={e => e.key === 'Escape' && (setExpanded(false), setOpen(false), setQuery(''))}
                placeholder="Search any stock — RELIANCE, AAPL, TCS..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 16, fontFamily: 'var(--font-body)', color: '#E8EDF2', caretColor: '#06B6D4', width: '100%' }} />
              {loading && <div style={{ width: 16, height: 16, flexShrink: 0, border: '2px solid rgba(6,182,212,0.3)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'heroSpin 0.8s linear infinite' }} />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: 72, width: 560, background: 'rgba(2,6,14,0.98)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.8)', zIndex: 100 }}>
            {results.map((r, i) => (
              <motion.div key={r.symbol} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onMouseDown={() => handleSelect(r)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp style={{ width: 16, height: 16, color: '#06B6D4' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 600, color: '#fff' }}>{r.symbol}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(200,220,240,0.6)', marginTop: 2 }}>{r.name}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: EXCHANGE_COLORS[r.exchange] || EXCHANGE_COLORS.default }}>{r.exchange}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes heroSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function WelcomeScreen({ onSelect }) {
  const canvasRef = useRef(null)
  const mouseRef  = useRef({ x: -999, y: -999 })
  const [typed, setTyped]   = useState('')
  const [tickers, setTickers]   = useState([])
  const [fetchedAt, setFetchedAt] = useState(null)
  const fullText = 'AI Stock Intelligence'

  useEffect(() => {
    fetchLiveTickers()
      .then(res => {
        const raw = res?.tickers || []
        const formatted = raw
          .filter(t => t && t.change_pct != null)
          .map(t => ({
            sym: t.symbol,
            val: `${t.change_pct >= 0 ? '+' : ''}${t.change_pct.toFixed(2)}%`,
            up:  Boolean(t.up),
          }))
        if (formatted.length > 0) setTickers(formatted)
        if (res?.fetched_at) setFetchedAt(res.fetched_at)
      })
      .catch(e => console.error('Ticker fetch error:', e))
  }, [])

  useEffect(() => {
    let i = 0
    const iv = setInterval(() => {
      if (i <= fullText.length) { setTyped(fullText.slice(0, i)); i++ }
      else clearInterval(iv)
    }, 65)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const onMove = e => {
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      } else {
        mouseRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 80 }, () => ({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 2.2 + 0.6,
      a:  Math.random() * 0.55 + 0.2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      if (mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 420)
        grad.addColorStop(0, 'rgba(6,182,212,0.14)')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(6,182,212,${(1 - dist / 130) * 0.22})`
            ctx.lineWidth = 0.7
            ctx.stroke()
          }
        }
      }

      particles.forEach(p => {
        const dx    = mx - p.x
        const dy    = my - p.y
        const dist  = Math.sqrt(dx * dx + dy * dy)
        const boost = (mx > 0 && dist < 200) ? (1 - dist / 200) * 2.0 : 0

        if (boost > 0.25) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mx, my)
          ctx.strokeStyle = `rgba(6,182,212,${boost * 0.35})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
        if (boost > 0.4) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, (p.r + boost) * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(6,182,212,${boost * 0.18})`
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + boost * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${Math.min(p.a + boost * 0.8, 1.0)})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 65%)', animation: 'orb-drift 12s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', width: '100%', maxWidth: 720 }}>

        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
          style={{ position: 'relative', marginBottom: 32 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(6,182,212,0.4)', '0 0 0 18px rgba(6,182,212,0)', '0 0 0 0 rgba(6,182,212,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(6,182,212,0.2)' }}>
            <Activity style={{ width: 48, height: 48, color: '#06B6D4', filter: 'drop-shadow(0 0 14px rgba(6,182,212,0.9))' }} />
          </motion.div>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#4ade80', border: '2px solid #000' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 className="f-display" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, marginBottom: 10 }}>
            <span style={{ color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.15)' }}>Stock</span>
            <span style={{ color: '#06B6D4', textShadow: '0 0 25px rgba(6,182,212,0.7), 0 0 60px rgba(6,182,212,0.3)' }}>IQ</span>
          </h1>
          <div className="f-display" style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
            {typed}<span style={{ color: '#06B6D4', animation: 'blink 1s step-end infinite' }}>|</span>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="f-body" style={{ fontSize: 16, textAlign: 'center', maxWidth: 480, marginBottom: 52, lineHeight: 1.7, color: 'rgba(200,220,240,0.55)' }}>
          Search any stock globally. Get interactive charts, 35+ financial metrics,
          and real-time AI analysis powered by Gemini 2.5 Flash.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          style={{ marginBottom: 64, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <HeroSearch onSelect={onSelect} />
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, width: '100%', marginBottom: 40 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + i * 0.08 }} whileHover={{ y: -5 }}
              style={{ padding: '20px 16px', borderRadius: 18, textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', transition: 'all 0.3s ease', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(6,182,212,0.3)'; e.currentTarget.style.background='rgba(6,182,212,0.05)'; e.currentTarget.style.boxShadow='0 0 24px rgba(6,182,212,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.boxShadow='none' }}>
              <f.icon style={{ width: 22, height: 22, color: '#06B6D4', filter: 'drop-shadow(0 0 7px rgba(6,182,212,0.6))', margin: '0 auto 10px' }} />
              <div className="f-display" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 5 }}>{f.title}</div>
              <div className="f-body" style={{ fontSize: 12, color: 'rgba(200,220,240,0.45)', lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
          {fetchedAt && (
            <div style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'var(--font-data)', fontSize: 13, color: 'rgba(6,182,212,0.75)', letterSpacing: '0.12em', fontWeight: 600 }}>
              LIVE · {fetchedAt}
            </div>
          )}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 64, zIndex: 1, background: 'linear-gradient(to right, #000, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 64, zIndex: 1, background: 'linear-gradient(to left, #000, transparent)', pointerEvents: 'none' }} />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 0' }}>
            <motion.div animate={{ x: ['0%', '-50%'] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex', gap: 40, whiteSpace: 'nowrap' }}>
              {[...tickers, ...tickers].map((t, i) => (
                <span key={i} className="f-data" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(220,235,255,0.85)', fontWeight: 600 }}>{t.sym}</span>
                  <span style={{ color: t.up ? '#10B981' : '#F43F5E', fontWeight: 700, textShadow: t.up ? '0 0 10px rgba(16,185,129,0.7)' : '0 0 10px rgba(244,63,94,0.7)' }}>
                    {t.up ? '▲' : '▼'} {t.val}
                  </span>
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}