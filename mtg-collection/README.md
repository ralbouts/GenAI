# MTG Collection Manager

A local web app to manage your Magic: The Gathering collection, decks, orders, and primers.

## Features
- Visual deck gallery with commander art, bracket badge, and proxy indicator
- Deck primers: descriptions, strategies, key cards, combos, tips
- Full card collection browser with search
- Order tracking for Cardmarket and LibreProxies
- Import decks directly from Moxfield URLs

## Requirements
- Python 3.12 (managed by uv)
- Node.js 18+
- uv (`winget install astral-sh.uv`)

## Running

**Backend** (runs on http://localhost:8000):
```powershell
cd backend
uv run uvicorn main:app --reload --port 8000
```

**Frontend** (runs on http://localhost:5173):
```powershell
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack
- **Backend:** Python FastAPI + SQLite (SQLAlchemy)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Card data:** Scryfall API (free, no key required)
- **Deck import:** Moxfield (via public API)
