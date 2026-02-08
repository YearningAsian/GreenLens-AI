# 🌿 GreenLens AI

> **AI-Powered Waste Classification & Community Impact Tracking**  
> Domain: letsBuildGreen.tech

---

## 👥 Team

**Colin Onevathana** — Full-Stack Developer  
*Georgia Institute of Technology*

---

## 🎯 Project Purpose

GreenLens AI addresses the United States' **600 million tons of annual landfill waste** problem by making waste classification accessible to everyone. The project provides:

- **AI-Powered Mobile Scanner** — Users photograph waste materials and receive instant AI classification (recyclable, organic, or non-recyclable) using Google Gemini 2.5 Flash
- **Real-Time Web Dashboard** — City leaders track waste diversion rates, CO₂ offsets, and community impact metrics
- **Recycling Center Routing** — Automatic GPS directions to nearest facilities accepting each material type
- **Gamification System** — XP, levels, badges, and leaderboards to encourage sustainable behavior
- **Community Goals** — Shared city and state targets for waste diversion

**Target:** Divert 1+ million pounds of waste from landfills across Georgia and Tennessee by 2027, preventing 500+ tons of CO₂ emissions.

---

## 🛠️ Tools Utilized

### **Frontend (Web Dashboard)**
- **Next.js 16.1.6** — React framework with static site generation
- **React 19.2.4** — UI component library
- **Tailwind CSS 4.1.18** — Utility-first CSS framework
- **Recharts 3.7.0** — Data visualization charts
- **Leaflet 1.9.4** + **React Leaflet 5.0** — Interactive maps
- **jsPDF 4.1.0** — PDF report generation

### **Mobile App**
- **Expo 54** — React Native framework for iOS/Android
- **React Native 0.81.5** — Cross-platform mobile development
- **Expo Camera 17.0.10** — Camera access for scanning
- **Expo Location 19.0.8** — GPS coordinates
- **React Native Maps 1.20.1** — Map integration
- **NativeWind 4.1.0** — Tailwind for React Native

### **Backend**
- **FastAPI 0.115.0** — Python web framework
- **Uvicorn 0.30.6** — ASGI server
- **Google Gemini 2.5 Flash** — AI vision model for waste classification
- **Python Pillow 10.4.0** — Image processing

### **Database**
- **Convex 1.31.7** — Real-time serverless database

### **Development Tools**
- **TypeScript 5.9.3** — Type safety
- **Git** — Version control
- **npm/npx** — Package management

---

## ⚠️ Major Problems & How We Overcame Them

### **1. AI Model Inaccuracies**
**Problem:** Gemini 2.5 Flash occasionally misassigned ambiguous materials (wet cardboard, mixed loads, contaminated recyclables) bad weights. Initial accuracy was ~75%, with confidence scores often misleading. This undermined the core value proposition of instant, trustworthy waste identification.

**Solution:** Built a comprehensive corrections feedback loop system. Users can correct incorrect classifications or weights through a dedicated interface. Corrections are stored in `corrections.json` (last 200 entries) and dynamically injected as few-shot examples into every Gemini prompt. Added confidence scoring (0-100) to flag low-certainty predictions for manual review.

### **2. How to measure Waste Recycling?**
**Problem:** There needed to be a standard way to measure the impact of recycling waste.

**Solution:** Standardized on **EPA WARM Model v16** (Waste Reduction Model). Implemented weighted average CO₂ factors: recyclable materials (1.02 kg/lb for metals, plastics, glass, cardboard), organic waste (0.34 kg/lb accounting for composting vs. landfill methane), and non-recyclable (0.05 kg/lb proper disposal credit). Documented full methodology in code comments and dashboard tooltips for transparency, making all impact claims auditable.

---

## 🙏 Credits & Framework Acknowledgments

This project utilizes the following public frameworks and APIs:

### **Frameworks & Libraries**
- **[Google Gemini 2.5 Flash](https://ai.google.dev/)** — AI vision model for waste classification
- **[Convex](https://convex.dev)** — Real-time serverless database
- **[FastAPI](https://fastapi.tiangolo.com)** — Python web framework
- **[Next.js](https://nextjs.org)** — React framework by Vercel
- **[Expo](https://expo.dev)** — React Native framework
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first CSS framework
- **[Recharts](https://recharts.org)** — React charting library
- **[Leaflet](https://leafletjs.com)** — Interactive maps library

### **APIs & Services**
- **[Overpass API](https://overpass-api.de)** — OpenStreetMap recycling center data
- **[DiceBear Avataaars](https://dicebear.com)** — Profile picture generation
- **[Google Maps API](https://developers.google.com/maps)** — Geocoding and routing
- **[EPA WARM Model v16](https://www.epa.gov/warm)** — CO₂ emission calculation methodology

### **Data Sources**
- **[Waste Classification Dataset](https://www.kaggle.com/datasets/techsash/waste-classification-data)** by Sashaank Sekar — 25,077 labeled images (Kaggle)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm/npx
- Convex account ([convex.dev](https://convex.dev))
- Google Gemini API key ([ai.google.dev](https://ai.google.dev))

---

### **1. Backend Setup**

Start the Python FastAPI server that handles AI waste classification:

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
echo "CONVEX_URL=https://your-deployment.convex.cloud" >> .env

# Start server
uvicorn main:app --reload --host 0.0.0.0
```

Server runs on `http://localhost:8000`

---

### **2. Database Setup (Convex)**

Configure the real-time database and seed demo data:

```bash
cd web

# Install dependencies
npm install

# Initialize Convex (follow prompts to create deployment)
npx convex dev

# Seed demo data (50 users, 299 scans, badges, etc.)
npx convex run seed:clearAllData
npx convex run seed:seedDemoData
```

Convex dashboard: `https://dashboard.convex.dev`

---

### **3. Frontend (Web Dashboard) Setup**

Start the Next.js analytics dashboard:

```bash
cd web

# Start development server
npm run dev
```

Dashboard runs on `http://localhost:3000`

**Production Build:**
```bash
npm run build
# Deploy 'out/' directory to Vercel/Netlify/Cloudflare Pages
```              # Python FastAPI server
│   ├── main.py          # Gemini AI integration + endpoints
│   ├── scraper.py       # Recycling center data scraper
│   └── requirements.txt
│
├── mobile/              # React Native mobile app
│   ├── app/
│   │   └── (tabs)/      # Scan, Impact, Centers screens
│   └── src/
│       ├── components/
│       ├── context/     # Auth state management
│       └── services/    # API client
│
├── web/                 # Next.js web dashboard
│   ├── convex/          # Database schema + functions
│   │   ├── schema.ts    # 12 tables definition
│   │   ├── users.ts
│   │   ├── scans.ts
│   │   └── seed.ts      # Demo data
│   └── src/
│       ├── app/         # Dashboard, Scans, Reports pages
│       └── components/  # Sidebar, Charts, Tables
│
└── README.md
```

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.ectory
│   │   │   ├── reports/        # ESG report generator
│   │   │   └── heatmaps/       # Interactive maps
│   │   ├── components/
│   │   │   ├── Sidebar.tsx     # Navigation menu
│   │   │   ├── LeaderboardPanel.tsx
│   │   │   └── RecentScans.tsx
│   │   └── context/
│   │       └── StateContext.tsx # GA/TN toggle
│   ├── package.json
│   ├── next.config.mjs
│   └── tailwind.config.ts
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 📧 Contact

**Colin Onevathana**  
Email: business@onecolin.dev 
LinkedIn: [linkedin.com/in/onecolin](https://linkedin.com/in/onecolin)  
---

**Built with 💚 for a sustainable future**
