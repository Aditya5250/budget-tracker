# 💰 AuraBudget AI — Modern Production-Grade Financial Management

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000.svg?style=flat&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1.svg?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)

A full-stack, AI-powered personal financial management web application designed for modern clarity and financial discipline. Powered by **React 19**, **Node.js/Express 5**, **PostgreSQL**, and **Google Gemini AI**.

---

## ✨ Features

### 🧠 Intelligent AI Financial Features
- **Natural Language Quick Add**: Type expenses naturally (e.g., *"Dinner with team at Italian Bistro 850 rupees yesterday"* or *"Uber to airport $45"*) — AI parses amount, category, note, and date automatically.
- **Aura AI Financial Advisor**: Integrated conversational financial coach analyzing real-time income, expense velocity, top spend categories, and savings leaks.
- **Automated Anomaly & Spending Health**: Instant banners flagging month-over-month variances, category concentration spikes, and savings benchmarks.
- **Smart Budget Recommendations**: 50/30/20 rule allocation and category caps calculated based on historical spending habits.

### 📊 Modern Visual Dashboard & Analytics
- **Cashflow Dynamics**: Visual Income vs. Expense comparison with net surplus/deficit indicators.
- **Interactive Category Donut Chart**: Hover-responsive SVG distribution of expense categories.
- **Real-Time Budget Progress Tracking**: Dynamic progress bars with status thresholds (Normal, Approaching 80%, Overbudget >100%).
- **Advanced Filtering & Search**: Instant filter by type (Income/Expense), category dropdown, live keyword search, date range, and sorting.
- **CSV Statement Export**: 1-click download of filtered transactions.

### 🛡️ Production Engineering
- **Secure JWT Authentication**: Protected routes, password hashing with bcrypt, token interceptor, and 1-click guest demo login.
- **Resilient Database Layer**: Automatic schema migrations with PostgreSQL (`pg` pool) and built-in local development fallback.
- **Glassmorphism Design System**: Tailored dark mode with ambient glows, responsive mobile drawer & desktop sidebar, and fluid micro-interactions.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router v7, Axios, Lucide React, Canvas Confetti.
- **Backend**: Node.js (ES Modules), Express 5, PostgreSQL (`pg`), JSON Web Tokens (`jsonwebtoken`), Bcrypt.
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) with intelligent heuristic NLP fallback.
- **Deployment**: Vercel (Frontend), Render / Neon / Supabase (Backend & PostgreSQL).

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install

# (Optional) Configure environment variables in backend/.env
# PORT=4000
# DATABASE_URL=postgresql://user:password@localhost:5432/budget_tracker
# JWT_SECRET=your_secret_key
# GEMINI_API_KEY=your_gemini_api_key

npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 📁 Project Structure

```
budget-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # PostgreSQL pool, schema.sql & in-memory fallback
│   │   ├── controllers/     # Auth, Transactions, Categories, Budgets, AI controllers
│   │   ├── middlewares/     # JWT authentication middleware
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # AI Service (Gemini API & NLP rule engine)
│   │   ├── utils/           # Bcrypt & JWT helper utilities
│   │   ├── app.js           # Express app & CORS configuration
│   │   └── server.js        # Server entry point & DB initialization
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client, Auth, Transactions, Budgets, AI APIs
│   │   ├── components/      # UI Modals, Charts, AI Drawer, Transaction List
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/           # Dashboard, Analytics, BudgetsPage, Login, Signup
│   │   ├── styles/          # Modern design system (global.css, layout.css, auth.css)
│   │   ├── App.jsx          # Route declarations
│   │   └── main.jsx         # Application entry
│   ├── index.html
│   └── package.json
└── Readme.md
```

---

## 📄 License
MIT © Aditya Raj