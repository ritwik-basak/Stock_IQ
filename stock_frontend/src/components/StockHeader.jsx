import { motion } from 'framer-motion'
import StockComparison from './StockComparison'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { formatPrice, formatPercent } from '../utils/formatters'

export default function StockHeader({ stockInfo, financials, loading, onRefresh }) {
  if (!stockInfo) return null
  const f        = financials || {}
  const price    = f['Current Price']
  const ret      = f['Period Return']
  const isUp     = ret !== null && ret !== undefined ? parseFloat(ret) >= 0 : null
  const currency = f['Currency'] === 'INR' ? '₹' : f['Currency'] === 'USD' ? '$' : ''

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold font-display text-text-primary">{stockInfo.symbol}</h2>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border border-bg-border text-text-muted bg-bg-elevated">
            {stockInfo.exchange || 'EQUITY'}
          </span>
        </div>
        {f['Company'] && f['Company'] !== 'N/A' && (
          <div className="text-sm text-text-muted font-body mt-0.5 truncate max-w-[320px]">{f['Company']}</div>
        )}
      </div>
      {price && price !== 'N/A' && (
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold font-mono text-text-primary tabular-nums">
            {formatPrice(price, currency)}
          </span>
          {isUp !== null && (
            <div className={`flex items-center gap-1 text-sm font-bold mb-0.5 ${isUp ? 'text-bull' : 'text-bear'}`}>
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercent(ret)}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {stockInfo && <StockComparison ticker1={stockInfo.symbol} />}
        <motion.button whileTap={{ rotate: 180 }} transition={{ duration: 0.4 }} onClick={onRefresh} disabled={loading}
          className="w-8 h-8 rounded-xl border border-bg-border flex items-center justify-center
                     text-text-muted hover:text-accent-blue hover:border-accent-blue/40 hover:bg-accent-blue/5 transition-all
                     disabled:opacity-30">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
    </motion.div>
  )
}