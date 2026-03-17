import { useState, useCallback } from 'react'
import { fetchChartData, fetchFinancials, runAIAnalysis } from '../services/api'

export const useStockData = () => {
  const [ticker, setTicker]         = useState(null)
  const [stockInfo, setStockInfo]   = useState(null)
  const [chartData, setChartData]   = useState(null)
  const [financials, setFinancials] = useState(null)
  const [timeframe, setTimeframe]   = useState('1Y')
  const [loading, setLoading]       = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError]           = useState(null)

  const loadStock = useCallback(async (symbol, info) => {
    // Aggressive scroll reset — fire multiple times
    const scrollReset = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    scrollReset()
    setTimeout(scrollReset, 0)
    setTimeout(scrollReset, 50)
    setTimeout(scrollReset, 150)

    setTicker(symbol)
    setStockInfo(info)
    setError(null)
    setLoading(true)

    try {
      const [chart, fins] = await Promise.all([
        fetchChartData(symbol, '1Y'),
        fetchFinancials(symbol),
      ])
      setChartData(chart)
      setFinancials(fins)
      setTimeframe('1Y')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load stock data')
    } finally {
      setLoading(false)
      // One more reset after data loads
      setTimeout(scrollReset, 0)
    }
  }, [])

  const switchTimeframe = useCallback(async (tf) => {
    if (!ticker) return
    setTimeframe(tf)
    setChartLoading(true)
    try {
      const chart = await fetchChartData(ticker, tf)
      setChartData(chart)
    } catch {
      setError('Failed to load chart data')
    } finally {
      setChartLoading(false)
    }
  }, [ticker])

  return { ticker, stockInfo, chartData, financials, timeframe, loading, chartLoading, error, loadStock, switchTimeframe }
}

export const useAIAnalysis = (ticker) => {
  const [messages, setMessages]   = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const ask = useCallback(async (question) => {
    if (!ticker || !question.trim()) return
    setAiLoading(true)
    setMessages(prev => [...prev, { role: 'user', text: question }])
    try {
      const data = await runAIAnalysis(ticker, question)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.answer,
        webSearch: data.web_search_used || false,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Analysis failed. Please try again.', error: true }])
    } finally {
      setAiLoading(false)
    }
  }, [ticker])

  const clearMessages = () => setMessages([])
  return { messages, aiLoading, ask, clearMessages }
}