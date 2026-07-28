# Requirements Document

## Introduction

This document defines the requirements for rebuilding the Habit Tracker application as a modern React + Express application. The rebuild replaces the existing vanilla JS frontend and Node.js backend with a Vite-based React client and an Express server backed by PostgreSQL. The system enables users to register, log in, manage daily habits, track streaks, view statistics, and toggle a dark/light theme — all through a secure, authenticated REST API.

## Glossary

- **System**: The Habit Tracker application, encompassing both the React client and the Express server.
- **Client**: The Vite React frontend application residing in the `client/` directory.
- **Server**: The Express backend API residing in the `server/` directory.
- **User**: A registered and authenticated person using the System.
- **Habit**: A named recurring activity created by a User and tracked on a daily basis.
- **Completion**: A record indicating that a User completed a specific Habit on a specific calendar date.
- **Streak**: The count of consecutive days on which a Habit was completed, ending on today or yesterday.
- **Best Streak**: The longest Streak ever recorded for a given Habit.
- **JWT**: A JSON Web Token issued by the Server to authenticate subsequent requests.
- **Theme**: A visual presentation mode, either dark or light, persisted per browser in localStorage.
- **Dashboard**: The authenticated main view displaying the User's habits and statistics.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to create an account with a username and password, so that my habits are saved privately under my identity.

#### Acceptance Criteria

1. THE System SHALL provide a `POST /api/auth/register` endpoint that accepts a username and password.
2. WHEN a registration request is received, THE Server SHALL reject usernames shorter than 3 characters or longer than 30 characters with a 400 status code and a descriptive error message.
3. WHEN a registration request is received, THE Server SHALL reject usernames containing characters other than letters, numbers, underscores, or hyphens with a 400 status code.
4. WHEN a registration request is received, THE Server SHALL reject passwords shorter than 8 characters with a 400 status code and a descriptive error message.
5. WHEN a registration request passes validation, THE Server SHALL hash the password using bcrypt before storing it in the users table.
6. WHEN a username already exists in the database, THE Server SHALL return a 409 status code indicating the username is taken.
7. WHEN registration succeeds, THE Server SHALL return a 201 status code with the created user's username.
8. WHEN the registration form is submitted on the Client, THE Client SHALL display field-level validation errors inline before sending a request to the Server.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my credentials, so that I can access my personal habit dashboard.

#### Acceptance Criteria

1. THE System SHALL provide a `POST /api/auth/login` endpoint that accepts a username and password.
2. WHEN login credentials are valid, THE Server SHALL issue a JWT with a 7-day expiry and return it in the response body with a 200 status code.
3. WHEN login credentials are invalid, THE Server SHALL return a 401 status code without revealing which field was incorrect.
4. WHEN the Client receives a successful login response, THE Client SHALL store the JWT in localStorage under the key `habitTrackerToken`.
5. WHEN the JWT is stored, THE Client SHALL redirect the User to the Dashboard.
6. WHEN the login form is submitted with an empty username or password, THE Client SHALL display a validation error and SHALL NOT send a request to the Server.

---

### Requirement 3: Session Management and Logout

**User Story:** As an authenticated user, I want my session to persist across page refreshes and to be able to log out securely, so that I maintain control over my account access.

#### Acceptance Criteria

1. WHEN the Client initializes, THE Client SHALL read `habitTrackerToken` from localStorage and, if present, treat the User as authenticated without requiring re-login.
2. WHILE a valid JWT is present in localStorage, THE Client SHALL include it as a Bearer token in the `Authorization` header of every API request.
3. WHEN the User clicks the logout button, THE Client SHALL remove `habitTrackerToken` from localStorage and redirect the User to the login page.
4. WHEN the Server returns a 401 response to any API request, THE Client SHALL remove `habitTrackerToken` from localStorage and redirect the User to the login page.
5. THE Server SHALL validate the JWT signature and expiry on every protected endpoint request and SHALL return 401 for invalid or expired tokens.
6. THE Server SHALL use the `JWT_SECRET` environment variable as the signing secret and SHALL refuse to start if `JWT_SECRET` is not set.

---

### Requirement 4: Habit Creation

**User Story:** As an authenticated user, I want to add new habits by name, so that I can start tracking activities I want to build into my daily routine.

#### Acceptance Criteria

1. THE System SHALL provide a `POST /api/habits` endpoint that accepts a habit name and associates the new Habit with the authenticated User.
2. WHEN a habit creation request is received, THE Server SHALL reject habit names that are empty or consist only of whitespace with a 400 status code.
3. WHEN a habit creation request is received, THE Server SHALL reject habit names longer than 200 characters with a 400 status code.
4. WHEN a habit is successfully created, THE Server SHALL return a 201 status code with the new Habit's data including its generated ID and creation timestamp.
5. WHEN the habit creation form is submitted on the Client, THE Client SHALL validate that the input is non-empty before sending a request to the Server.
6. WHEN a new habit is successfully saved, THE Client SHALL clear the habit name input field and add the new Habit to the displayed list without requiring a full page reload.

---

### Requirement 5: Habit Listing and Filtering

**User Story:** As an authenticated user, I want to see all my habits and filter them by completion status, so that I can focus on what still needs to be done today.

#### Acceptance Criteria

1. THE System SHALL provide a `GET /api/habits` endpoint that returns only the Habits belonging to the authenticated User.
2. WHEN the habit list is returned, THE Server SHALL order Habits from newest to oldest by creation timestamp.
3. THE Client SHALL display filter controls offering at minimum three modes: All, Pending, and Completed.
4. WHEN the "Pending" filter is active, THE Client SHALL display only Habits that have no Completion record for today's date.
5. WHEN the "Completed" filter is active, THE Client SHALL display only Habits that have a Completion record for today's date.
6. WHEN the "All" filter is active, THE Client SHALL display all of the User's Habits regardless of today's completion status.
7. WHEN no Habits exist for the active filter, THE Client SHALL display a contextual empty-state message appropriate to the selected filter.
8. WHEN the Dashboard loads, THE Client SHALL default to the "All" filter.

---

### Requirement 6: Daily Habit Completion Toggle

**User Story:** As an authenticated user, I want to mark habits as complete or incomplete for today, so that I can track my daily progress.

#### Acceptance Criteria

1. THE System SHALL provide a `POST /api/habits/:id/toggle` endpoint that creates a Completion record for today if one does not exist, or deletes it if one does exist.
2. WHEN a toggle request is received, THE Server SHALL verify that the Habit identified by `:id` belongs to the authenticated User and SHALL return 403 if it does not.
3. WHEN a Habit is toggled to completed, THE Server SHALL return 200 with the updated Habit data reflecting the new completion state.
4. WHEN a Habit is toggled to incomplete, THE Server SHALL return 200 with the updated Habit data reflecting the removed completion state.
5. WHEN a Habit is marked as completed on the Client, THE Client SHALL apply a visual strikethrough style to the Habit's name without requiring a page reload.
6. WHEN a Habit is marked as incomplete on the Client, THE Client SHALL remove the strikethrough style from the Habit's name without requiring a page reload.

---

### Requirement 7: Habit Deletion

**User Story:** As an authenticated user, I want to permanently delete habits I no longer want to track, so that my list stays relevant.

#### Acceptance Criteria

1. THE System SHALL provide a `DELETE /api/habits/:id` endpoint that permanently removes the Habit and all associated Completion records.
2. WHEN a deletion request is received, THE Server SHALL verify that the Habit identified by `:id` belongs to the authenticated User and SHALL return 403 if it does not.
3. WHEN a deletion request is received for a Habit that does not exist, THE Server SHALL return a 404 status code.
4. WHEN a Habit is successfully deleted, THE Server SHALL return a 200 status code confirming the deletion.
5. WHEN a Habit is successfully deleted, THE Client SHALL remove the Habit from the displayed list immediately without requiring a page reload.

---

### Requirement 8: Streak Calculation

**User Story:** As an authenticated user, I want to see my current and best streaks for each habit, so that I stay motivated to maintain consistent daily completion.

#### Acceptance Criteria

1. THE Server SHALL calculate the current streak for a Habit as the count of consecutive calendar days ending on today or yesterday for which a Completion record exists.
2. WHEN there is no Completion record for today or yesterday, THE Server SHALL return a current streak of 0.
3. THE Server SHALL calculate the best streak for a Habit as the longest unbroken sequence of consecutive calendar days with Completion records in the Habit's history.
4. WHEN streak data is returned, THE Server SHALL include both the current streak and the best streak as integer fields in the Habit response object.
5. THE Client SHALL display the current streak and best streak values alongside each Habit in the habit list.

---

### Requirement 9: Statistics Dashboard

**User Story:** As an authenticated user, I want to see aggregated statistics about my habit completion, so that I can understand my overall progress over time.

#### Acceptance Criteria

1. THE Client SHALL display a daily progress indicator showing the percentage of the User's total Habits completed today.
2. WHEN the daily progress percentage is calculated, THE Client SHALL compute it as the count of Habits with a Completion record for today divided by the total Habit count, expressed as a percentage rounded to the nearest integer.
3. THE Client SHALL display the total count of Completions recorded in the current calendar month.
4. THE Client SHALL display the total count of Completions recorded in the current calendar year.
5. WHEN a Habit completion is toggled, THE Client SHALL update the daily progress indicator, monthly count, and yearly count immediately to reflect the new state without requiring a page reload.
6. WHEN the User has no Habits, THE Client SHALL display a zero state for all statistics fields.

---

### Requirement 10: Dark/Light Theme Toggle

**User Story:** As a user, I want to switch between dark and light themes and have my preference remembered, so that the app is comfortable to use in different lighting conditions.

#### Acceptance Criteria

1. THE Client SHALL provide a theme toggle control accessible from every page.
2. WHEN the Client initializes, THE Client SHALL read the value of `habitTrackerTheme` from localStorage and apply the corresponding theme.
3. IF `habitTrackerTheme` is not set in localStorage, THEN THE Client SHALL apply the dark theme by default.
4. WHEN the User activates the theme toggle, THE Client SHALL switch between dark and light themes and persist the new value to localStorage under the key `habitTrackerTheme`.
5. WHILE the dark theme is active, THE Client SHALL apply a dark color palette to all UI elements.
6. WHILE the light theme is active, THE Client SHALL apply a light color palette to all UI elements.

---

### Requirement 11: REST API Design

**User Story:** As a developer, I want a well-defined REST API, so that the client and server communicate predictably and the API is straightforward to maintain or extend.

#### Acceptance Criteria

1. THE Server SHALL expose the following endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/habits`, `POST /api/habits`, `DELETE /api/habits/:id`, and `POST /api/habits/:id/toggle`.
2. THE Server SHALL return all responses with `Content-Type: application/json`.
3. WHEN an unauthenticated request is made to any endpoint other than `/api/auth/register` or `/api/auth/login`, THE Server SHALL return a 401 status code.
4. WHEN a request body fails validation, THE Server SHALL return a 400 status code with a JSON body containing a human-readable `error` field.
5. WHEN an unhandled server error occurs, THE Server SHALL return a 500 status code with a generic error message and SHALL NOT expose internal stack traces to the Client.

---

### Requirement 12: PostgreSQL Data Model

**User Story:** As a developer, I want a normalized relational schema, so that user, habit, and completion data are stored with referential integrity and efficient query patterns.

#### Acceptance Criteria

1. THE Server SHALL use a `users` table with at minimum the columns: `id` (primary key), `username` (unique, not null), `password_hash` (not null), and `created_at`.
2. THE Server SHALL use a `habits` table with at minimum the columns: `id` (primary key), `user_id` (foreign key referencing `users.id`), `name` (not null), and `created_at`.
3. THE Server SHALL use a `completions` table with at minimum the columns: `id` (primary key), `habit_id` (foreign key referencing `habits.id`), and `completed_date` (date, not null).
4. THE `completions` table SHALL enforce a UNIQUE constraint on the combination of `habit_id` and `completed_date`.
5. WHEN a Habit is deleted, THE Server SHALL cascade-delete all Completion records associated with that Habit.
6. WHEN a User is deleted, THE Server SHALL cascade-delete all Habit records and their associated Completion records.

---

### Requirement 13: Input Validation and Security

**User Story:** As a system operator, I want the application to follow secure coding practices, so that user data is protected and the system resists common web vulnerabilities.

#### Acceptance Criteria

1. THE Server SHALL use parameterized queries or a query builder for all database interactions and SHALL NOT construct SQL statements by string concatenation with user-supplied values.
2. THE Server SHALL configure CORS to accept requests only from the Client origin defined in the environment configuration and SHALL reject requests from other origins.
3. THE Server SHALL require the `JWT_SECRET` environment variable to be set at startup and SHALL terminate with a non-zero exit code if it is absent.
4. WHEN a habit name is submitted, THE Server SHALL enforce a maximum length of 200 characters and reject requests that exceed this limit with a 400 status code.
5. THE Server SHALL store only the bcrypt hash of user passwords and SHALL NOT store or log plaintext passwords at any point.

---

### Requirement 14: Project Structure and Configuration

**User Story:** As a developer, I want a clear project layout with environment variable configuration, so that the project is easy to set up, run, and deploy.

#### Acceptance Criteria

1. THE System SHALL organize the React frontend source code under a `client/` directory using Vite as the build tool.
2. THE System SHALL organize the Express backend source code under a `server/` directory.
3. THE System SHALL include a `client/.env.example` file documenting the environment variables required by the Client, at minimum the Server's base URL.
4. THE System SHALL include a `server/.env.example` file documenting the environment variables required by the Server, at minimum `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
5. THE Server SHALL read all runtime configuration from environment variables and SHALL NOT hard-code connection strings, secrets, or origin URLs in source files.
6. WHEN the Client makes API requests in development, THE Client SHALL use the Server base URL defined in the Client's environment configuration.
