# Design Document — Habit Tracker React Rebuild

## Overview

The rebuilt Habit Tracker is a full-stack web application composed of:

- **`client/`** — React 18 + Vite SPA (plain CSS, no UI library)
- **`server/`** — Node.js + Express REST API
- **PostgreSQL** — relational database with three core tables

Users register and log in to receive a JWT, which is included as a Bearer token on all subsequent API calls. All habit and completion data is scoped to the authenticated user. The frontend mirrors the visual style of the existing app (CSS custom properties, dark/light theme, glassmorphism dashboard) while being rebuilt as composable React components.

---

## Project Structure

```
habit-tracker/
├── client/                   # Vite + React SPA
│   ├── public/
│   ├── src/
│   │   ├── api/              # Axios instance + per-resource modules
│   │   │   ├── axios.js
│   │   │   ├── auth.js
│   │   │   └── habits.js
│   │   ├── components/       # Reusable UI components
│   │   │   ├── HabitItem.jsx
│   │   │   ├── HabitList.jsx
│   │   │   ├── AddHabitForm.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── StatsDashboard.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useHabits.js
│   │   ├── utils/
│   │   │   └── streaks.js    # Pure streak calculation functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── habits.js
│   │   ├── middleware/
│   │   │   └── authenticate.js
│   │   ├── db/
│   │   │   ├── pool.js        # pg Pool instance
│   │   │   └── schema.sql     # DDL for all tables
│   │   └── index.js           # Express app entry point
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Database Schema

```sql
-- schema.sql

CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(30) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habits (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS completions (
  id             SERIAL PRIMARY KEY,
  habit_id       INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  UNIQUE(habit_id, completed_date)
);
```

All foreign keys use `ON DELETE CASCADE`, satisfying Requirements 12.4 and 12.5.

---

## Backend Architecture

### Entry Point — `server/src/index.js`

```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Database Pool — `server/src/db/pool.js`

```javascript
import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### Authentication Middleware — `server/src/middleware/authenticate.js`

```javascript
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Auth Routes — `server/src/routes/auth.js`

**POST /api/auth/register**
- Validates: username 3–30 chars, alphanumeric + underscore; password >= 8 chars
- Hashes password with `bcrypt.hash(password, 10)`
- Inserts into `users`; returns 409 on duplicate username
- Returns 201 `{ message: 'User created' }`

**POST /api/auth/login**
- Finds user by username; returns 401 on mismatch
- Verifies password with `bcrypt.compare`
- Signs JWT `{ userId }` with 7-day expiry
- Returns 200 `{ token }`

### Habit Routes — `server/src/routes/habits.js`

All routes require the `authenticate` middleware.

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/habits` | Return all habits for `req.userId`, each with its `completions` array (date strings) and calculated `currentStreak` + `bestStreak` |
| POST | `/api/habits` | Create habit; validate name is non-empty, max 200 chars; return 201 with new habit |
| DELETE | `/api/habits/:id` | Verify ownership; delete habit + cascade completions; return 200 |
| POST | `/api/habits/:id/toggle` | Verify ownership; insert or delete today's completion using `ON CONFLICT DO NOTHING` / existence check; return updated completion list |

#### Habit Response Shape

```json
{
  "id": 1,
  "name": "Morning run",
  "created_at": "2025-01-15T08:00:00.000Z",
  "completions": ["2025-07-25", "2025-07-26", "2025-07-27"],
  "currentStreak": 3,
  "bestStreak": 7
}
```

#### Toggle Logic

```javascript
// POST /api/habits/:id/toggle
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

// Check if completed today
const existing = await pool.query(
  'SELECT id FROM completions WHERE habit_id = $1 AND completed_date = $2',
  [habitId, today]
);

if (existing.rows.length > 0) {
  // Remove completion
  await pool.query(
    'DELETE FROM completions WHERE habit_id = $1 AND completed_date = $2',
    [habitId, today]
  );
} else {
  // Add completion (UNIQUE constraint prevents duplicates)
  await pool.query(
    'INSERT INTO completions (habit_id, completed_date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [habitId, today]
  );
}
```

---

## Streak Calculation

Streak logic lives in `client/src/utils/streaks.js` (also mirrored server-side for GET /api/habits response). It is a pure function with no side effects.

```javascript
// streaks.js

/**
 * @param {string[]} completions - Array of YYYY-MM-DD date strings
 * @returns {{ current: number, best: number }}
 */
export function calculateStreaks(completions) {
  if (!completions || completions.length === 0) return { current: 0, best: 0 };

  const sorted = [...new Set(completions)].sort(); // deduplicate + sort ascending

  const parseLocal = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Best streak ---
  let best = 1, tempBest = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (parseLocal(sorted[i]) - parseLocal(sorted[i - 1])) / 86400000
    );
    if (diff === 1) {
      tempBest++;
      if (tempBest > best) best = tempBest;
    } else if (diff > 1) {
      tempBest = 1;
    }
    // diff === 0 means duplicate; deduplication above prevents this
  }

  // --- Current streak ---
  const lastDate = parseLocal(sorted[sorted.length - 1]);
  const diffFromToday = Math.round((today - lastDate) / 86400000);

  let current = 0;
  if (diffFromToday <= 1) {
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      const diff = Math.round(
        (parseLocal(sorted[i]) - parseLocal(sorted[i - 1])) / 86400000
      );
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, best };
}
```

---

## Frontend Architecture

### Routing — `App.jsx`

```jsx
<BrowserRouter>
  <AuthProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    </Routes>
  </AuthProvider>
</BrowserRouter>
```

`ProtectedRoute` reads from `AuthContext` and redirects to `/login` if no token is present.

### AuthContext — `context/AuthContext.jsx`

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('habitTrackerToken'));

  const login = (jwt) => {
    localStorage.setItem('habitTrackerToken', jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('habitTrackerToken');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Axios Instance — `api/axios.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('habitTrackerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### useHabits Hook — `hooks/useHabits.js`

```javascript
export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => { /* GET /api/habits */ };
  const addHabit = async (name) => { /* POST /api/habits */ };
  const toggleHabit = async (id) => { /* POST /api/habits/:id/toggle */ };
  const deleteHabit = async (id) => { /* DELETE /api/habits/:id */ };

  useEffect(() => { load(); }, []);

  return { habits, loading, error, addHabit, toggleHabit, deleteHabit };
}
```

### Component Hierarchy

```
DashboardPage
├── Header
│   ├── ThemeToggle
│   └── LogoutButton
├── StatsDashboard
│   ├── DailyProgressCard (progress bar + percentage)
│   └── StatsRow
│       ├── MonthlyStatCard
│       └── YearlyStatCard
├── AddHabitForm
├── FilterBar
└── HabitList
    └── HabitItem (×N)
        ├── HabitCheckbox
        ├── HabitTextBlock
        │   ├── HabitName
        │   └── StreakDisplay (current + best)
        └── DeleteButton
```

### Statistics Calculation (Client-Side, Derived from Habits State)

```javascript
function computeStats(habits) {
  const today = getTodayString();               // YYYY-MM-DD
  const month = today.slice(0, 7);             // YYYY-MM
  const year  = today.slice(0, 4);             // YYYY

  const completedToday = habits.filter(h => h.completions.includes(today)).length;
  const dailyPct = habits.length === 0 ? 0 : Math.round((completedToday / habits.length) * 100);

  const monthly = habits.reduce((acc, h) =>
    acc + h.completions.filter(d => d.startsWith(month)).length, 0);
  const yearly = habits.reduce((acc, h) =>
    acc + h.completions.filter(d => d.startsWith(year)).length, 0);

  return { dailyPct, completedToday, total: habits.length, monthly, yearly };
}
```

### Theme Management

Theme preference is stored in `localStorage` under `habitTrackerTheme`. On app load, `App.jsx` reads this value and applies a `data-theme="dark"` or `data-theme="light"` attribute to `<html>`. CSS custom properties switch based on this attribute.

---

## API Error Handling

| HTTP Status | Meaning | Client Action |
|-------------|---------|---------------|
| 400 | Validation failure | Show inline error message |
| 401 | Unauthenticated | Clear token, redirect to `/login` |
| 403 | Forbidden (wrong user) | Show generic error toast |
| 404 | Resource not found | Show toast; refresh list |
| 409 | Conflict (duplicate username) | Show field-level error |
| 500 | Server error | Show generic error toast; log to console |

---

## Environment Variables

### server/.env.example
```
DATABASE_URL=postgresql://user:pass@localhost:5432/habit_tracker
JWT_SECRET=your-very-long-random-secret
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### client/.env.example
```
VITE_API_URL=http://localhost:5000
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Password hashing round-trip

For any plaintext password string, the server's registration logic shall produce a stored hash such that `bcrypt.compare(plaintext, hash)` returns `true`, and the hash shall not equal the plaintext.

**Validates: Requirements 1.6**

---

### Property 2: API responses never expose password hashes

For any API response returned by any endpoint in the System, the serialized JSON shall not contain a field named `password`, `password_hash`, or `passwordHash`.

**Validates: Requirements 1.7**

---

### Property 3: Short passwords are rejected

For any password string with fewer than 8 characters, the registration endpoint shall respond with HTTP 400 and not create a user record.

**Validates: Requirements 1.4**

---

### Property 4: Duplicate username rejection

For any username that already exists in the `users` table, a second registration attempt with the same username shall respond with HTTP 409 and not create a second user record.

**Validates: Requirements 1.3**

---

### Property 5: Valid login returns a well-formed JWT

For any registered user with valid credentials, the login endpoint shall return HTTP 200 with a `token` field that is a string parseable as a JWT containing a `userId` claim.

**Validates: Requirements 2.2**

---

### Property 6: Invalid JWT is rejected with 401

For any string that is not a valid signed JWT (wrong signature, expired, malformed), every protected endpoint shall respond with HTTP 401.

**Validates: Requirements 3.5**

---

### Property 7: Whitespace-only habit names are rejected

For any habit name string composed entirely of whitespace characters (spaces, tabs, newlines), the habit creation endpoint shall respond with HTTP 400 and not insert a habit record.

**Validates: Requirements 4.3, 13.1**

---

### Property 8: Habit names exceeding 200 characters are rejected

For any habit name string with length greater than 200 characters, the habit creation endpoint shall respond with HTTP 400 and not insert a habit record.

**Validates: Requirements 13.1**

---

### Property 9: Invalid username format is rejected

For any username string that is shorter than 3 characters, longer than 30 characters, or contains characters outside `[a-zA-Z0-9_]`, the registration endpoint shall respond with HTTP 400 and not create a user record.

**Validates: Requirements 13.2**

---

### Property 10: Completion toggle is a round-trip (idempotent pair)

For any habit that starts with no completion for today, toggling it once shall add a completion, and toggling it again shall remove that completion, restoring the original state. The `completions` table shall never hold more than one record per `(habit_id, completed_date)` pair.

**Validates: Requirements 6.1, 6.2, 12.3**

---

### Property 11: Streak invariant — best >= current

For any non-empty array of completion date strings, `calculateStreaks(completions).best` shall always be greater than or equal to `calculateStreaks(completions).current`.

**Validates: Requirements 8.2, 8.5**

---

### Property 12: Streak invariant — no completions yields zero streaks

For an empty completions array, `calculateStreaks([])` shall return `{ current: 0, best: 0 }`.

**Validates: Requirements 8.6**

---

### Property 13: Pending filter excludes today's completed habits

For any list of habits with arbitrary completion states, applying the "pending" filter shall return exactly those habits whose `completions` array does not include today's date string.

**Validates: Requirements 5.4**

---

### Property 14: Completed filter includes only today's completed habits

For any list of habits, applying the "completed" filter shall return exactly those habits whose `completions` array includes today's date string.

**Validates: Requirements 5.5**

---

### Property 15: Daily progress percentage is correct

For any list of habits where `k` out of `n` habits are completed today (`n > 0`), `computeStats(habits).dailyPct` shall equal `Math.round((k / n) * 100)`.

**Validates: Requirements 9.1**

---

### Property 16: Monthly completion count is correct

For any list of habits with arbitrary completion date strings, `computeStats(habits).monthly` shall equal the count of completions whose date starts with the current `YYYY-MM` prefix.

**Validates: Requirements 9.4**

---

### Property 17: Cross-user data isolation

For any two users A and B, a GET /api/habits request authenticated as user A shall never return a habit whose `user_id` equals user B's ID.

**Validates: Requirements 5.1, 4.4**
