const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, USER_ROLES, roleHelpers } = require('./db');
const authMiddleware = require('./auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Middleware to check user role
const requireRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied: No role assigned' });
    }
    
    if (!roleHelpers.hasPermission(req.user.role, minRole)) {
      return res.status(403).json({ message: `Access denied: Requires ${minRole} or higher` });
    }
    
    next();
  };
};

// Enhanced auth middleware to include role information
const enhancedAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    
    // Fetch user with role information
    db.get(`SELECT id, email, role FROM users WHERE id = ?`, [decoded.id], (err, user) => {
      if (err || !user) return res.status(401).json({ message: 'User not found' });
      req.user = user;
      next();
    });
  });
};

// Register - now includes role handling
app.post('/api/auth/signup', async (req, res) => {
  const { fullName, dob, gender, sport, contact, email, password, role = 'Athlete' } = req.body;
  
  // Validate role
  if (!roleHelpers.isValidRole(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (fullName, dob, gender, sport, contact, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [fullName, dob, gender, sport, contact, email, hashedPassword, role],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const token = jwt.sign({ id: this.lastID, email, role }, process.env.JWT_SECRET);
      res.json({ token, role });
    }
  );
});

// Login - now includes role in response
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET);
    res.json({ token, role: user.role, userId: user.id });
  });
});

// Get current user profile
app.get('/api/auth/profile', enhancedAuthMiddleware, (req, res) => {
  db.get(`SELECT id, fullName, email, role, dob, gender, sport, contact FROM users WHERE id = ?`, 
    [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    });
});

// User Management Routes (Admin and Super Admin only)

// Get all users (Admin+ only)
app.get('/api/admin/users', enhancedAuthMiddleware, requireRole('Admin'), (req, res) => {
  const { page = 1, limit = 10, role = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT id, fullName, email, role, created_at FROM users`;
  let params = [];
  
  if (role && roleHelpers.isValidRole(role)) {
    query += ` WHERE role = ?`;
    params.push(role);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Get total count for pagination
    const countQuery = role ? `SELECT COUNT(*) as total FROM users WHERE role = ?` : `SELECT COUNT(*) as total FROM users`;
    const countParams = role ? [role] : [];
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Update user role (Super Admin only for Admin roles, Admin+ for others)
app.put('/api/admin/users/:userId/role', enhancedAuthMiddleware, (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  if (!roleHelpers.isValidRole(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }
  
  // Get target user's current role
  db.get(`SELECT role FROM users WHERE id = ?`, [userId], (err, targetUser) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    // Check permissions
    const requiredRole = (role === 'Admin' || targetUser.role === 'Admin') ? 'Super Admin' : 'Admin';
    if (!roleHelpers.hasPermission(req.user.role, requiredRole)) {
      return res.status(403).json({ message: `Access denied: Requires ${requiredRole} to modify this user` });
    }
    
    // Super Admins cannot be demoted by other Super Admins (except themselves)
    if (targetUser.role === 'Super Admin' && req.user.id != userId) {
      return res.status(403).json({ message: 'Cannot modify other Super Admin accounts' });
    }
    
    db.run(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, 
      [role, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User role updated successfully' });
      });
  });
});

// Submit Test - now with role-based access
app.post('/api/performance', enhancedAuthMiddleware, requireRole('Tester'), (req, res) => {
  const { athlete_id, injury, squatR, squatL, pull, push, test24 } = req.body;
  const timestamp = new Date().toISOString();

  db.run(
    `INSERT INTO performance_tests (user_id, athlete_id, injury, squatR, squatL, pull, push, test24, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, athlete_id, injury, squatR, squatL, pull, push, test24, timestamp],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Dashboard - enhanced with role-based data access
app.get('/api/dashboard', enhancedAuthMiddleware, (req, res) => {
  // Athletes can only see their own data
  const userFilter = req.user.role === 'Athlete' ? 'WHERE user_id = ?' : '';
  const userParams = req.user.role === 'Athlete' ? [req.user.id] : [];

  db.get(
    `SELECT COUNT(*) as count FROM athletes ${userFilter}`,
    userParams,
    (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      const testQuery = req.user.role === 'Athlete' 
        ? `SELECT performance_tests.*, athletes.fullName AS athleteName
           FROM performance_tests
           LEFT JOIN athletes ON performance_tests.athlete_id = athletes.id
           WHERE performance_tests.user_id = ?
           ORDER BY performance_tests.timestamp DESC`
        : `SELECT performance_tests.*, athletes.fullName AS athleteName, users.fullName AS testerName
           FROM performance_tests
           LEFT JOIN athletes ON performance_tests.athlete_id = athletes.id
           LEFT JOIN users ON performance_tests.user_id = users.id
           ORDER BY performance_tests.timestamp DESC`;
      
      const testParams = req.user.role === 'Athlete' ? [req.user.id] : [];

      db.all(testQuery, testParams, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          totalAthletes: countRow.count,
          recentTests: rows.length,
          performanceRecords: rows,
          userRole: req.user.role
        });
      });
    }
  );
});

// GET athletes - role-based access
app.get('/api/athletes', enhancedAuthMiddleware, (req, res) => {
  // Athletes can only see themselves, others can see all
  const query = req.user.role === 'Athlete' 
    ? `SELECT id, fullName FROM athletes WHERE user_id = ?`
    : `SELECT athletes.id, athletes.fullName, users.fullName as testerName 
       FROM athletes 
       LEFT JOIN users ON athletes.user_id = users.id`;
  
  const params = req.user.role === 'Athlete' ? [req.user.id] : [];

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create new athlete - requires Tester+ role
app.post('/api/athletes', enhancedAuthMiddleware, requireRole('Tester'), (req, res) => {
  const { fullName, dob, gender, sport, contact } = req.body;
  const userId = req.user.id;

  const query = `
    INSERT INTO athletes (user_id, fullName, dob, gender, sport, contact)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [userId, fullName, dob, gender, sport, contact], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create athlete' });
    }
    res.status(201).json({ message: 'Athlete created', id: this.lastID });
  });
});

// Submit Daily Tracking - allows all authenticated users
app.post('/api/daily-tracking', enhancedAuthMiddleware, (req, res) => {
  const { 
    previousDay, 
    appetite, 
    waterIntake, 
    breakfastTime, 
    lunchTime, 
    snackTime, 
    dinnerTime,
    sleepLength,
    sleepQuality,
    tiredness,
    signature
  } = req.body;
  
  // Validate required fields
  const requiredFields = {
    previousDay, appetite, waterIntake, breakfastTime, 
    lunchTime, snackTime, dinnerTime, sleepLength, 
    sleepQuality, tiredness, signature
  };
  
  const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    });
  }

  db.run(
    `INSERT INTO daily_tracking 
     (user_id, previous_day, appetite, water_intake, breakfast_time, lunch_time, snack_time, dinner_time, 
      sleep_length, sleep_quality, tiredness, signature) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, previousDay, appetite, waterIntake, breakfastTime, lunchTime, snackTime, dinnerTime,
     sleepLength, sleepQuality, tiredness, signature],
    function (err) {
      if (err) {
        console.error('Daily tracking error:', err);
        return res.status(500).json({ error: 'Failed to save daily tracking data' });
      }
      res.json({ 
        success: true, 
        message: 'Daily tracking submitted successfully',
        id: this.lastID 
      });
    }
  );
});

// Get daily tracking history - users can see their own data, Testers+ can see all
app.get('/api/daily-tracking', enhancedAuthMiddleware, (req, res) => {
  const { page = 1, limit = 10, userId } = req.query;
  const offset = (page - 1) * limit;
  
  let query, params;
  
  if (req.user.role === 'Athlete') {
    // Athletes can only see their own data
    query = `SELECT * FROM daily_tracking WHERE user_id = ? ORDER BY previous_day DESC LIMIT ? OFFSET ?`;
    params = [req.user.id, parseInt(limit), parseInt(offset)];
  } else {
    // Testers+ can see all data, with optional user filter
    if (userId) {
      query = `SELECT dt.*, u.fullName as userName 
               FROM daily_tracking dt 
               LEFT JOIN users u ON dt.user_id = u.id 
               WHERE dt.user_id = ? 
               ORDER BY dt.previous_day DESC LIMIT ? OFFSET ?`;
      params = [userId, parseInt(limit), parseInt(offset)];
    } else {
      query = `SELECT dt.*, u.fullName as userName 
               FROM daily_tracking dt 
               LEFT JOIN users u ON dt.user_id = u.id 
               ORDER BY dt.previous_day DESC LIMIT ? OFFSET ?`;
      params = [parseInt(limit), parseInt(offset)];
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching daily tracking data:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Get total count for pagination
    const countQuery = req.user.role === 'Athlete' 
      ? `SELECT COUNT(*) as total FROM daily_tracking WHERE user_id = ?`
      : userId 
        ? `SELECT COUNT(*) as total FROM daily_tracking WHERE user_id = ?`
        : `SELECT COUNT(*) as total FROM daily_tracking`;
    
    const countParams = req.user.role === 'Athlete' 
      ? [req.user.id] 
      : userId 
        ? [userId] 
        : [];

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) return res.status(500).json({ error: err.message });
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get system statistics (Admin+ only)
app.get('/api/admin/stats', enhancedAuthMiddleware, requireRole('Admin'), (req, res) => {
  const queries = [
    `SELECT COUNT(*) as total FROM users`,
    `SELECT role, COUNT(*) as count FROM users GROUP BY role`,
    `SELECT COUNT(*) as total FROM athletes`,
    `SELECT COUNT(*) as total FROM performance_tests`
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  )).then(results => {
    res.json({
      totalUsers: results[0][0].total,
      usersByRole: results[1],
      totalAthletes: results[2][0].total,
      totalTests: results[3][0].total
    });
  }).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available user roles:', Object.values(USER_ROLES).map(r => r.name).join(', '));
});
