import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { motion } from 'framer-motion'
import LoadingSkeleton from './LoadingSkeleton'

const C = {
  bull: '#10B981', bear: '#F43F5E',
  sma50: '#F59E0B', sma200: '#A78BFA',
  macd: '#38BDF8', signal: '#FB7185', rsi: '#34D399',
  grid: 'rgba(40,65,100,0.5)', paper: 'rgba(0,0,0,0)', plot: 'rgba(0,0,0,0)',
}

export default function StockChart({ chartData, ticker, timeframe, loading }) {
  const { traces, layout } = useMemo(() => {
    if (!chartData?.dates) return { traces: [], layout: {} }
    const { dates, open, high, low, close, volume, sma50, sma200, rsi, macd, macd_signal, macd_hist } = chartData

    const axisFont = { family: 'Courier Prime, monospace', size: 12, color: '#B8D0E8' }

    const candlestick = {
      type: 'candlestick', x: dates, open, high, low, close, name: ticker,
      increasing: { line: { color: C.bull, width: 1 }, fillcolor: C.bull },
      decreasing: { line: { color: C.bear, width: 1 }, fillcolor: C.bear },
      xaxis: 'x', yaxis: 'y',
    }
    const sma50Trace = {
      type: 'scatter', mode: 'lines', x: dates, y: sma50, name: 'SMA 50',
      line: { color: C.sma50, width: 1.5 }, xaxis: 'x', yaxis: 'y',
    }
    const sma200Trace = {
      type: 'scatter', mode: 'lines', x: dates, y: sma200, name: 'SMA 200',
      line: { color: C.sma200, width: 1.5, dash: 'dot' }, xaxis: 'x', yaxis: 'y',
    }
    const histColors = (macd_hist || []).map(v => v >= 0 ? C.bull : C.bear)
    const macdHist = { type: 'bar', x: dates, y: macd_hist, name: 'MACD Hist', marker: { color: histColors }, xaxis: 'x', yaxis: 'y3', showlegend: false }
    const macdLine = { type: 'scatter', mode: 'lines', x: dates, y: macd, name: 'MACD', line: { color: C.macd, width: 1.5 }, xaxis: 'x', yaxis: 'y3' }
    const signalLine = { type: 'scatter', mode: 'lines', x: dates, y: macd_signal, name: 'Signal', line: { color: C.signal, width: 1.5 }, xaxis: 'x', yaxis: 'y3' }
    const volColors = close.map((c, i) => i === 0 ? C.bull : c >= close[i-1] ? C.bull + '80' : C.bear + '80')
    const volTrace = { type: 'bar', x: dates, y: volume, name: 'Volume', marker: { color: volColors }, xaxis: 'x', yaxis: 'y2', showlegend: false }
    const rsiTrace = { type: 'scatter', mode: 'lines', x: dates, y: rsi, name: 'RSI', line: { color: C.rsi, width: 1.5 }, xaxis: 'x', yaxis: 'y4' }

    const axisStyle = {
      gridcolor: C.grid, zeroline: false,
      tickfont: axisFont,
      linecolor: 'rgba(40,65,100,0.6)',
      titlefont: { family: 'Courier Prime, monospace', size: 12, color: '#6A8BAA' },
    }

    const layout = {
      paper_bgcolor: C.paper, plot_bgcolor: C.plot,
      font: { family: 'Courier Prime, monospace', size: 12, color: '#B8D0E8' },
      margin: { l: 62, r: 20, t: 10, b: 35 },
      legend: {
        orientation: 'h', x: 0, y: 1.06,
        font: { family: 'Courier Prime, monospace', size: 12, color: '#B8D0E8' },
        bgcolor: 'transparent',
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0D1B2E', bordercolor: '#1E3A5F',
        font: { family: 'Courier Prime, monospace', size: 13, color: '#F0F6FF' },
      },
      dragmode: 'pan',
      xaxis:  { ...axisStyle, rangeslider: { visible: false }, domain: [0,1] },
      yaxis:  { ...axisStyle, domain: [0.42, 1],    title: { text: 'Price', font: { size: 12 } } },
      yaxis2: { ...axisStyle, domain: [0.28, 0.40], title: { text: 'Vol',   font: { size: 12 } } },
      yaxis3: { ...axisStyle, domain: [0.14, 0.26], title: { text: 'MACD',  font: { size: 12 } } },
      yaxis4: { ...axisStyle, domain: [0.00, 0.12], title: { text: 'RSI',   font: { size: 12 } }, range: [0, 100] },
    }

    return { traces: [candlestick, sma50Trace, sma200Trace, volTrace, macdHist, macdLine, signalLine, rsiTrace], layout }
  }, [chartData, ticker])

  if (loading) return <LoadingSkeleton type="chart" />
  if (!chartData) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ width: '100%', height: '100%' }}>
      <Plot
        data={traces} layout={layout}
        config={{ displayModeBar: true, modeBarButtonsToRemove: ['toImage','sendDataToCloud','editInChartStudio','resetScale2d'], displaylogo: false, responsive: true, scrollZoom: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </motion.div>
  )
}