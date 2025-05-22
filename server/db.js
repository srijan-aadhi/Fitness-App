require('dotenv').config(); 
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    dob TEXT,
    gender TEXT,
    sport TEXT,
    contact TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS performance_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    injury TEXT,
    squatR INTEGER,
    squatL INTEGER,
    pull INTEGER,
    push INTEGER,
    test24 TEXT,
    timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

module.exports = db;