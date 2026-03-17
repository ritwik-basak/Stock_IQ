import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Loader2, Sparkles, Bot, Zap } from 'lucide-react'

const PRESETS = [
  { label: 'Trend',      icon: '📈', q: 'Is the stock in a bullish or bearish trend based on moving averages?' },
  { label: 'Momentum',   icon: '⚡', q: 'Does the RSI indicate the stock is overbought or oversold?' },
  { label: 'MACD',       icon: '🔀', q: 'Is there a MACD crossover signal and what does it indicate?' },
  { label: 'Risk',       icon: '⚠️', q: 'What risks exist in this stock based on volatility and beta?' },
  { label: 'Financials', icon: '🏦', q: "Evaluate the company's financial health based on revenue growth, profit margins, and debt." },
  { label: 'Short-Term', icon: '🎯', q: 'What is the short-term outlook based on technical indicators and fundamentals?' },
  { label: 'Long-Term',  icon: '🌱', q: 'Is this company fundamentally strong for long-term investment?' },
]

const TypingDots = () => (
  <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
    {[0,1,2].map(i => (
      <motion.div key={i}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#06B6D4' }}
        animate={{ scale: [1,1.6,1], opacity: [0.4,1,0.4] }}
        transition={{ duration: 0.85, repeat: Infinity, delay: i*0.2 }} />
    ))}
  </div>
)

const Bubble = ({ msg, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 14, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: Math.min(idx,3)*0.05, duration: 0.35, ease: [0.23,1,0.32,1] }}
    style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
  >
    {msg.role === 'ai' && (
      <div style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: 10, marginTop: 2,
        background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.08))',
        border: '1px solid rgba(6,182,212,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 14px rgba(6,182,212,0.3)',
      }}>
        <Bot style={{ width: 17, height: 17, color: '#06B6D4', filter: 'drop-shadow(0 0 5px rgba(6,182,212,0.9))' }} />
      </div>
    )}
    <div style={{
      maxWidth: '83%', padding: '13px 17px', lineHeight: 1.8,
      fontFamily: 'var(--font-body)', fontSize: 15,
      color: msg.error ? '#F43F5E' : '#EDF4FF',
      ...(msg.role === 'user' ? {
        background: 'rgba(20,35,65,0.95)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '14px 2px 14px 14px',
        boxShadow: '0 0 20px rgba(59,130,246,0.1)',
      } : {
        background: 'rgba(6,18,32,0.95)',
        border: '1px solid rgba(6,182,212,0.25)',
        borderRadius: '2px 14px 14px 14px',
        boxShadow: '0 0 20px rgba(6,182,212,0.08)',
      })
    }}>
      {msg.role === 'user' && (
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(96,165,250,0.95)', marginBottom: 7, letterSpacing: '0.1em', fontWeight: 600 }}>YOU</div>
      )}
      {msg.role === 'ai' && !msg.error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.95)', letterSpacing: '0.08em', fontWeight: 600 }}>
            <Sparkles style={{ width: 10, height: 10 }} /> GEMINI 2.5 FLASH
          </div>
          {msg.webSearch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.35)',
              fontFamily: 'var(--font-data)', fontSize: 9, color: '#fbbf24', letterSpacing: '0.08em' }}>
              🌐 WEB SEARCH USED
            </div>
          )}
        </div>
      )}
      {msg.text}
    </div>
  </motion.div>
)

// Floating orbs animation inside the panel background
function PanelCanvas({ containerRef }) {
  const canvasRef = useRef(null)
  const mouseRef  = useRef({ x: -999, y: -999 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef?.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = container.offsetWidth
      canvas.height = container.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    // Track mouse relative to container
    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', () => { mouseRef.current = { x: -999, y: -999 } })

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 2.2 + 0.6,
      a: Math.random() * 0.55 + 0.2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x, my = mouseRef.current.y

      // Mouse proximity glow inside panel
      if (mx > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 180)
        g.addColorStop(0, 'rgba(6,182,212,0.22)')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const dx = mx - p.x, dy = my - p.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        const boost = (mx > 0 && dist < 180) ? (1 - dist/180) * 2.0 : 0

        // Draw connection lines near mouse
        if (boost > 0.3) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mx, my)
          ctx.strokeStyle = `rgba(6,182,212,${boost * 0.35})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r + boost * 0.8, 0, Math.PI*2)
        ctx.fillStyle = `rgba(6,182,212,${Math.min(p.a + boost * 0.8, 1.0)})`
        ctx.fill()

        // Glow for boosted particles
        if (boost > 0.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, (p.r + boost) * 2.5, 0, Math.PI*2)
          ctx.fillStyle = `rgba(6,182,212,${boost * 0.18})`
          ctx.fill()
        }
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      container.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      borderRadius: 18, opacity: 1, zIndex: -1, pointerEvents: 'none',
    }} />
  )
}

export default function AIAnalysisPanel({ messages, aiLoading, onAsk, ticker, chartHeight = 625 }) {
  const [input, setInput] = useState('')
  const chatBoxRef  = useRef(null)
  const chatEndRef  = useRef(null)
  const panelRef    = useRef(null)

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages, aiLoading])

  const send = (q) => {
    const question = q || input.trim()
    if (!question || aiLoading || !ticker) return
    onAsk(question); setInput('')
  }

  return (
    <div ref={panelRef} style={{
      display: 'flex', flexDirection: 'column',
      borderRadius: 18, overflow: 'hidden', position: 'relative', isolation: 'isolate',
      background: 'linear-gradient(160deg, rgba(2,6,18,0.98) 0%, rgba(0,10,22,0.99) 100%)',
      border: '1px solid rgba(6,182,212,0.25)',
      boxShadow: '0 0 40px rgba(6,182,212,0.08), 0 0 80px rgba(6,182,212,0.04)',
      transition: 'box-shadow 0.4s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 60px rgba(6,182,212,0.18), 0 0 120px rgba(6,182,212,0.08)'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.45)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 40px rgba(6,182,212,0.08), 0 0 80px rgba(6,182,212,0.04)'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.25)' }}
    >
      {/* Particle canvas background */}
      <PanelCanvas containerRef={panelRef} />

      {/* Corner accents */}
      {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
        <div key={`${v}${h}`} style={{ position: 'absolute', [v]: 0, [h]: 0, width: 50, height: 50, pointerEvents: 'none', zIndex: 1 }}>
          <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 50, height: 2, background: `linear-gradient(${h==='left'?'90deg':'270deg'}, #06B6D4, transparent)`, boxShadow: '0 0 8px rgba(6,182,212,0.6)' }} />
          <div style={{ position: 'absolute', [v]: 0, [h]: 0, width: 2, height: 50, background: `linear-gradient(${v==='top'?'180deg':'0deg'}, #06B6D4, transparent)`, boxShadow: '0 0 8px rgba(6,182,212,0.6)' }} />
        </div>
      ))}

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 3, padding: '18px 20px', borderBottom: '1px solid rgba(6,182,212,0.14)', flexShrink: 0, overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.7), transparent)', zIndex: 3 }}
          animate={{ top: ['-2px', '120%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(6,182,212,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <motion.div
                animate={{ boxShadow: ['0 0 12px rgba(6,182,212,0.3)', '0 0 30px rgba(6,182,212,0.75)', '0 0 12px rgba(6,182,212,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(6,182,212,0.07))',
                  border: '1px solid rgba(6,182,212,0.55)' }}>
                <Brain style={{ width: 22, height: 22, color: '#06B6D4', filter: 'drop-shadow(0 0 12px rgba(6,182,212,1))' }} />
              </motion.div>
              <motion.div style={{ position: 'absolute', inset: -5, borderRadius: 19, border: '1px solid rgba(6,182,212,0.35)' }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#FFFFFF', textShadow: '0 0 20px rgba(255,255,255,0.25)' }}>
                AI Market Intelligence
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.95)', letterSpacing: '0.1em', fontWeight: 600 }}>GEMINI 2.5 FLASH</span>
                <span style={{ color: 'rgba(6,182,212,0.3)' }}>·</span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.7)', letterSpacing: '0.08em' }}>REAL-TIME ANALYSIS</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Preset buttons */}
      <div style={{ position: 'relative', zIndex: 3, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,182,212,0.025)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.9)', letterSpacing: '0.14em', marginBottom: 10, fontWeight: 600 }}>⚡ QUICK ANALYSIS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {PRESETS.map((p) => (
            <motion.button key={p.label}
              whileHover={{ scale: 1.06, y: -2, boxShadow: '0 0 18px rgba(6,182,212,0.3)' }}
              whileTap={{ scale: 0.94 }}
              onClick={() => !aiLoading && ticker && send(p.q)}
              disabled={aiLoading || !ticker}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10,
                cursor: (aiLoading || !ticker) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#B8D0E8',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s', opacity: (aiLoading || !ticker) ? 0.25 : 1,
              }}
              onMouseEnter={e => {
                if (!aiLoading && ticker) {
                  e.currentTarget.style.borderColor = 'rgba(6,182,212,0.6)'
                  e.currentTarget.style.color = '#06B6D4'
                  e.currentTarget.style.background = 'rgba(6,182,212,0.12)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#B8D0E8'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <span style={{ fontSize: 12 }}>{p.icon}</span>{p.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatBoxRef} className="no-scrollbar"
        style={{ position: 'relative', zIndex: 3, padding: '18px', display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(2,6,16,0.6)' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '20px 0' }}>
            <motion.div
              animate={{ y: [0,-8,0], filter: ['drop-shadow(0 0 8px rgba(6,182,212,0.3))', 'drop-shadow(0 0 24px rgba(6,182,212,0.9))', 'drop-shadow(0 0 8px rgba(6,182,212,0.3))'] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Brain style={{ width: 30, height: 30, color: 'rgba(6,182,212,0.65)' }} />
            </motion.div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'rgba(240,246,255,0.75)', marginBottom: 8 }}>
              {ticker ? 'Ready to Analyze' : 'Select a Stock First'}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(180,208,232,0.6)', lineHeight: 1.6, maxWidth: 240 }}>
              {ticker ? 'Pick a quick analysis above or ask your own question' : 'Search for a stock to begin AI-powered analysis'}
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => <Bubble key={i} msg={msg} idx={i} />)}
        </AnimatePresence>
        {aiLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(6,182,212,0.08))',
              border: '1px solid rgba(6,182,212,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(6,182,212,0.3)' }}>
              <Bot style={{ width: 17, height: 17, color: '#06B6D4' }} />
            </div>
            <div style={{ padding: '13px 17px', background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.04))', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '2px 14px 14px 14px' }}>
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ position: 'relative', zIndex: 3, padding: '14px 18px', borderTop: '1px solid rgba(6,182,212,0.12)', flexShrink: 0, background: 'rgba(6,182,212,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.25s' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='rgba(6,182,212,0.5)'; e.currentTarget.style.boxShadow='0 0 0 1px rgba(6,182,212,0.2), 0 0 28px rgba(6,182,212,0.12)' }}
          onBlurCapture={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow='none' }}
        >
          <Sparkles style={{ width: 16, height: 16, color: 'rgba(6,182,212,0.65)', flexShrink: 0 }} />
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={ticker ? 'Ask AI anything about this stock...' : 'Select a stock first...'}
            disabled={!ticker || aiLoading}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: 15, color: '#EDF4FF', caretColor: '#06B6D4' }}
          />
          <motion.button
            whileHover={input.trim() && ticker && !aiLoading ? { scale: 1.12, boxShadow: '0 0 20px rgba(6,182,212,0.5)' } : {}}
            whileTap={{ scale: 0.88 }}
            onClick={() => send()}
            disabled={!input.trim() || aiLoading || !ticker}
            style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, cursor: 'pointer',
              background: input.trim() && ticker && !aiLoading
                ? 'linear-gradient(135deg, rgba(6,182,212,0.28), rgba(6,182,212,0.12))'
                : 'rgba(255,255,255,0.04)',
              border: input.trim() && ticker && !aiLoading
                ? '1px solid rgba(6,182,212,0.6)'
                : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() && ticker && !aiLoading ? '0 0 14px rgba(6,182,212,0.3)' : 'none',
              opacity: (!input.trim() || aiLoading || !ticker) ? 0.35 : 1,
              transition: 'all 0.2s' }}>
            {aiLoading
              ? <Loader2 style={{ width: 14, height: 14, color: '#06B6D4', animation: 'aiSpin 1s linear infinite' }} />
              : <Send style={{ width: 14, height: 14, color: '#06B6D4', filter: input.trim() ? 'drop-shadow(0 0 5px rgba(6,182,212,0.9))' : 'none' }} />}
          </motion.button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontFamily: 'var(--font-data)', fontSize: 12, color: 'rgba(6,182,212,0.55)', letterSpacing: '0.08em' }}>
          PRESS ENTER TO SEND · POWERED BY GEMINI 2.5 FLASH
        </div>
      </div>
      <style>{`@keyframes aiSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}