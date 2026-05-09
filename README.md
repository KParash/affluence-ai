# AffluenceAI — Influencer Affiliate Sales & Payment Tracking Platform

> AI-powered platform to track influencer-driven affiliate sales, manage payments, and optimize ROI with intelligent insights.

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Express.js-green)
![Database](https://img.shields.io/badge/Database-SQLite-003B57)
![AI](https://img.shields.io/badge/AI-Statistical%20Models-purple)

---

## 🌟 Features

### Core
- **Affiliate Tracking** — Unique referral codes/links, click & conversion tracking
- **Payment Management** — Full lifecycle (Pending → Approved → Paid), CSV export
- **Visual Dashboard** — Real-time KPIs, line charts, bar charts, pie charts
- **Role-Based Access** — Admin, Influencer, and Finance team views

### 🤖 AI Features
1. **Sales Prediction** — Linear regression + weighted moving average to forecast 7/14/30 day revenue with confidence intervals
2. **Performance Insights** — AI-generated observations like "Performs 2.3x better on Saturdays" and "Low conversion despite high clicks"
3. **Fraud Detection** — Z-score anomaly detection for click spikes, duplicate IP detection, risk scoring per influencer

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8, Recharts, Framer Motion, Lucide Icons |
| Backend | Node.js 26 + Express.js |
| Database | SQLite (sql.js — pure JS WASM) |
| Auth | JWT + bcrypt |
| AI | Custom statistical models (linear regression, Z-score) |

---

## 📁 Project Structure

```
SaaS/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Layout, shared components
│   │   ├── lib/               # API client, Auth context
│   │   ├── pages/             # All page components
│   │   └── index.css          # Design system
│   └── package.json
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── db/                # Database schema, seed data
│   │   ├── middleware/        # JWT auth
│   │   ├── routes/            # API endpoints
│   │   └── services/          # AI engine
│   └── package.json
└── package.json               # Root workspace
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+ (tested with Node 26)
- npm

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd SaaS

# Install all dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..
npm install

# Seed the database with demo data
cd server && node src/db/seed.js && cd ..
```

### Running

```bash
# Terminal 1: Start the API server
cd server && npm run dev
# → http://localhost:3001

# Terminal 2: Start the frontend
cd client && npm run dev
# → http://localhost:5173
```

Or run both together:
```bash
npm run dev
```

### Production Deployment

The project is configured for seamless deployment as a full-stack monorepo. The Express backend serves the React frontend statically.

#### Deploy with Render (Recommended for persistent SQLite)
1. Fork or push this repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click "New" -> "Blueprint" and connect the repository.
4. Render will automatically detect the `render.yaml` file, provision a persistent disk for the database, and deploy the full stack.

#### Deploy with Docker
You can deploy anywhere using the provided `Dockerfile`.

```bash
# Build the Docker image
docker build -t affluenceai .

# Run the container (maps port 3001 to host and persists DB data)
docker run -p 3001:3001 -v $(pwd)/server/data:/app/server/data affluenceai
```
*(Access the app at http://localhost:3001)*

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@affluenceai.com | password123 |
| Finance | finance@affluenceai.com | password123 |
| Influencer | priya@example.com | password123 |

---

## 📊 Database Schema

```
Users        → id, email, password_hash, role, name
Influencers  → id, user_id, referral_code, commission_rate, platform, followers
Products     → id, name, price, category
Clicks       → id, influencer_id, product_id, ip_address, is_unique, timestamp
Sales        → id, influencer_id, product_id, order_id, amount, commission_amount, date
Payments     → id, influencer_id, amount, status, period_start, period_end, paid_at
```

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with JWT |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/analytics/dashboard` | Full dashboard data |
| GET | `/api/influencers` | List influencers |
| GET | `/api/sales` | List/filter sales |
| GET | `/api/payments` | List payments |
| PATCH | `/api/payments/:id/approve` | Approve payment |
| PATCH | `/api/payments/:id/pay` | Mark as paid |
| GET | `/api/payments/export` | CSV export |
| GET | `/api/ai/predictions` | Sales forecast |
| GET | `/api/ai/insights` | Performance insights |
| GET | `/api/ai/fraud` | Fraud detection |
| GET | `/api/track/:code` | Track affiliate click |
| POST | `/api/track/conversion` | Record conversion |

---

## 🎨 Design System

- **Theme**: Dark-mode-first with violet/indigo primary + pink accents
- **Typography**: Inter (headings/body) + JetBrains Mono (data/code)
- **Effects**: Glassmorphism cards, gradient CTAs, micro-animations
- **Charts**: Recharts with custom tooltips and gradients
- **Responsive**: Mobile-friendly with collapsible sidebar

---

## 📈 Seed Data Stats

| Entity | Count |
|--------|-------|
| Influencers | 10 |
| Products | 8 |
| Clicks | 3,600+ |
| Sales | 870+ |
| Payments | 30 |
| Total Revenue | ₹14L+ |

---

## 🏗️ Architecture

```
┌─────────────┐     HTTP/REST     ┌─────────────┐     sql.js     ┌──────────┐
│  React App  │ ←───────────────→ │  Express.js │ ←────────────→ │  SQLite  │
│  (Vite)     │                   │  API Server │                │  (.db)   │
│  Port 5173  │                   │  Port 3001  │                └──────────┘
└─────────────┘                   └─────────────┘
                                        ↓
                                  ┌─────────────┐
                                  │  AI Engine   │
                                  │  (Stats/ML)  │
                                  └─────────────┘
```

---

## 📝 License

MIT

---

Built with ❤️ for influencer marketing
