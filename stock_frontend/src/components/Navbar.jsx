import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'

export default function Navbar({ onReset }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.85)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        height: 60, display: 'flex', alignItems: 'center', padding: '0 24px',
      }}
    >
      <motion.button
        onClick={onReset}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <motion.div
          whileHover={{ boxShadow: '0 0 24px rgba(6,182,212,0.5)' }}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Activity style={{ width: 17, height: 17, color: '#06B6D4', filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.8))' }} />
        </motion.div>
        <span className="f-display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>
          <span style={{ color: '#fff' }}>Stock</span>
          <span style={{ color: '#06B6D4', textShadow: '0 0 14px rgba(6,182,212,0.7)' }}>IQ</span>
        </span>
        <span className="f-data" style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 6,
          background: 'rgba(6,182,212,0.08)', color: '#06B6D4',
          border: '1px solid rgba(6,182,212,0.2)',
        }}>BETA</span>
      </motion.button>
    </motion.header>
  )
}