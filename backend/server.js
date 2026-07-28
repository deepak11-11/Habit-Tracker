require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool, Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const net = require('net');
const { execSync } = require('child_process');

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
app.use(cors());
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
      CREATE TABLE IF NOT EXISTS habits (
        id VARCHAR(255) PRIMARY KEY,
        text TEXT NOT NULL,
        "createdAt" TEXT NOT NULL,
        completions TEXT NOT NULL
      )
    `);
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
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          completions TEXT NOT NULL
        )`, (createErr) => {
          if (!createErr) {
            console.log(`${COLORS.green}✓ Database connected (SQLite).${COLORS.reset}`);
          }
        });
      }
    });
  }
};

/* ==========================================================================
   UNIFIED DATABASE QUERY HELPER
   ========================================================================== */

async function getHabitsFromDb() {
  if (dbEngine === 'postgres') {
    const { rows } = await pgPool.query('SELECT id, text, "createdAt", completions FROM habits');
    return rows.map(row => ({
      id: row.id,
      text: row.text,
      createdAt: row.createdAt,
      completions: typeof row.completions === 'string' ? JSON.parse(row.completions) : row.completions
    }));
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM habits', [], (err, rows) => {
        if (err) return reject(err);
        const habits = rows.map(row => ({
          ...row,
          completions: typeof row.completions === 'string' ? JSON.parse(row.completions) : row.completions
        }));
        resolve(habits);
      });
    });
  }
}

async function saveAllHabitsToDb(habits) {
  if (dbEngine === 'postgres') {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM habits');
      for (const habit of habits) {
        await client.query(
          'INSERT INTO habits (id, text, "createdAt", completions) VALUES ($1, $2, $3, $4)',
          [habit.id, habit.text || habit.title, habit.createdAt || new Date().toISOString().slice(0, 10), JSON.stringify(habit.completions || [])]
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
        sqliteDb.run('DELETE FROM habits');
        const stmt = sqliteDb.prepare('INSERT INTO habits (id, text, createdAt, completions) VALUES (?, ?, ?, ?)');
        for (const habit of habits) {
          stmt.run(
            habit.id, 
            habit.text || habit.title, 
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
   API BUSINESS LOGIC & ROUTES (Preserved Intact)
   ========================================================================== */

app.get('/api/habits', async (req, res) => {
  try {
    const habits = await getHabitsFromDb();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habits', async (req, res) => {
  const habits = req.body;
  if (!Array.isArray(habits)) {
    return res.status(400).json({ error: 'Expected an array of habits' });
  }

  try {
    await saveAllHabitsToDb(habits);
    res.status(200).json({ message: 'Habits saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/habits/:id', async (req, res) => {
  const { id } = req.params;
  const { completions } = req.body;

  if (!completions || !Array.isArray(completions)) {
    return res.status(400).json({ error: 'Valid completions array is required' });
  }

  try {
    const habits = await getHabitsFromDb();
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    habits[habitIndex].completions = completions;
    await saveAllHabitsToDb(habits);
    res.json({ message: 'Habit updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const habits = await getHabitsFromDb();
    const filtered = habits.filter(h => h.id !== id);
    if (habits.length === filtered.length) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    await saveAllHabitsToDb(filtered);
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
