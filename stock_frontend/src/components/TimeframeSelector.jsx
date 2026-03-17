import { motion } from 'framer-motion'

const TIMEFRAMES = ['1D', '5D', '1M', '6M', '1Y', '5Y', 'MAX']

export default function TimeframeSelector({ active, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {TIMEFRAMES.map((tf) => (
        <motion.button
          key={tf}
          onClick={() => !disabled && onChange(tf)}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          disabled={disabled}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 ${
            active === tf
              ? 'text-accent-cyan'
              : 'text-text-muted hover:text-text-secondary'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {active === tf && (
            <motion.div
              layoutId="timeframe-pill"
              className="absolute inset-0 rounded-lg border border-accent-cyan/40"
              style={{ background: 'rgba(6, 182, 212, 0.08)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tf}</span>
        </motion.button>
      ))}
    </div>
  )
}
