import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// ── Stock Search ─────────────────────────────────────────────────────────────
export const searchStocks = async (query) => {
  const { data } = await api.get('/search', { params: { q: query } })
  return data
}

// ── Chart Data ───────────────────────────────────────────────────────────────
export const fetchChartData = async (ticker, timeframe) => {
  const { data } = await api.get('/chart', { params: { ticker, timeframe } })
  return data
}

// ── Financial Metrics ────────────────────────────────────────────────────────
export const fetchFinancials = async (ticker) => {
  const { data } = await api.get('/financials', { params: { ticker } })
  return data
}

// ── AI Analysis ──────────────────────────────────────────────────────────────
export const runAIAnalysis = async (ticker, question) => {
  const { data } = await api.post('/ai-analysis', { ticker, question })
  return data
}

// ── Full Stock Data (chart + financials in one call) ─────────────────────────
export const fetchStockData = async (ticker, timeframe = '1Y') => {
  const [chart, financials] = await Promise.all([
    fetchChartData(ticker, timeframe),
    fetchFinancials(ticker),
  ])
  return { chart, financials }
}

// ── Live Ticker Tape ─────────────────────────────────────────────────────────
export const fetchLiveTickers = async () => {
  const { data } = await api.get('/tickers')
  return data  // returns { tickers, fetched_at, count }
}

// ── Stock Comparison ─────────────────────────────────────────────────────────
export const compareStocks = async (ticker1, ticker2) => {
  const { data } = await api.get('/compare', { params: { ticker1, ticker2 } })
  return data
}