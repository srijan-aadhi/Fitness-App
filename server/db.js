require('dotenv').config(); 
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Use environment variable or fallback to default path
const dbPath = process.env.DB_PATH || './database/db.sqlite';
console.log('Using DB path:', dbPath);
console.log('DB_PATH env var:', process.env.DB_PATH);

const db = new sqlite3.Database(dbPath);

// Define valid user roles with hierarchy (higher number = higher access)
const USER_ROLES = {
  ATHLETE: { name: 'Athlete', level: 1 },
  TESTER: { name: 'Tester', level: 2 },
  ADMIN: { name: 'Admin', level: 3 },
  SUPER_ADMIN: { name: 'Super Admin', level: 4 }
};

db.serialize(() => {
  // Create users table with role column and membership_id
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT,
    dob TEXT,
    gender TEXT,
    sport TEXT,
    contact TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'Athlete' CHECK (role IN ('Super Admin', 'Admin', 'Tester', 'Athlete')),
    membership_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Handle existing table migrations
  // Add role column to existing users table if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Athlete'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding role column:', err.message);
    }
  });

  // Add membership_id column to existing users table if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN membership_id TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding membership_id column:', err.message);
    }
  });

  // Add timestamp columns with NULL defaults (SQLite compatible)
  db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding created_at column:', err.message);
    } else if (!err) {
      // If column was successfully added, update existing records
      db.run(`UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL`);
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN updated_at DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding updated_at column:', err.message);
    } else if (!err) {
      // If column was successfully added, update existing records
      db.run(`UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL`);
    }
  });

  // Update role for existing users and ensure timestamps exist
  db.run(`UPDATE users SET 
    role = 'Athlete' 
    WHERE role IS NULL OR role = ''`);
  
  // Ensure all users have timestamps
  db.run(`UPDATE users SET 
    created_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP 
    WHERE created_at IS NULL OR updated_at IS NULL`);

  db.run(`CREATE TABLE IF NOT EXISTS performance_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    athlete_id INTEGER,
    injury TEXT,
    squatR INTEGER,
    squatL INTEGER,
    pull INTEGER,
    push INTEGER,
    test24 TEXT,
    timestamp TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(athlete_id) REFERENCES athletes(id)
  )`);

  // Add athlete_id column to existing performance_tests table if it doesn't exist
  db.run(`ALTER TABLE performance_tests ADD COLUMN athlete_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding athlete_id column to performance_tests:', err.message);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS athletes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  fullName TEXT,
  dob TEXT,
  gender TEXT,
  sport TEXT,
  contact TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

  // Create daily tracking table
  db.run(`CREATE TABLE IF NOT EXISTS daily_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
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
    training_minutes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Add new columns to existing daily_tracking table if they don't exist
  db.run(`ALTER TABLE daily_tracking ADD COLUMN sleep_length TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding sleep_length column:', err.message);
    }
  });

  db.run(`ALTER TABLE daily_tracking ADD COLUMN sleep_quality TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding sleep_quality column:', err.message);
    }
  });

  db.run(`ALTER TABLE daily_tracking ADD COLUMN tiredness TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding tiredness column:', err.message);
    }
  });

  db.run(`ALTER TABLE daily_tracking ADD COLUMN signature TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding signature column:', err.message);
    }
  });

  db.run(`ALTER TABLE daily_tracking ADD COLUMN training_minutes TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding training_minutes column:', err.message);
    }
  });

  // Add membershipId column to store user-inputted membership ID values
  db.run(`ALTER TABLE daily_tracking ADD COLUMN membershipId TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding membershipId column:', err.message);
    }
  });

  // Create speed assessments table
  db.run(`CREATE TABLE IF NOT EXISTS speed_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    assessment_date DATE,
    athlete_name TEXT,
    age INTEGER,
    email TEXT,
    injury_history TEXT,
    squat_jump_right REAL,
    squat_jump_left REAL,
    squat_jump_both REAL,
    speed_10m REAL,
    air_bike_2miles REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Create strength assessments table
  db.run(`CREATE TABLE IF NOT EXISTS strength_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    athlete_id INTEGER,
    assessment_date DATE,
    squat_right REAL,
    squat_left REAL,
    pull_test REAL,
    push_test REAL,
    test_24km TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(athlete_id) REFERENCES athletes(id)
  )`);

  // Add test_24km column to existing strength_assessments table if it doesn't exist
  db.run(`ALTER TABLE strength_assessments ADD COLUMN test_24km TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding test_24km column:', err.message);
    }
  });

  // Create agility assessments table
  db.run(`CREATE TABLE IF NOT EXISTS agility_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    assessment_date DATE,
    athlete_name TEXT,
    age INTEGER,
    injury_history TEXT,
    right_test REAL,
    left_test REAL,
    four_run REAL,
    yoyo_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Create a default Super Admin user if none exists
  db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'Super Admin'`, async (err, row) => {
    if (err) {
      console.error('Error checking for Super Admin:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('Creating default Super Admin user...');
      
      // Hash the default password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      db.run(`INSERT INTO users (fullName, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, 
        ['System Administrator', 'admin@fitness-app.com', hashedPassword, 'Super Admin'], 
        function(err) {
          if (err) {
            console.error('Error creating default Super Admin:', err.message);
          } else {
            console.log('✅ Default Super Admin created with ID:', this.lastID);
            console.log('📧 Email: admin@fitness-app.com');
            console.log('🔑 Password: admin123 (CHANGE THIS IMMEDIATELY!)');
          }
        }
      );
    } else {
      console.log('✅ Super Admin already exists');
      
      // Check if existing Super Admin has unhashed password and fix it
      db.get(`SELECT id, password FROM users WHERE role = 'Super Admin' AND email = 'admin@fitness-app.com'`, async (err, user) => {
        if (err) return;
        
        if (user && user.password === 'admin123') {
          console.log('🔧 Fixing unhashed Super Admin password...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          db.run(`UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
            [hashedPassword, user.id], 
            (err) => {
              if (err) {
                console.error('Error updating Super Admin password:', err.message);
              } else {
                console.log('✅ Super Admin password properly hashed');
              }
            }
          );
        }
      });
    }
  });

});

// Helper function to generate the next sequential membership ID
function generateNextMembershipId(callback) {
  // Find the highest existing membership ID in D1xxx format
  db.get(`SELECT membership_id FROM users 
          WHERE membership_id LIKE 'D1%' 
          ORDER BY CAST(SUBSTR(membership_id, 2) AS INTEGER) DESC 
          LIMIT 1`, (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    
    let nextNumber = 1001; // Default starting number
    
    if (row && row.membership_id) {
      // Extract the number part and increment
      const currentNumber = parseInt(row.membership_id.substring(1));
      nextNumber = currentNumber + 1;
    }
    
    const newMembershipId = `D${nextNumber}`;
    callback(null, newMembershipId);
  });
}

// Helper function to ensure unique membership ID (kept for backward compatibility)
function generateUniqueMembershipId(callback) {
  generateNextMembershipId(callback);
}

// Helper functions for role management
const roleHelpers = {
  // Check if a role is valid
  isValidRole: (role) => {
    return Object.values(USER_ROLES).some(r => r.name === role);
  },

  // Get role level for comparison
  getRoleLevel: (role) => {
    const roleObj = Object.values(USER_ROLES).find(r => r.name === role);
    return roleObj ? roleObj.level : 0;
  },

  // Check if user has permission (user role level >= required role level)
  hasPermission: (userRole, requiredRole) => {
    return roleHelpers.getRoleLevel(userRole) >= roleHelpers.getRoleLevel(requiredRole);
  },

  // Check if user can manage another user (user role level > target role level)
  canManageUser: (userRole, targetRole) => {
    return roleHelpers.getRoleLevel(userRole) > roleHelpers.getRoleLevel(targetRole);
  }
};

module.exports = { db, USER_ROLES, roleHelpers, generateUniqueMembershipId };