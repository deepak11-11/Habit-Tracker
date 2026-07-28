# Implementation Plan: Habit Tracker React Rebuild

## Overview

Rebuild the existing vanilla JS + SQLite habit tracker as a full-stack React + Express + PostgreSQL application with JWT authentication and per-user data isolation. The implementation follows the component hierarchy and API design from `design.md`, working incrementally from the database layer up to the React UI.

---

## Tasks

- [x] 1. Initialize project structure and tooling
  - Create `client/` directory using `npm create vite@latest client -- --template react`
  - Create `server/` directory with `npm init -y`
  - Add `.gitignore` entries for `node_modules`, `.env`, `dist`
  - Create `server/.env.example` and `client/.env.example` with all documented variables
  - Install server dependencies: `express`, `cors`, `dotenv`, `pg`, `bcrypt`, `jsonwebtoken`
  - Install client dependencies: `axios`, `react-router-dom`
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 2. Set up PostgreSQL schema and database connection
  - [x] 2.1 Create `server/src/db/schema.sql` with `users`, `habits`, and `completions` table DDL including all foreign keys and cascade rules
    - Include `UNIQUE(habit_id, completed_date)` constraint on completions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 2.2 Create `server/src/db/pool.js` exporting a `pg.Pool` instance reading from `DATABASE_URL`
    - _Requirements: 14.2_
  - [x] 2.3 Create a `server/src/db/migrate.js` script that runs `schema.sql` against the database to initialize tables
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. Implement authentication routes
  - [x] 3.1 Create `server/src/routes/auth.js` with `POST /api/auth/register`
    - Validate username: 3–30 chars, alphanumeric + underscore only
    - Validate password: minimum 8 characters
    - Hash password with `bcrypt.hash(password, 10)`
    - Insert user; return 409 on unique constraint violation
    - Return 201 `{ message: 'User created' }`
    - Use parameterized queries for all DB operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 13.2, 13.3_

  - [ ]* 3.2 Write property test for registration validation (Property 3, 4, 9)
    - **Property 3: Short passwords are rejected**
    - **Property 4: Duplicate username rejection**
    - **Property 9: Invalid username format is rejected**
    - **Validates: Requirements 1.3, 1.4, 13.2**

  - [x] 3.3 Add `POST /api/auth/login` to `server/src/routes/auth.js`
    - Look up user by username; return 401 on not found
    - Compare password with `bcrypt.compare`; return 401 on mismatch
    - Sign JWT `{ userId }` with 7-day expiry using `process.env.JWT_SECRET`
    - Return 200 `{ token }`
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]* 3.4 Write property test for login behavior (Property 5)
    - **Property 5: Valid login returns a well-formed JWT**
    - **Validates: Requirements 2.2**

  - [ ]* 3.5 Write property test for password hashing (Property 1, 2)
    - **Property 1: Password hashing round-trip**
    - **Property 2: API responses never expose password hashes**
    - **Validates: Requirements 1.6, 1.7**

- [x] 4. Implement authentication middleware and app wiring
  - [x] 4.1 Create `server/src/middleware/authenticate.js`
    - Parse `Authorization: Bearer <token>` header
    - Verify JWT with `jwt.verify`; attach `req.userId` on success
    - Return 401 with JSON error on missing, invalid, or expired token
    - _Requirements: 3.4, 3.5_

  - [ ]* 4.2 Write property test for JWT authentication middleware (Property 6)
    - **Property 6: Invalid JWT is rejected with 401**
    - **Validates: Requirements 3.5**

  - [x] 4.3 Create `server/src/index.js` as the Express entry point
    - Load environment variables with `dotenv/config`
    - Exit with error if `JWT_SECRET` is not set
    - Configure CORS restricted to `CLIENT_ORIGIN`
    - Mount auth and habits routes
    - _Requirements: 13.4, 13.5, 14.2_

- [x] 5. Checkpoint — Verify server starts and auth endpoints respond
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement habit routes
  - [x] 6.1 Create `server/src/routes/habits.js` with `GET /api/habits`
    - Apply `authenticate` middleware to all routes in this file
    - Query habits for `req.userId` ordered by `created_at DESC`
    - For each habit, query its completions and compute streaks server-side
    - Return array of habit objects with `completions`, `currentStreak`, `bestStreak`
    - _Requirements: 5.1, 5.2, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 6.2 Add `POST /api/habits` to `server/src/routes/habits.js`
    - Validate name: non-empty, max 200 chars
    - Insert habit with `req.userId`; return 201 with the new habit object
    - _Requirements: 4.1, 4.4, 4.5, 13.1_

  - [ ]* 6.3 Write property test for habit name validation (Property 7, 8)
    - **Property 7: Whitespace-only habit names are rejected**
    - **Property 8: Habit names exceeding 200 characters are rejected**
    - **Validates: Requirements 4.3, 13.1**

  - [x] 6.4 Add `DELETE /api/habits/:id` to `server/src/routes/habits.js`
    - Verify habit belongs to `req.userId`; return 403 if not
    - Delete the habit (completions cascade automatically)
    - Return 200 on success, 404 if habit not found
    - _Requirements: 7.1, 7.2_

  - [x] 6.5 Add `POST /api/habits/:id/toggle` to `server/src/routes/habits.js`
    - Verify habit belongs to `req.userId`; return 403 if not
    - Check for an existing completion for today's date
    - If found: delete it; if not found: insert with `ON CONFLICT DO NOTHING`
    - Return updated completions array
    - _Requirements: 6.1, 6.2, 6.4, 12.3_

  - [ ]* 6.6 Write property test for completion toggle round-trip (Property 10)
    - **Property 10: Completion toggle is a round-trip (idempotent pair)**
    - **Validates: Requirements 6.1, 6.2, 12.3**

  - [ ]* 6.7 Write property test for cross-user data isolation (Property 17)
    - **Property 17: Cross-user data isolation**
    - **Validates: Requirements 5.1, 4.4**

- [x] 7. Checkpoint — Verify all habit API endpoints work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement streak utility and statistics logic
  - [x] 8.1 Create `client/src/utils/streaks.js` with the `calculateStreaks(completions)` pure function
    - Accept an array of `YYYY-MM-DD` strings
    - Deduplicate and sort before processing
    - Return `{ current, best }` as defined in `design.md`
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 8.2 Write property tests for streak calculation (Property 11, 12)
    - **Property 11: Streak invariant — best >= current**
    - **Property 12: Streak invariant — no completions yields zero streaks**
    - **Validates: Requirements 8.2, 8.5, 8.6**

  - [x] 8.3 Create `client/src/utils/stats.js` with `computeStats(habits)` pure function
    - Calculate `dailyPct`, `completedToday`, `total`, `monthly`, `yearly`
    - Use the current local date for today/month/year comparisons
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 8.4 Write property tests for statistics calculation (Property 15, 16)
    - **Property 15: Daily progress percentage is correct**
    - **Property 16: Monthly completion count is correct**
    - **Validates: Requirements 9.1, 9.4**

- [ ] 9. Set up React client foundation
  - [x] 9.1 Create `client/src/context/AuthContext.jsx`
    - Store token state initialized from `localStorage.getItem('habitTrackerToken')`
    - Expose `login(jwt)`, `logout()`, and `token` via context
    - `login` saves to localStorage; `logout` removes from localStorage
    - _Requirements: 2.3, 3.1, 3.2, 3.3_

  - [x] 9.2 Create `client/src/api/axios.js` with Axios instance
    - Set `baseURL` from `import.meta.env.VITE_API_URL`
    - Add request interceptor attaching `Authorization: Bearer <token>` from localStorage
    - _Requirements: 3.4_

  - [x] 9.3 Create `client/src/api/auth.js` and `client/src/api/habits.js`
    - `auth.js`: `register(username, password)`, `login(username, password)`
    - `habits.js`: `fetchHabits()`, `createHabit(name)`, `toggleHabit(id)`, `deleteHabit(id)`
    - _Requirements: 1.1, 2.1, 4.1, 6.1, 7.1_

  - [x] 9.4 Create `client/src/App.jsx` with React Router configuration
    - Public routes: `/login`, `/register`
    - Protected route: `/` wraps `DashboardPage` in a `ProtectedRoute` component
    - `ProtectedRoute` redirects to `/login` when `token` is null in `AuthContext`
    - Wrap all routes in `AuthProvider` and apply theme attribute to `<html>` on load
    - _Requirements: 3.1, 3.2, 3.3_

  - [-] 9.5 Migrate CSS custom properties from the existing `style.css` to `client/src/index.css`
    - Preserve all `--bg-color`, `--card-bg`, `--accent-color`, etc. variables
    - Use `[data-theme="dark"]` and `[data-theme="light"]` attribute selectors instead of class names
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 10. Implement authentication pages
  - [x] 10.1 Create `client/src/pages/RegisterPage.jsx`
    - Form with username and password fields
    - Client-side validation: username non-empty, password >= 8 chars; show inline errors
    - Call `register()` from `api/auth.js`; show server error messages inline
    - On success (201) redirect to `/login`
    - Include navigation link to `/login`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.6_

  - [x] 10.2 Create `client/src/pages/LoginPage.jsx`
    - Form with username and password fields
    - Call `login()` from `api/auth.js`
    - On success: call `AuthContext.login(token)` then navigate to `/`
    - On failure: show "Invalid username or password" inline
    - Include navigation link to `/register`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 11. Implement `useHabits` hook
  - Create `client/src/hooks/useHabits.js`
  - Expose `habits`, `loading`, `error`, `addHabit(name)`, `toggleHabit(id)`, `deleteHabit(id)`
  - `load()` calls `fetchHabits()` and updates state
  - `addHabit(name)` validates non-empty/non-whitespace client-side before calling API
  - On 401 response from any call, call `AuthContext.logout()` to redirect to login
  - _Requirements: 4.1, 4.3, 5.1, 6.1, 7.1, 3.6_

- [ ] 12. Implement dashboard components
  - [-] 12.1 Create `client/src/components/StatsDashboard.jsx`
    - Accept `habits` array as prop
    - Call `computeStats(habits)` and render daily progress bar, monthly count, yearly count
    - Animate progress bar width with CSS transition
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [-] 12.2 Create `client/src/components/AddHabitForm.jsx`
    - Controlled input for habit name
    - On submit: validate non-empty/non-whitespace, call `addHabit`, clear input, restore focus
    - Show inline validation error if input is blank
    - _Requirements: 4.1, 4.2, 4.3_

  - [-] 12.3 Create `client/src/components/FilterBar.jsx`
    - Three buttons: "All", "Pending", "Completed"
    - Accept `activeFilter` and `onFilterChange` props
    - Apply active styling to selected filter
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [-] 12.4 Create `client/src/components/HabitItem.jsx`
    - Display habit name, checkbox, streak info, and delete button
    - Checkbox state derived from whether today's date is in `habit.completions`
    - Show completed styling (strikethrough) when checked
    - Display `currentStreak` and `bestStreak` from habit data
    - _Requirements: 5.2, 6.1, 6.2, 6.3, 8.1_

  - [ ]* 12.5 Write property tests for filter logic (Property 13, 14)
    - **Property 13: Pending filter excludes today's completed habits**
    - **Property 14: Completed filter includes only today's completed habits**
    - **Validates: Requirements 5.4, 5.5**

  - [-] 12.6 Create `client/src/components/HabitList.jsx`
    - Accept `habits` and `filter` props
    - Apply filter logic to derive displayed habits
    - Render `HabitItem` for each; handle empty-state rendering
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [~] 12.7 Create `client/src/components/ThemeToggle.jsx`
    - Read and write theme to localStorage under `habitTrackerTheme`
    - Toggle `data-theme` attribute on `document.documentElement`
    - Display sun/moon icon based on active theme
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 13. Assemble DashboardPage and wire everything together
  - [~] 13.1 Create `client/src/pages/DashboardPage.jsx`
    - Use `useHabits()` hook to get state and actions
    - Compose `StatsDashboard`, `AddHabitForm`, `FilterBar`, `HabitList`, `ThemeToggle`, logout button
    - Pass `addHabit`, `toggleHabit`, `deleteHabit` callbacks to child components
    - Logout button calls `AuthContext.logout()` and navigates to `/login`
    - _Requirements: 3.3, 4.1, 6.1, 7.1, 9.6_

  - [~] 13.2 Wire 401 interception in `api/axios.js`
    - Add response interceptor: if status is 401, clear localStorage token and redirect to `/login`
    - _Requirements: 3.6_

- [~] 14. Final checkpoint — End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All DB queries must use parameterized statements (no string interpolation)
- The `completions` array on each habit is `string[]` of `YYYY-MM-DD` dates throughout the client
- The server computes streaks and returns them alongside habits on GET; the client also has the pure `calculateStreaks` utility for any client-side use
- Theme preference persists in `localStorage` — it is NOT stored in the database and is NOT per-user
- Vite dev server runs on port 5173 by default; Express runs on port 5000 — set `VITE_API_URL=http://localhost:5000` during development
