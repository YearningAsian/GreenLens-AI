# 🌿 GreenLens AI

**Closing the Loop on Georgia Construction Waste**

> Domain: letsBuildGreen.tech

## Overview

GreenLens AI is a dual-platform solution designed to eliminate construction waste in Georgia's landfills. Using Gemini 2.5 Flash, frontline workers get an instant mobile "material scanner" to categorize debris and route it to local recycling centers. Executives get a web dashboard to track city-wide carbon offsets and sustainability impact.

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | Expo / React Native | Native iOS/Android app for scanning debris |
| Web | Next.js / Recharts | Analytics dashboard for sustainability metrics |
| Database | Convex | Real-time backend sync |
| Backend / AI | FastAPI (Python) | Bridge to Google Gemini 2.5 Flash |
| Styling | NativeWind / Tailwind | Consistent design system |

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Expo CLI
- Convex account

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Web Dashboard
```bash
cd web
npm install
npm run dev
```

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

### Convex
```bash
cd web
npx convex dev
```

## Project Structure
```
GreenLens-AI/
├── backend/         # FastAPI + Gemini AI server
├── mobile/          # Expo React Native mobile app
├── web/             # Next.js dashboard + Convex
│   └── convex/      # Convex schema & functions
└── README.md
```

## License
MIT
