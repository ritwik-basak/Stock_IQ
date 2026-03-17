import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

def search_ticker(query: str) -> list[dict]:
    # Try v1 endpoint first
    urls = [
        "https://query1.finance.yahoo.com/v1/finance/search",
        "https://query2.finance.yahoo.com/v1/finance/search",
    ]
    for url in urls:
        try:
            resp = requests.get(
                url,
                params={"q": query, "quotesCount": 10, "newsCount": 0, "enableFuzzyQuery": True},
                headers=HEADERS,
                timeout=10,
            )
            resp.raise_for_status()
            data  = resp.json()
            quotes = data.get("quotes", [])
            filtered = [
                q for q in quotes
                if q.get("typeDisp") in ("Equity", "ETF", "Fund")
            ]
            if filtered:
                return filtered[:8]
        except Exception as e:
            print(f"Search attempt failed ({url}): {e}")
            continue

    # Fallback: use yfinance Search class
    try:
        import yfinance as yf
        s = yf.Search(query, max_results=10)
        quotes = s.quotes or []
        filtered = [
            q for q in quotes
            if q.get("typeDisp") in ("Equity", "ETF", "Fund") or q.get("quoteType") in ("EQUITY", "ETF")
        ]
        return filtered[:8]
    except Exception as e:
        print(f"yfinance search fallback failed: {e}")
        return []