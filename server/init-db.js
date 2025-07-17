// Initialize database for Railway deployment
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Database path logic (same as in db.js)
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/db.sqlite`
  : process.env.DB_PATH || './database/db.sqlite';

console.log('🚀 Starting database initialization...');
console.log('Database path:', dbPath);

// Ensure directory exists
const dbDirectory = path.dirname(dbPath);
if (!fs.existsSync(dbDirectory)) {
  console.log('📁 Creating database directory:', dbDirectory);
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
});

// Create tables
db.serialize(() => {
  console.log('📝 Creating users table...');
  
  // Drop and recreate users table for clean slate
  db.run(`DROP TABLE IF EXISTS users_backup`);
  
  // Create users table with all required columns
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    dob TEXT,
    gender TEXT,
    sport TEXT,
    contact TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Athlete' CHECK (role IN ('Super Admin', 'Admin', 'Tester', 'Athlete')),
    membership_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
      process.exit(1);
    }
    console.log('✅ Users table created successfully');
  });

  // Create performance_tests table
  db.run(`CREATE TABLE IF NOT EXISTS performance_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    athlete_id INTEGER,
    injury TEXT,
    injuryDetails TEXT,
    personalBest40m REAL,
    personalBest100m REAL,
    personalBest200m REAL,
    personalBest400m REAL,
    personalBest1500m REAL,
    personalBest3000m REAL,
    personalBest5000m REAL,
    personalBest10000m REAL,
    personalBestMarathon REAL,
    benchPress REAL,
    deadlift REAL,
    squat REAL,
    pullUps INTEGER,
    legPress REAL,
    shoulderPress REAL,
    tStepTest REAL,
    zigzagTest REAL,
    illinoisTest REAL,
    proAgilityTest REAL,
    signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating performance_tests table:', err.message);
    } else {
      console.log('✅ Performance tests table created successfully');
    }
  });

  // Create daily_tracking table
  db.run(`CREATE TABLE IF NOT EXISTS daily_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    membership_id TEXT,
    training_minutes TEXT,
    previous_day DATE,
    appetite TEXT,
    water_intake TEXT,
    breakfast_time TEXT,
    lunch_time TEXT,
    snack_time TEXT,
    dinner_time TEXT,
    sleep_length TEXT,
    sleep_quality TEXT,
    tiredness TEXT,
    signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating daily_tracking table:', err.message);
    } else {
      console.log('✅ Daily tracking table created successfully');
    }
  });

  // Check if admin user exists
  db.get("SELECT id FROM users WHERE role = 'Super Admin' LIMIT 1", (err, admin) => {
    if (err) {
      console.error('❌ Error checking admin user:', err.message);
      return;
    }
    
    if (!admin) {
      console.log('👤 Creating default admin user...');
      
      // Create default admin user
      bcrypt.hash('admin123', 10, (err, hashedPassword) => {
        if (err) {
          console.error('❌ Error hashing admin password:', err.message);
          return;
        }
        
        db.run(`INSERT INTO users (fullName, email, password, role, membership_id) 
                VALUES (?, ?, ?, ?, ?)`, 
          ['Admin User', 'admin@fitness-app.com', hashedPassword, 'Super Admin', 'ADMIN001'],
          function(err) {
            if (err) {
              console.error('❌ Error creating admin user:', err.message);
            } else {
              console.log('✅ Default admin user created successfully');
              console.log('📋 Admin credentials:');
              console.log('   Email: admin@fitness-app.com');
              console.log('   Password: admin123');
              console.log('   Role: Super Admin');
            }
            
            // Final verification
            db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
              if (err) {
                console.error('❌ Error counting users:', err.message);
              } else {
                console.log('📊 Total users in database:', result.count);
              }
              
              console.log('🎉 Database initialization completed successfully!');
              db.close();
              process.exit(0);
            });
          });
      });
    } else {
      console.log('✅ Admin user already exists');
      
      // Final verification
      db.get("SELECT COUNT(*) as count FROM users", (err, result) => {
        if (err) {
          console.error('❌ Error counting users:', err.message);
        } else {
          console.log('📊 Total users in database:', result.count);
        }
        
        console.log('🎉 Database initialization completed successfully!');
        db.close();
        process.exit(0);
      });
    }
  });
}); 