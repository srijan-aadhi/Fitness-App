const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const authMiddleware = require('./auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Register
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, dob, gender, sport, contact, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (fullName, dob, gender, sport, contact, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fullName, dob, gender, sport, contact, email, hashedPassword],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const token = jwt.sign({ id: this.lastID, email }, process.env.JWT_SECRET);
      res.json({ token });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token });
  });
});

// Submit Test
app.post('/api/performance', authMiddleware, (req, res) => {
  const { injury, squatR, squatL, pull, push, test24 } = req.body;
  const timestamp = new Date().toISOString();
  db.run(`INSERT INTO performance_tests (user_id, injury, squatR, squatL, pull, push, test24, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, injury, squatR, squatL, pull, push, test24, timestamp],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// Dashboard
app.get('/api/dashboard', authMiddleware, (req, res) => {
  db.all(`SELECT * FROM performance_tests WHERE user_id = ? ORDER BY timestamp DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      totalAthletes: 1,
      recentTests: rows.length,
      performanceRecords: rows
    });
  });
});

app.get('/api/athletes', authMiddleware, (req, res) => {
  db.all(`SELECT id, fullName FROM users WHERE id = ?`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));