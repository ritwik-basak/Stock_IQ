import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatPercent } from '../utils/formatters'
import LoadingSkeleton from './LoadingSkeleton'

const Row = ({ label, value, color }) => (
  <div className="fin-row">
    <span className="fin-label">{label}</span>
    <span className="fin-value" style={color ? { color } : {}}>{value || '—'}</span>
  </div>
)

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid rgba(40,65,100,0.5)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      >
        <span className="section-header">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown style={{ width: 15, height: 15, color: 'var(--c-muted)' }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '4px 16px 12px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const GrowthBar = ({ label, value }) => {
  const pct = value && value !== 'N/A' ? parseFloat(value) * 100 : null
  const isPos = pct !== null && pct >= 0
  const width = pct !== null ? Math.min(Math.abs(pct) * 3, 100) : 0
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(40,65,100,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--c-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 600, color: pct === null ? 'var(--c-muted)' : isPos ? '#10B981' : '#F43F5E' }}>
          {pct !== null ? `${isPos ? '+' : ''}${pct.toFixed(1)}%` : '—'}
        </span>
      </div>
      {pct !== null && (
        <div style={{ height: 4, background: 'rgba(40,65,100,0.5)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', borderRadius: 2, background: isPos ? '#10B981' : '#F43F5E' }} />
        </div>
      )}
    </div>
  )
}

export default function FinancialPanel({ financials, loading }) {
  if (loading) return <LoadingSkeleton type="financial" />
  if (!financials) return null
  const f = financials

  return (
    <div>
      <Section title="Income Statement" defaultOpen={true}>
        <Row label="Revenue (TTM)"     value={formatNumber(f['Revenue (TTM)'])} />
        <Row label="Net Income"        value={formatNumber(f['Net Income'])} />
        <Row label="Gross Margin"      value={formatPercent(f['Gross Margins'])}     color={parseFloat(f['Gross Margins']) > 0 ? '#10B981' : '#F43F5E'} />
        <Row label="Operating Margin"  value={formatPercent(f['Operating Margins'])} />
        <Row label="Profit Margin"     value={formatPercent(f['Profit Margins'])} />
        <Row label="EV/EBITDA"         value={formatNumber(f['EV/EBITDA'])} />
      </Section>
      <Section title="Balance Sheet">
        <Row label="Total Assets"  value={formatNumber(f['Total Assets'])} />
        <Row label="Total Debt"    value={formatNumber(f['Total Debt'])} />
        <Row label="Total Cash"    value={formatNumber(f['Total Cash'])} />
        <Row label="Debt/Equity"   value={formatNumber(f['Debt/Equity'])} />
        <Row label="Current Ratio" value={formatNumber(f['Current Ratio'])} />
        <Row label="Quick Ratio"   value={formatNumber(f['Quick Ratio'])} />
      </Section>
      <Section title="Growth Metrics">
        <GrowthBar label="Revenue Growth"  value={f['Revenue Growth']} />
        <GrowthBar label="Earnings Growth" value={f['Earnings Growth']} />
        <GrowthBar label="Profit Margins"  value={f['Profit Margins']} />
      </Section>
      <Section title="Dividends">
        <Row label="Dividend Yield" value={formatPercent(f['Dividend Yield'])} />
        <Row label="Payout Ratio"   value={formatPercent(f['Payout Ratio'])} />
      </Section>
    </div>
  )
}