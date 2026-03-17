# StockIQ — AI Stock Intelligence Dashboard

A full-stack AI-powered stock analysis dashboard.

## Project Structure
```
StockIQ_Project/
├── stock_backend/    ← FastAPI backend
└── stock_frontend/   ← React + Vite frontend
```

## Quick Start

### 1. Backend
```bash
cd stock_backend
pip install -r requirements.txt
# Create .env file with: GEMINI_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd stock_frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Tech Stack
**Frontend:** React, Vite, Tailwind CSS, Framer Motion, Plotly.js
**Backend:** FastAPI, Python, yfinance, Pandas
**AI:** Gemini 2.5 Flash + Google Search Grounding
