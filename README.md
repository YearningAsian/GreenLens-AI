# 🌿 GreenLens AI

**Closing the Loop on Construction Waste — Starting in the Southeast**

> Domain: letsBuildGreen.tech

## Mission

The U.S. sends **600 million tons** of waste to landfills every year. Most of it is recyclable or compostable, but without fast, on-the-spot identification, it all gets dumped together.

GreenLens AI puts a free, AI-powered material scanner in the hands of **anyone who cares** — neighborhood volunteers, independent haulers, and city officials — so that **no reusable material ends up as trash**. We pair instant classification with real routing to local recycling centers, and give community leaders a live dashboard to track diversion rates and carbon offsets — turning everyday action into measurable impact.

## Overview

GreenLens AI is a dual-platform solution designed to eliminate waste starting with Georgia and Tennessee. Using Gemini 2.5 Flash, community members — whether Neighborhood Volunteers, Independent Haulers, or Government Liaisons — get an instant mobile "material scanner" to categorize debris and route it to local recycling centers. Community leaders get a web dashboard to track city-wide carbon offsets and sustainability impact.

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
├── backend/
│   ├── main.py              # FastAPI + Gemini AI server
│   ├── scraper.py           # Overpass API recycling center scraper
│   └── training/
│       ├── dataset/          # Waste classification images (not committed)
│       │   ├── train/
│       │   │   ├── organic/
│       │   │   └── recyclable/
│       │   └── test/
│       │       ├── organic/
│       │       └── recyclable/
│       ├── finetune.py       # Gemini fine-tuning script
│       └── evaluate.py       # Model evaluation script
├── mobile/                   # Expo React Native mobile app
├── web/                      # Next.js dashboard + Convex
│   └── convex/               # Convex schema & functions
└── README.md
```

## Dataset

We fine-tune on the [Waste Classification Data](https://www.kaggle.com/datasets/techsash/waste-classification-data) dataset from Kaggle (by Sashaank Sekar). It contains **25,077 labeled images** split into organic and recyclable categories.

To set up locally:
1. Download the dataset from the link above
2. Extract into `backend/training/dataset/` so the folder structure matches the tree above
3. Run `python backend/training/finetune.py`

> The dataset is excluded from version control via `.gitignore`.

## License
MIT
