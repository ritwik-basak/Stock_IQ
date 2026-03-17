import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatNumber, formatPercent, formatPrice } from '../utils/formatters'
import LoadingSkeleton from './LoadingSkeleton'

const MetricCard = ({ label, value, color, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }} className="metric-card">
    <div className="metric-label">{label}</div>
    <div className="metric-value" style={color ? { color } : {}}>{value || '—'}</div>
  </motion.div>
)

export default function MetricsPanel({ financials, loading }) {
  if (loading) return <LoadingSkeleton type="metrics" />
  if (!financials) return null
  const f = financials
  const currency = f['Currency'] === 'INR' ? '₹' : f['Currency'] === 'USD' ? '$' : ''
  const ret  = f['Period Return']
  const isUp = ret != null && ret !== 'N/A' ? parseFloat(ret) >= 0 : null
  const TIcon = isUp ? TrendingUp : TrendingDown

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Price block */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(40,65,100,0.6)', borderRadius: 14, padding: 16 }}>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: '#7A9DBF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>Current Price</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 30, fontWeight: 700, color: '#F0F6FF' }}>
            {formatPrice(f['Current Price'], currency)}
          </span>
          {isUp !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3,
              color: isUp ? '#10B981' : '#F43F5E', fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 700 }}>
              <TIcon style={{ width: 15, height: 15 }} />
              {formatPercent(ret)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 14, fontFamily: 'var(--font-data)' }}>
          <span style={{ color: 'var(--c-muted)' }}>52W H: <span style={{ color: '#10B981', fontWeight: 600 }}>{formatPrice(f['52W High'], currency)}</span></span>
          <span style={{ color: 'var(--c-muted)' }}>52W L: <span style={{ color: '#F43F5E', fontWeight: 600 }}>{formatPrice(f['52W Low'], currency)}</span></span>
        </div>
      </motion.div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricCard label="Market Cap"   value={formatNumber(f['Market Cap'])}      delay={0.05} />
        <MetricCard label="Trailing P/E" value={formatNumber(f['Trailing P/E'])}    delay={0.08} />
        <MetricCard label="Forward P/E"  value={formatNumber(f['Forward P/E'])}     delay={0.11} />
        <MetricCard label="Price/Book"   value={formatNumber(f['Price/Book'])}      delay={0.14} />
        <MetricCard label="Div Yield"    value={formatPercent(f['Dividend Yield'])} delay={0.17} />
        <MetricCard label="Beta"         value={formatNumber(f['Beta'])}            delay={0.20} />
        <MetricCard label="Volume"       value={formatNumber(f['Volume'])}          delay={0.23} />
        <MetricCard label="Avg Volume"   value={formatNumber(f['Avg Volume'])}      delay={0.26} />
      </div>

      {/* Sector */}
      {f['Sector'] && f['Sector'] !== 'N/A' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(40,65,100,0.5)', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: '#7A9DBF', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>Classification</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 17, color: '#06B6D4', fontWeight: 600 }}>{f['Sector']}</div>
          {f['Industry'] && f['Industry'] !== 'N/A' &&
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#B8D0E8', marginTop: 6 }}>{f['Industry']}</div>}
        </motion.div>
      )}
    </div>
  )
}