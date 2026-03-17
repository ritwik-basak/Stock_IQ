"""
technical_indicators.py
=======================
Calculates SMA-50, SMA-200, RSI-14, and MACD on a price DataFrame.
All calculations use pure pandas — no extra TA libraries required.
"""

import pandas as pd


def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds technical indicator columns to the OHLCV DataFrame.

    New columns added:
        SMA_50   — 50-period Simple Moving Average
        SMA_200  — 200-period Simple Moving Average
        RSI      — 14-period Relative Strength Index
        MACD     — MACD line (EMA12 - EMA26)
        MACD_signal — 9-period EMA of MACD
        MACD_hist   — MACD histogram

    Args:
        df: DataFrame with at minimum a "Close" column.

    Returns:
        The same DataFrame with indicator columns appended.
    """
    close = df["Close"]
    n = len(df)

    # ── SMA ───────────────────────────────────────────────────────────────
    df["SMA_50"]  = close.rolling(window=50,  min_periods=1).mean()
    df["SMA_200"] = close.rolling(window=200, min_periods=1).mean()

    # ── RSI ───────────────────────────────────────────────────────────────
    df["RSI"] = _rsi(close, period=14)

    # ── MACD ──────────────────────────────────────────────────────────────
    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    df["MACD"]        = ema12 - ema26
    df["MACD_signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACD_hist"]   = df["MACD"] - df["MACD_signal"]

    return df


def _rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Wilder's RSI implementation using exponential moving averages."""
    delta  = series.diff()
    gain   = delta.clip(lower=0)
    loss   = (-delta).clip(lower=0)

    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    rs  = avg_gain / avg_loss.replace(0, 1e-10)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def get_indicator_summary(df: pd.DataFrame) -> dict:
    """
    Extract the latest indicator values as a plain dict.
    Used to build the AI analysis context.
    """
    last = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else last

    macd_crossover = None
    if prev["MACD"] < prev["MACD_signal"] and last["MACD"] > last["MACD_signal"]:
        macd_crossover = "bullish"
    elif prev["MACD"] > prev["MACD_signal"] and last["MACD"] < last["MACD_signal"]:
        macd_crossover = "bearish"

    return {
        "current_price":  round(float(last["Close"]), 4),
        "sma_50":         round(float(last["SMA_50"]), 4),
        "sma_200":        round(float(last["SMA_200"]), 4),
        "rsi":            round(float(last["RSI"]), 2) if pd.notna(last["RSI"]) else None,
        "macd":           round(float(last["MACD"]), 4),
        "macd_signal":    round(float(last["MACD_signal"]), 4),
        "macd_hist":      round(float(last["MACD_hist"]), 4),
        "macd_crossover": macd_crossover,
        "price_vs_sma50":  "above" if last["Close"] > last["SMA_50"]  else "below",
        "price_vs_sma200": "above" if last["Close"] > last["SMA_200"] else "below",
        "period_high":    round(float(df["High"].max()), 4),
        "period_low":     round(float(df["Low"].min()), 4),
        "period_return_pct": round(
            (float(df["Close"].iloc[-1]) - float(df["Close"].iloc[0]))
            / float(df["Close"].iloc[0]) * 100, 2
        ),
    }