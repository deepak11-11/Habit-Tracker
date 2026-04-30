const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend from /public
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'habits.db'), (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      completions TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating table', err.message);
      }
    });
  }
});

// GET /api/habits → return all habits
app.get('/api/habits', (req, res) => {
  db.all('SELECT * FROM habits', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse completions back to array
    const habits = rows.map(row => ({
      ...row,
      completions: JSON.parse(row.completions)
    }));
    res.json(habits);
  });
});

// POST /api/habits → save/update ALL habits array
app.post('/api/habits', (req, res) => {
  const habits = req.body;
  if (!Array.isArray(habits)) {
    return res.status(400).json({ error: 'Expected an array of habits' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM habits'); // Replace all mechanism
    
    const stmt = db.prepare('INSERT INTO habits (id, text, createdAt, completions) VALUES (?, ?, ?, ?)');
    for (const habit of habits) {
      stmt.run(habit.id, habit.text, habit.createdAt, JSON.stringify(habit.completions));
    }
    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(200).json({ message: 'Habits saved successfully' });
    });
  });
});

// PUT /api/habits/:id → update single habit completions
app.put('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  const { completions } = req.body;
  
  if (!completions || !Array.isArray(completions)) {
    return res.status(400).json({ error: 'Valid completions array is required' });
  }

  db.run('UPDATE habits SET completions = ? WHERE id = ?', 
    [JSON.stringify(completions), id], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }
      res.json({ message: 'Habit updated' });
    }
  );
});

// DELETE /api/habits/:id → delete habit
app.delete('/api/habits/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM habits WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json({ message: 'Habit deleted' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
