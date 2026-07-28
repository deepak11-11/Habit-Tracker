# ⚡ HabitPulse Pro — Modern Full-Stack Habit Tracker SaaS

HabitPulse is a modern, responsive, full-stack Habit Tracker web application built with **React 18 (Vite)** on the frontend and **Node.js (Express)** on the backend. It features a dual-database architecture (**PostgreSQL primary with automatic SQLite fallback**), an immutable historical data ledger, dark mode default with glassmorphism UI styling, and a self-healing pre-flight health auditor.

---

## 🌟 Key Features & Highlights

- 🎨 **Modern Minimal Dashboard**: Default dark mode aesthetic with purple/blue gradients, glassmorphism cards, smooth animations, and soft drop shadows.
- 🔐 **Authentication System**: Dedicated Login & Signup views powered by React Context API with LocalStorage user persistence.
- 📊 **Recharts Analytics**: Dynamic daily completion trends, weekly bar chart overviews, category distributions, and streak records.
- 🛡️ **Immutable Past History**: Deleting a habit removes only today's checklist item. Past historical logs, streak counters, and analytics remain permanent.
- 🔄 **Smart Dual-Database Strategy**: Connects to **PostgreSQL** by default and automatically creates missing databases. If PostgreSQL service is offline or credentials fail, seamlessly falls back to local **SQLite** (`habits.db`).
- ⚡ **Strict Port & Process Protection**: Fixed port binding (Backend: `5001`, Frontend: `5173`) with automatic PID detection and process reclaimer to prevent port jumping or duplicate server conflicts.
- 🔍 **Pre-flight Audit & Self-Healing**: Automatically checks project structure, `package.json`, `node_modules`, `vite.config.js`, and `.env` before application startup.
- 🚀 **Decoupled & Concurrent**: Frontend and Backend run independently or concurrently via a single root command (`npm run dev`).

---

## 📁 Project Directory Structure

```text
habit-tracker/
│
├── frontend/                     # Decoupled React 18 + Vite Application
│   ├── package.json              # Frontend scripts & dependencies
│   ├── vite.config.js            # Vite server config with /api proxy target
│   ├── index.html                # Main HTML entry file
│   ├── scripts/
│   │   └── verify-project.js     # Pre-flight audit & port 5173 reclaimer
│   └── src/
│       ├── main.jsx              # React DOM mounting point
│       ├── App.jsx               # React Router & Global Error Boundary
│       ├── index.css             # Design system tokens, variables & glassmorphism
│       ├── api/                  # Axios/Fetch API client
│       ├── components/           # Reusable UI components (Navbar, Sidebar, Charts, Modals)
│       ├── context/              # AuthContext & HabitContext with schema protection
│       └── pages/                # Dashboard, Habits, Calendar, Analytics, Profile, Settings
│
├── backend/                      # Decoupled Node.js + Express REST Server
│   ├── package.json              # Backend scripts & dependencies
│   ├── server.js                 # Fixed port 5001, PID killer, PG + SQLite fallback
│   ├── .env                      # Database configuration string & port
│   └── habits.db                 # Local SQLite fallback database file
│
├── package.json                  # Root concurrent launcher (concurrently)
└── README.md                     # Comprehensive project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 18 (Functional Components, React Hooks) |
| **Build Tooling** | Vite v5, ESBuild |
| **Routing** | React Router v7 |
| **Data Visualization** | Recharts (Line, Bar, Area, Pie Charts) |
| **Styling** | Vanilla CSS3 (Custom Design Tokens, HSL Color Palettes, Glassmorphism) |
| **Icons** | Lucide React |
| **Backend Runtime** | Node.js (ES6+ Express.js Server) |
| **Primary Database** | PostgreSQL (`pg` Connection Pool) |
| **Fallback Database** | SQLite3 (`sqlite3` Local File Database) |
| **Environment Management**| Dotenv (`dotenv`) |
| **Process Management** | Concurrently, Child Process PID Killer |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL** *(Optional)*: Runs automatically with local SQLite fallback if PostgreSQL is not installed.

### 1. Installation
Clone or open the repository folder:
```bash
cd habit-tracker
```

Install root dependencies:
```bash
npm install
```

Install frontend & backend dependencies:
```bash
cd frontend && npm install
cd ../backend && npm install
cd ..
```

---

## 🏃 Running the Application

### Option A: Run Full-Stack Concurrently (Recommended)
From the project root directory, run:
```bash
npm run dev
```
This command starts both the **Backend API Server** (`http://localhost:5001`) and the **React Vite Frontend** (`http://localhost:5173`) simultaneously.

### Option B: Run Frontend Only
```bash
cd frontend
npm run dev
```
*Frontend runs strictly on **http://localhost:5173**.*

### Option C: Run Backend Only
```bash
cd backend
npm run dev
```
*Backend API runs strictly on **http://localhost:5001**.*

---

## ⚙️ Environment Configuration (`backend/.env`)

The backend reads configuration from `backend/.env`:

```env
# PostgreSQL Database Connection String
DATABASE_URL=postgresql://postgres:1105@localhost:5432/habit_tracker

# Server Fixed Port
PORT=5001
```

> **Note**: If PostgreSQL database `habit_tracker` does not exist, the backend automatically creates it. If PostgreSQL is offline, the server logs a warning and initializes `backend/habits.db` (SQLite).

---

## 📡 REST API Reference

All backend API routes return JSON and interface with PostgreSQL/SQLite:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/habits` | Retrieves all registered habits from the active database |
| `POST` | `/api/habits` | Saves or updates the complete array of habit objects |
| `PUT` | `/api/habits/:id` | Updates completion history records for a specific habit |
| `DELETE` | `/api/habits/:id` | Deletes a habit while preserving immutable past analytics |

---

## 🔍 Self-Healing & Diagnostics

- **Pre-flight Audit Script**: `frontend/scripts/verify-project.js` runs prior to Vite startup to verify missing files, auto-generate `package.json`, and reclaim occupied ports.
- **Global Error Boundary**: Implemented in `App.jsx` to catch component errors and display a recovery button (**"Reset & Reload App"**) to clear stale cache without breaking the application interface.
- **Port Conflict Resolution**: `backend/server.js` detects PIDs using `netstat` (Windows) or `lsof` (macOS/Linux), terminates lingering duplicate server instances, and releases port `5001`.

---

## 📄 License

This project is open-source and available under the **MIT License**.
