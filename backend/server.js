require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool, Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const net = require('net');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'habitpulse_jwt_secret_key_2026_production_grade';

// ANSI Color Constants for Terminal Diagnostics
const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// 1. Startup Diagnostics & Environment Validation
console.log(`\n${COLORS.cyan}${COLORS.bold}✓ Backend starting...${COLORS.reset}`);

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log(`${COLORS.green}✓ Environment configuration (.env) loaded.${COLORS.reset}`);
} else {
  console.warn(`${COLORS.yellow}⚠ .env file not found. Using default environment settings.${COLORS.reset}`);
}

// Fixed Port Configuration (Always strict PORT from env or 5001)
const FIXED_PORT = parseInt(process.env.PORT || '5001', 10);
console.log(`${COLORS.cyan}✓ Checking port ${FIXED_PORT}...${COLORS.reset}`);

// Initialize Express Application
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

/* ==========================================================================
   PORT CONFLICT RESOLUTION & PID FINDER (STRICT SINGLE FIXED PORT 5001)
   ========================================================================== */

/**
 * Checks if a TCP port is currently open and listening.
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port);
  });
}

/**
 * Detects Process ID (PID) using netstat (Windows) or lsof (Linux/macOS)
 */
function getPidUsingPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(pid) && pid > 0 && pid !== process.pid) {
            return pid;
          }
        }
      }
    } else {
      const output = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' });
      const pid = parseInt(output.trim(), 10);
      if (!isNaN(pid) && pid !== process.pid) {
        return pid;
      }
    }
  } catch (err) {
    // Port not occupied or command returned empty
  }
  return null;
}

/**
 * Gracefully terminates a conflicting process by PID
 */
function killProcessByPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch (err) {
    return false;
  }
}

/* ==========================================================================
   SMART HYBRID DATABASE ADAPTER (PostgreSQL with Auto DB Creation & SQLite Fallback)
   ========================================================================== */

let dbEngine = 'postgres';
let pgPool = null;
let sqliteDb = null;

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:1105@localhost:5432/habit_tracker';

const ensurePostgresDbExists = async () => {
  try {
    const adminUrl = dbUrl.replace(/\/habit_tracker(\?.*)?$/, '/postgres$1');
    const adminClient = new Client({ connectionString: adminUrl });
    await adminClient.connect();
    const res = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'habit_tracker'");
    if (res.rowCount === 0) {
      await adminClient.query('CREATE DATABASE habit_tracker');
      console.log(`${COLORS.green}✓ Created PostgreSQL database "habit_tracker" automatically.${COLORS.reset}`);
    }
    await adminClient.end();
  } catch (err) {
    // If admin connection fails, initDb will handle main connection or fallback
  }
};

pgPool = new Pool({ connectionString: dbUrl });

const initDb = async () => {
  try {
    await ensurePostgresDbExists();
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        joined_date VARCHAR(100) NOT NULL
      )
    `);
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
        text TEXT NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        color VARCHAR(50) DEFAULT '#8b5cf6',
        priority VARCHAR(50) DEFAULT 'Medium',
        "createdAt" TEXT NOT NULL,
        completions TEXT NOT NULL
      )
    `);
    try {
      await pgPool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS user_id VARCHAR(255) NOT NULL DEFAULT 'default_user'`);
      await pgPool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS description TEXT`);
      await pgPool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'`);
      await pgPool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#8b5cf6'`);
      await pgPool.query(`ALTER TABLE habits ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Medium'`);
    } catch (e) {}
    dbEngine = 'postgres';
    console.log(`${COLORS.green}✓ Database connected (PostgreSQL).${COLORS.reset}`);
  } catch (err) {
    console.warn(`${COLORS.yellow}⚠ PostgreSQL connection issue (${err.message}).${COLORS.reset}`);
    console.log(`${COLORS.yellow}🔄 Falling back to local SQLite database (habits.db)...${COLORS.reset}`);
    
    dbEngine = 'sqlite';
    const dbPath = path.join(__dirname, 'habits.db');
    sqliteDb = new sqlite3.Database(dbPath, (sqliteErr) => {
      if (sqliteErr) {
        console.error(`${COLORS.red}✖ Error connecting to SQLite database:${COLORS.reset}`, sqliteErr.message);
      } else {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar TEXT,
          joined_date TEXT NOT NULL
        )`);
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'default_user',
          text TEXT NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'General',
          color TEXT DEFAULT '#8b5cf6',
          priority TEXT DEFAULT 'Medium',
          createdAt TEXT NOT NULL,
          completions TEXT NOT NULL
        )`, (createErr) => {
          if (!createErr) {
            sqliteDb.run(`ALTER TABLE habits ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user'`, () => {});
            sqliteDb.run(`ALTER TABLE habits ADD COLUMN description TEXT`, () => {});
            sqliteDb.run(`ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'General'`, () => {});
            sqliteDb.run(`ALTER TABLE habits ADD COLUMN color TEXT DEFAULT '#8b5cf6'`, () => {});
            sqliteDb.run(`ALTER TABLE habits ADD COLUMN priority TEXT DEFAULT 'Medium'`, () => {});
            console.log(`${COLORS.green}✓ Database connected (SQLite).${COLORS.reset}`);
          }
        });
      }
    });
  }
};

/* ==========================================================================
   USER DATABASE HELPERS & AUTHENTICATION
   ========================================================================== */

async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  if (dbEngine === 'postgres') {
    const { rows } = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

async function findUserById(id) {
  if (!id) return null;
  if (dbEngine === 'postgres') {
    const { rows } = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

async function createUser({ id, name, email, password, avatar, joined_date }) {
  if (dbEngine === 'postgres') {
    await pgPool.query(
      'INSERT INTO users (id, name, email, password, avatar, joined_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, name, email.trim().toLowerCase(), password, avatar, joined_date]
    );
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO users (id, name, email, password, avatar, joined_date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, email.trim().toLowerCase(), password, avatar, joined_date],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }
}

/* ==========================================================================
   AUTHENTICATION MIDDLEWARE & UNIFIED USER-ISOLATED DATABASE QUERY HELPER
   ========================================================================== */

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers['x-user-id'];

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !userIdHeader) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const rawToken = authHeader ? authHeader.split(' ')[1] : userIdHeader;
  if (!rawToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  try {
    // 1. Attempt JWT Verification
    const decoded = jwt.verify(rawToken, JWT_SECRET);
    req.userId = decoded.userId;
    console.log(`${COLORS.green}[AUTH] JWT verified for user ID: ${req.userId}${COLORS.reset}`);
    return next();
  } catch (jwtErr) {
    // 2. Fallback token format for legacy token string
    if (rawToken.startsWith('token_') || rawToken.startsWith('u_')) {
      const parts = rawToken.split('_');
      if (parts.length >= 2) {
        req.userId = parts.slice(0, 2).join('_');
        console.log(`${COLORS.yellow}[AUTH] Legacy session token accepted for user ID: ${req.userId}${COLORS.reset}`);
        return next();
      }
    }
    console.warn(`${COLORS.red}[AUTH] JWT Verification Failed (${jwtErr.message})${COLORS.reset}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/* ==========================================================================
   AUTHENTICATION API ROUTES (Register, Login, Session Check)
   ========================================================================== */

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      console.warn(`${COLORS.yellow}[AUTH] Registration rejected - Duplicate email: ${cleanEmail}${COLORS.reset}`);
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: 'u_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: passwordHash,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      joined_date: new Date().toISOString().slice(0, 10)
    };

    await createUser(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      joinedDate: newUser.joined_date
    };

    console.log(`${COLORS.green}[AUTH] User registered successfully: ${newUser.email} (ID: ${newUser.id})${COLORS.reset}`);

    res.status(201).json({
      user: userProfile,
      token
    });
  } catch (err) {
    console.error(`${COLORS.red}[AUTH] Registration error:${COLORS.reset}`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      console.warn(`${COLORS.yellow}[AUTH] Login failed - User not found: ${cleanEmail}${COLORS.reset}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare with bcrypt hash or exact match for backward compatibility
    let isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch && user.password === password) {
      isPasswordMatch = true;
    }

    if (!isPasswordMatch) {
      console.warn(`${COLORS.yellow}[AUTH] Login failed - Invalid password for: ${cleanEmail}${COLORS.reset}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      joinedDate: user.joined_date
    };

    console.log(`${COLORS.green}[AUTH] User logged in successfully: ${user.email} (ID: ${user.id})${COLORS.reset}`);

    res.status(200).json({
      user: userProfile,
      token
    });
  } catch (err) {
    console.error(`${COLORS.red}[AUTH] Login error:${COLORS.reset}`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateUser, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      console.warn(`${COLORS.yellow}[AUTH] Session verification failed - User not found ID: ${req.userId}${COLORS.reset}`);
      return res.status(404).json({ error: 'User account not found.' });
    }

    console.log(`${COLORS.green}[AUTH] Session verified for: ${user.email} (ID: ${user.id})${COLORS.reset}`);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinedDate: user.joined_date
      }
    });
  } catch (err) {
    console.error(`${COLORS.red}[AUTH] Session error:${COLORS.reset}`, err.message);
    res.status(500).json({ error: err.message });
  }
});

async function getHabitsFromDb(userId) {
  if (dbEngine === 'postgres') {
    const { rows } = await pgPool.query(
      'SELECT id, text, description, category, color, priority, "createdAt", completions FROM habits WHERE user_id = $1',
      [userId]
    );
    return rows.map(row => ({
      id: row.id,
      title: row.text || 'Untitled Habit',
      description: row.description || '',
      category: row.category || 'General',
      color: row.color || '#8b5cf6',
      priority: row.priority || 'Medium',
      createdAt: row.createdAt,
      completions: typeof row.completions === 'string' ? JSON.parse(row.completions) : row.completions
    }));
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM habits WHERE user_id = ?', [userId], (err, rows) => {
        if (err) return reject(err);
        const habits = rows.map(row => ({
          ...row,
          title: row.text || row.title || 'Untitled Habit',
          description: row.description || '',
          category: row.category || 'General',
          color: row.color || '#8b5cf6',
          priority: row.priority || 'Medium',
          completions: typeof row.completions === 'string' ? JSON.parse(row.completions) : row.completions
        }));
        resolve(habits);
      });
    });
  }
}

async function saveAllHabitsToDb(userId, habits) {
  if (dbEngine === 'postgres') {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM habits WHERE user_id = $1', [userId]);
      for (const habit of habits) {
        await client.query(
          'INSERT INTO habits (id, user_id, text, description, category, color, priority, "createdAt", completions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            habit.id,
            userId,
            habit.title || habit.text || 'Untitled Habit',
            habit.description || '',
            habit.category || 'General',
            habit.color || '#8b5cf6',
            habit.priority || 'Medium',
            habit.createdAt || new Date().toISOString().slice(0, 10),
            JSON.stringify(habit.completions || [])
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.serialize(() => {
        sqliteDb.run('BEGIN TRANSACTION');
        sqliteDb.run('DELETE FROM habits WHERE user_id = ?', [userId]);
        const stmt = sqliteDb.prepare(
          'INSERT INTO habits (id, user_id, text, description, category, color, priority, createdAt, completions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const habit of habits) {
          stmt.run(
            habit.id,
            userId,
            habit.title || habit.text || 'Untitled Habit',
            habit.description || '',
            habit.category || 'General',
            habit.color || '#8b5cf6',
            habit.priority || 'Medium',
            habit.createdAt || new Date().toISOString().slice(0, 10),
            JSON.stringify(habit.completions || [])
          );
        }
        stmt.finalize();
        sqliteDb.run('COMMIT', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

/* ==========================================================================
   API BUSINESS LOGIC & ROUTES (Protected with Authentication & User Isolation)
   ========================================================================== */

app.get('/api/habits', authenticateUser, async (req, res) => {
  try {
    const habits = await getHabitsFromDb(req.userId);
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits', authenticateUser, async (req, res) => {
  const habits = req.body;
  if (!Array.isArray(habits)) {
    return res.status(400).json({ error: 'Expected an array of habits' });
  }

  try {
    await saveAllHabitsToDb(req.userId, habits);
    res.status(200).json({ message: 'Habits saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/habits/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { completions } = req.body;

  if (!completions || !Array.isArray(completions)) {
    return res.status(400).json({ error: 'Valid completions array is required' });
  }

  try {
    const habits = await getHabitsFromDb(req.userId);
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    habits[habitIndex].completions = completions;
    await saveAllHabitsToDb(req.userId, habits);
    res.json({ message: 'Habit updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habits/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  try {
    const habits = await getHabitsFromDb(req.userId);
    const filtered = habits.filter(h => h.id !== id);
    if (habits.length === filtered.length) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    await saveAllHabitsToDb(req.userId, filtered);
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   STRICT SINGLE FIXED PORT STARTUP & GRACEFUL SHUTDOWN ARCHITECTURE
   ========================================================================== */

let activeServer = null;
let isShuttingDown = false;

async function bootstrapServer() {
  const portOccupied = await isPortInUse(FIXED_PORT);

  if (portOccupied) {
    const conflictingPid = getPidUsingPort(FIXED_PORT);
    if (conflictingPid) {
      console.warn(`${COLORS.yellow}⚠ Port ${FIXED_PORT} is in use by PID ${conflictingPid}. Stopping previous instance...${COLORS.reset}`);
      const killed = killProcessByPid(conflictingPid);
      if (killed) {
        console.log(`${COLORS.green}✓ Terminated old server process (PID ${conflictingPid}).${COLORS.reset}`);
        // Give OS 800ms to free port socket
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // Re-verify port after cleanup
    const stillOccupied = await isPortInUse(FIXED_PORT);
    if (stillOccupied) {
      const pidInfo = conflictingPid ? ` (PID ${conflictingPid})` : '';
      console.error(`\n${COLORS.red}${COLORS.bold}✖ Port ${FIXED_PORT} is already in use${pidInfo}.${COLORS.reset}`);
      console.error(`${COLORS.yellow}Please stop the conflicting application or release port ${FIXED_PORT}.${COLORS.reset}\n`);
      process.exit(1);
      return;
    }
  }

  // Initialize DB connection
  await initDb();

  // Launch Express server strictly on FIXED_PORT
  const server = app.listen(FIXED_PORT);

  server.on('listening', () => {
    activeServer = server;
    console.log(`${COLORS.green}${COLORS.bold}✓ Server running on http://localhost:${FIXED_PORT}${COLORS.reset}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`${COLORS.red}${COLORS.bold}✖ Port ${FIXED_PORT} is busy. Server startup aborted.${COLORS.reset}`);
      process.exit(1);
    } else {
      console.error(`${COLORS.red}✖ Unexpected server error:${COLORS.reset}`, err.message);
    }
  });
}

// Graceful Shutdown
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${COLORS.yellow}Received ${signal}. Cleaning up resources...${COLORS.reset}`);

  try {
    if (activeServer) {
      await new Promise((resolve) => {
        activeServer.close(() => {
          console.log(`${COLORS.green}✓ Express HTTP server closed.${COLORS.reset}`);
          resolve();
        });
      });
    }

    if (dbEngine === 'postgres' && pgPool) {
      await pgPool.end();
      console.log(`${COLORS.green}✓ PostgreSQL connection pool closed.${COLORS.reset}`);
    } else if (sqliteDb) {
      sqliteDb.close();
      console.log(`${COLORS.green}✓ SQLite database connection closed.${COLORS.reset}`);
    }

    console.log(`${COLORS.green}${COLORS.bold}✓ Server shutdown complete.${COLORS.reset}`);
    
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error(`${COLORS.red}✖ Error during shutdown:${COLORS.reset}`, err.message);
    process.exit(1);
  }
}

// Global Process Event Handlers
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

process.on('uncaughtException', (err) => {
  console.error(`${COLORS.red}${COLORS.bold}✖ Uncaught Exception:${COLORS.reset}`, err.stack || err.message);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(`${COLORS.red}${COLORS.bold}✖ Unhandled Promise Rejection:${COLORS.reset}`, reason);
});

// Start Server Bootstrap
bootstrapServer();
