"""
yfinance_service.py
===================
Fetches historical OHLCV data and financial metrics using yfinance.
"""

import yfinance as yf
import pandas as pd


def fetch_history(ticker: str, period: str = "1y") -> pd.DataFrame | None:
    """
    Fetch OHLCV history for the given ticker and period.

    Args:
        ticker: Yahoo Finance ticker symbol
        period: One of "1mo", "6mo", "1y", "5y", "max"

    Returns:
        DataFrame with columns [Open, High, Low, Close, Volume] or None.
    """
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period)

        if df.empty:
            print(f"❌ yfinance returned no data for {ticker}")
            return None

        df = df[["Open", "High", "Low", "Close", "Volume"]]
        df.index = pd.to_datetime(df.index)
        df.index = df.index.tz_localize(None)  # strip tz for Plotly compatibility
        return df

    except Exception as e:
        print(f"❌ yfinance history error: {e}")
        return None


def fetch_financials(ticker: str) -> dict | None:
    """
    Fetch a comprehensive set of financial metrics using yfinance .info.

    Returns a flat dict of metrics, or None on failure.
    """
    try:
        stock = yf.Ticker(ticker)
        info  = stock.info

        # Helper to safely pull a value
        def get(key, default="N/A"):
            val = info.get(key, default)
            return val if val not in (None, "", 0) else default

        # Pull income statement / balance sheet from yfinance fast_info where possible
        metrics = {
            # ── Basic ─────────────────────────────────────────────────────
            "Company":          get("longName") or get("shortName"),
            "Sector":           get("sector"),
            "Industry":         get("industry"),
            "Currency":         get("currency"),
            "Exchange":         get("exchange"),

            # ── Valuation ─────────────────────────────────────────────────
            "Market Cap":       get("marketCap"),
            "Trailing P/E":     get("trailingPE"),
            "Forward P/E":      get("forwardPE"),
            "Price/Book":       get("priceToBook"),
            "EV/EBITDA":        get("enterpriseToEbitda"),

            # ── Dividends & Yield ─────────────────────────────────────────
            "Dividend Yield":   get("dividendYield"),
            "Payout Ratio":     get("payoutRatio"),

            # ── Risk ──────────────────────────────────────────────────────
            "Beta":             get("beta"),

            # ── Market Stats ──────────────────────────────────────────────
            "52W High":         get("fiftyTwoWeekHigh"),
            "52W Low":          get("fiftyTwoWeekLow"),
            "Volume":           get("volume"),
            "Avg Volume":       get("averageVolume"),
            "Float Shares":     get("floatShares"),

            # ── Income ────────────────────────────────────────────────────
            "Revenue (TTM)":    get("totalRevenue"),
            "Net Income":       get("netIncomeToCommon"),
            "Gross Margins":    get("grossMargins"),
            "Operating Margins":get("operatingMargins"),
            "Profit Margins":   get("profitMargins"),

            # ── Balance Sheet ─────────────────────────────────────────────
            "Total Debt":       get("totalDebt"),
            "Total Cash":       get("totalCash"),
            "Total Assets":     get("totalAssets"),
            "Debt/Equity":      get("debtToEquity"),
            "Current Ratio":    get("currentRatio"),
            "Quick Ratio":      get("quickRatio"),

            # ── Growth ────────────────────────────────────────────────────
            "Revenue Growth":   get("revenueGrowth"),
            "Earnings Growth":  get("earningsGrowth"),

            # ── Analyst ───────────────────────────────────────────────────
            "Recommendation":   get("recommendationKey"),
            "Target High":      get("targetHighPrice"),
            "Target Low":       get("targetLowPrice"),
            "Target Mean":      get("targetMeanPrice"),
        }

        return metrics

    except Exception as e:
        print(f"❌ yfinance financials error: {e}")
        return None


def fetch_intraday(ticker: str, period: str = "1d", interval: str = "5m") -> pd.DataFrame | None:
    """
    Fetch intraday OHLCV data via yfinance for 1D and 5D views.

    Args:
        ticker:   Yahoo Finance ticker symbol
        period:   "1d" or "5d"
        interval: "1m", "5m", "15m", "30m", "60m"

    Returns:
        DataFrame with columns [Open, High, Low, Close, Volume] or None.
    """
    try:
        stock = yf.Ticker(ticker)
        df = stock.history(period=period, interval=interval)

        if df.empty:
            print(f"❌ yfinance returned no intraday data for {ticker}")
            return None

        df = df[["Open", "High", "Low", "Close", "Volume"]]
        df.index = pd.to_datetime(df.index)
        df.index = df.index.tz_localize(None)
        return df

    except Exception as e:
        print(f"❌ yfinance intraday error: {e}")
        return None