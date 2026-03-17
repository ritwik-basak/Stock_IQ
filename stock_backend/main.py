"""
FastAPI Backend — Stock Intelligence Dashboard
"""

from dotenv import load_dotenv
load_dotenv()

import os
import math
import requests
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data_sources.ticker_search_service import search_ticker
from data_sources.yfinance_service import fetch_history, fetch_intraday, fetch_financials
from analysis.technical_indicators import calculate_indicators, get_indicator_summary


app = FastAPI(title="StockIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)


# ── Helpers ────────────────────────────────────────────────────────────────

def sanitize(val):
    """Replace NaN/Inf with None so JSON serialisation never fails."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        pass
    return val

def series_to_list(s: pd.Series):
    return [sanitize(v) for v in s.tolist()]

def df_to_chart_json(df: pd.DataFrame, ticker: str, timeframe: str) -> dict:
    dates = [str(d)[:19] for d in df.index.tolist()]
    return {
        "ticker":      ticker,
        "timeframe":   timeframe,
        "dates":       dates,
        "open":        series_to_list(df["Open"]),
        "high":        series_to_list(df["High"]),
        "low":         series_to_list(df["Low"]),
        "close":       series_to_list(df["Close"]),
        "volume":      series_to_list(df["Volume"]),
        "sma50":       series_to_list(df["SMA_50"])       if "SMA_50"       in df.columns else [],
        "sma200":      series_to_list(df["SMA_200"])      if "SMA_200"      in df.columns else [],
        "rsi":         series_to_list(df["RSI"])          if "RSI"          in df.columns else [],
        "macd":        series_to_list(df["MACD"])         if "MACD"         in df.columns else [],
        "macd_signal": series_to_list(df["MACD_signal"])  if "MACD_signal"  in df.columns else [],
        "macd_hist":   series_to_list(df["MACD_hist"])    if "MACD_hist"    in df.columns else [],
    }

def build_ai_context(ticker: str, indicators: dict, metrics: dict | None) -> str:
    ctx = f"STOCK: {ticker}\n\n=== TECHNICAL INDICATORS ===\n"
    for k, v in indicators.items():
        ctx += f"{k:<22}: {v}\n"
    ctx += "\n=== FINANCIAL METRICS ===\n"
    if metrics:
        for k, v in metrics.items():
            ctx += f"{k:<22}: {v}\n"
    else:
        ctx += "Not available.\n"
    return ctx


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/search")
def search(q: str = Query(..., min_length=1)):
    results = search_ticker(q)
    if not results:
        return {"results": []}
    return {
        "results": [
            {
                "symbol":   r["symbol"],
                "name":     r.get("shortname", r["symbol"]),
                "exchange": r.get("exchDisp", ""),
                "type":     r.get("typeDisp", "Equity"),
            }
            for r in results
        ]
    }


@app.get("/chart")
def chart(
    ticker:    str = Query(...),
    timeframe: str = Query("1Y"),
):
    PERIOD_MAP = {"1M": "1mo", "6M": "6mo", "1Y": "1y", "5Y": "5y", "MAX": "max"}

    if timeframe == "1D":
        df = fetch_intraday(ticker, period="1d", interval="5m")
    elif timeframe == "5D":
        df = fetch_intraday(ticker, period="5d", interval="15m")
    else:
        period = PERIOD_MAP.get(timeframe, "1y")
        df = fetch_history(ticker, period=period)

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"No chart data for {ticker}")

    df = calculate_indicators(df)
    return df_to_chart_json(df, ticker, timeframe)


@app.get("/financials")
def financials(ticker: str = Query(...)):
    metrics = fetch_financials(ticker)
    if not metrics:
        raise HTTPException(status_code=404, detail=f"No financial data for {ticker}")

    # Inject current price — try multiple sources
    try:
        stock = yf.Ticker(ticker)
        fi    = stock.fast_info

        # Try fast_info attributes first
        price = getattr(fi, "last_price", None) or getattr(fi, "regular_market_price", None)

        # Fallback to history if fast_info fails
        if not price:
            hist  = stock.history(period="2d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])

        # Fallback to info dict
        if not price:
            info  = stock.info
            price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")

        metrics["Current Price"] = sanitize(price)

        # Daily % change using last 2 days history — most reliable method
        try:
            hist2 = stock.history(period="5d")
            if len(hist2) >= 2:
                today_close = float(hist2["Close"].iloc[-1])
                prev_close  = float(hist2["Close"].iloc[-2])
                if prev_close > 0:
                    metrics["Period Return"] = round((today_close - prev_close) / prev_close * 100, 2)
                else:
                    metrics["Period Return"] = None
            else:
                metrics["Period Return"] = None
        except Exception:
            metrics["Period Return"] = None
    except Exception:
        pass

    # Sanitize floats
    cleaned = {}
    for k, v in metrics.items():
        if isinstance(v, float):
            cleaned[k] = sanitize(v)
        else:
            cleaned[k] = v
    return cleaned


class AIRequest(BaseModel):
    ticker:   str
    question: str


@app.post("/ai-analysis")
def ai_analysis(body: AIRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured in .env")

    # Build context from local data
    indicators = {}
    metrics    = {}
    try:
        df = fetch_history(body.ticker, period="1y")
        if df is not None and not df.empty:
            df = calculate_indicators(df)
            indicators = get_indicator_summary(df)
        metrics = fetch_financials(body.ticker) or {}
    except Exception as e:
        print(f"Context build error: {e}")

    context = build_ai_context(body.ticker, indicators, metrics)

    prompt = (
        f"You are a senior equity analyst with access to real-time web search.\n\n"
        f"The user is asking about stock: {body.ticker}\n\n"
        f"Here is the locally available data for this stock:\n{context}\n\n"
        f"QUESTION: {body.question}\n\n"
        f"Instructions:\n"
        f"- If the local data above is sufficient to answer, use it directly.\n"
        f"- If the local data is missing, incomplete, or the question requires "
        f"information not in the data (e.g. comparing to another company, recent news, "
        f"sector trends, competitor analysis), use your Google Search tool to find "
        f"the most current and relevant information.\n"
        f"- Always give a clear, professional, specific answer in 4-8 sentences.\n"
        f"- Reference actual numbers and facts wherever possible.\n"
        f"- If you used web search, naturally mention the source or recency of the info."
    )

    def call_gemini(use_search: bool):
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 1.0,
                "maxOutputTokens": 8192,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        if use_search:
            payload["tools"] = [{"google_search": {}}]
        return requests.post(
            GEMINI_URL,
            params={"key": api_key},
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=60,
        )

    try:
        resp = call_gemini(use_search=True)
        resp.raise_for_status()
        data  = resp.json()
        parts = data["candidates"][0]["content"]["parts"]
        answer = " ".join(p["text"].strip() for p in parts if "text" in p)
        # Only flag as web search if grounding chunks are actually present
        candidate = data["candidates"][0]
        grounding_meta = candidate.get("groundingMetadata", {})
        grounding_chunks = grounding_meta.get("groundingChunks", [])
        grounding_used = len(grounding_chunks) > 0
        return {"answer": answer, "web_search_used": grounding_used}

    except requests.HTTPError as e:
        err_text = e.response.text[:300] if e.response else "no response"
        print(f"Gemini HTTP error {e.response.status_code}: {err_text}")
        # Free-tier keys may not support google_search tool — fall back silently
        if e.response.status_code in (400, 403):
            try:
                resp2 = call_gemini(use_search=False)
                resp2.raise_for_status()
                data2  = resp2.json()
                answer = data2["candidates"][0]["content"]["parts"][0]["text"].strip()
                return {"answer": answer, "web_search_used": False}
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Gemini fallback error: {str(e2)}")
        raise HTTPException(status_code=502, detail=f"Gemini API error {e.response.status_code}: {err_text}")
    except Exception as e:
        import traceback
        print(f"Gemini exception: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")



@app.get("/tickers")
def live_tickers():
    """Fetch real-time price + daily change for a fixed watchlist — parallel."""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    from datetime import datetime, timezone, timedelta

    WATCHLIST = [
        "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "WIPRO.NS",
        "AAPL", "TSLA", "MSFT", "NVDA", "AMZN",
    ]

    def fetch_one(symbol):
        try:
            t  = yf.Ticker(symbol)
            fi = t.fast_info
            price = getattr(fi, "last_price", None) or getattr(fi, "regular_market_price", None)
            prev  = getattr(fi, "previous_close", None) or getattr(fi, "regular_market_previous_close", None)
            if not price:
                hist = t.history(period="2d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                    prev  = float(hist["Close"].iloc[-2]) if len(hist) > 1 else None
            if price and prev and prev > 0:
                change_pct = round((price - prev) / prev * 100, 2)
            else:
                change_pct = None
            if price:
                return {
                    "symbol":     symbol,
                    "price":      round(float(price), 2),
                    "change_pct": change_pct,
                    "up":         change_pct >= 0 if change_pct is not None else None,
                }
        except Exception:
            pass
        return None

    results = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_one, s): s for s in WATCHLIST}
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)

    # Sort to match original watchlist order
    order = {s: i for i, s in enumerate(WATCHLIST)}
    results.sort(key=lambda r: order.get(r["symbol"], 99))

    IST = timezone(timedelta(hours=5, minutes=30))
    return {
        "tickers":    results,
        "fetched_at": datetime.now(IST).strftime("%d %b %Y, %I:%M %p IST"),
        "count":      len(results),
    }


@app.get("/compare")
def compare_stocks(ticker1: str = Query(...), ticker2: str = Query(...)):
    """Fetch chart + financials for two stocks for comparison."""
    from concurrent.futures import ThreadPoolExecutor

    def get_stock_data(ticker):
        try:
            t   = yf.Ticker(ticker)
            df  = t.history(period="1y")
            if df is None or df.empty:
                return None
            # Normalize to % change from first day
            first = float(df["Close"].iloc[0])
            df["Normalized"] = ((df["Close"] - first) / first * 100).round(2)
            fi    = t.fast_info
            price = getattr(fi, "last_price", None) or getattr(fi, "regular_market_price", None)
            if not price:
                price = float(df["Close"].iloc[-1])
            prev  = getattr(fi, "previous_close", None)
            change_pct = round((price - prev) / prev * 100, 2) if price and prev and prev > 0 else None
            info  = t.info
            return {
                "ticker":      ticker,
                "name":        info.get("longName") or info.get("shortName", ticker),
                "dates":       [str(d)[:10] for d in df.index.tolist()],
                "close":       [sanitize(v) for v in df["Close"].tolist()],
                "normalized":  [sanitize(v) for v in df["Normalized"].tolist()],
                "current_price": sanitize(price),
                "change_pct":  change_pct,
                "metrics": {
                    "Market Cap":    sanitize(info.get("marketCap")),
                    "Trailing P/E":  sanitize(info.get("trailingPE")),
                    "Forward P/E":   sanitize(info.get("forwardPE")),
                    "Revenue (TTM)": sanitize(info.get("totalRevenue")),
                    "Profit Margin": sanitize(info.get("profitMargins")),
                    "Revenue Growth":sanitize(info.get("revenueGrowth")),
                    "Beta":          sanitize(info.get("beta")),
                    "Dividend Yield":sanitize(info.get("dividendYield")),
                    "52W High":      sanitize(info.get("fiftyTwoWeekHigh")),
                    "52W Low":       sanitize(info.get("fiftyTwoWeekLow")),
                    "Sector":        info.get("sector", "N/A"),
                    "Industry":      info.get("industry", "N/A"),
                }
            }
        except Exception as e:
            print(f"Compare error for {ticker}: {e}")
            return None

    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = [ex.submit(get_stock_data, ticker1), ex.submit(get_stock_data, ticker2)]
        results = [f.result() for f in futures]

    if not results[0]:
        raise HTTPException(status_code=404, detail=f"No data for {ticker1}")
    if not results[1]:
        raise HTTPException(status_code=404, detail=f"No data for {ticker2}")

    return {"stock1": results[0], "stock2": results[1]}

@app.get("/health")
def health():
    return {
        "status":     "ok",
        "gemini_key": bool(os.getenv("GEMINI_API_KEY")),
    }