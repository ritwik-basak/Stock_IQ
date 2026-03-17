import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStockData, useAIAnalysis } from '../hooks/useStockData'
import Navbar from '../components/Navbar'
import StockHeader from '../components/StockHeader'
import StockSearch from '../components/StockSearch'
import TimeframeSelector from '../components/TimeframeSelector'
import StockChart from '../components/StockChart'
import MetricsPanel from '../components/MetricsPanel'
import FinancialPanel from '../components/FinancialPanel'
import AIAnalysisPanel from '../components/AIAnalysisPanel'
import WelcomeScreen from '../components/WelcomeScreen'
import { AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const topRef = useRef(null)
  const {
    ticker, stockInfo, chartData, financials,
    timeframe, loading, chartLoading, error,
    loadStock, switchTimeframe,
  } = useStockData()

  const { messages, aiLoading, ask, clearMessages } = useAIAnalysis(ticker)

  // Scroll to top ref whenever ticker changes
  useEffect(() => {
    if (ticker && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [ticker])

  const handleSelect = (symbol, info) => {
    clearMessages()
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    loadStock(symbol, info)
  }

  const handleReset   = () => window.location.reload()
  const handleRefresh = () => { if (ticker && stockInfo) loadStock(ticker, stockInfo) }

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Navbar onReset={handleReset} />
      {/* Anchor at very top */}
      <div ref={topRef} style={{ position: 'absolute', top: 0, left: 0, height: 0, width: 0 }} />

      <main style={{ paddingTop: 60, minHeight: '100vh' }}>
        <AnimatePresence mode="wait">

          {!ticker && !loading ? (
            <motion.div key="welcome"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ height: 'calc(100vh - 60px)' }}>
              <WelcomeScreen onSelect={handleSelect} />
            </motion.div>

          ) : (
            <motion.div key={`dash-${ticker}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                  color: '#F43F5E', fontSize: 14, fontFamily: 'var(--font-data)' }}>
                  <AlertTriangle style={{ width: 16, height: 16 }} />{error}
                </div>
              )}

              {/* Header */}
              <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 16, padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <StockHeader stockInfo={stockInfo} financials={financials} loading={loading} onRefresh={handleRefresh} />
                  </div>
                  <div style={{ width: 300, flexShrink: 0 }}>
                    <StockSearch onSelect={handleSelect} variant="nav" />
                  </div>
                </div>
              </div>

              {/* MAIN GRID: left column + right column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: 16 }}>

                {/* LEFT: Chart → Key Metrics → Financial Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Chart */}
                  <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(40,65,100,0.6)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                        <span className="f-data" style={{ fontSize: 14, color: 'rgba(180,210,240,0.8)' }}>{ticker} · {timeframe}</span>
                      </div>
                      <TimeframeSelector active={timeframe} onChange={switchTimeframe} disabled={loading} />
                    </div>
                    <div style={{ height: 580 }}>
                      <StockChart chartData={chartData} ticker={ticker} timeframe={timeframe} loading={loading || chartLoading} />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 16, padding: '18px 20px' }}>
                    <div className="section-label">Key Metrics</div>
                    <MetricsPanel financials={financials} loading={loading} />
                  </div>

                  {/* Financial Data */}
                  <div style={{ background: 'rgba(8,14,26,0.9)', border: '1px solid rgba(40,65,100,0.7)', borderRadius: 16, padding: '18px 20px' }}>
                    <div className="section-label">Financial Data</div>
                    <FinancialPanel financials={financials} loading={loading} />
                  </div>
                </div>

                {/* RIGHT: AI Chatbot — sticky, matches chart height */}
                <div style={{ position: 'sticky', top: 76, alignSelf: 'flex-start' }}>
                  <AIAnalysisPanel messages={messages} aiLoading={aiLoading} onAsk={ask} ticker={ticker} />
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}