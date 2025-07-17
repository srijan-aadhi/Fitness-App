// Diagnostic script to check server configuration
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('=== DARES Server Diagnostic ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());

// Check environment variables
console.log('\n=== Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET');
console.log('DB_PATH:', process.env.DB_PATH || 'Not set');
console.log('RAILWAY_VOLUME_MOUNT_PATH:', process.env.RAILWAY_VOLUME_MOUNT_PATH || 'Not set');

// Check database path logic
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
  ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/db.sqlite`
  : process.env.DB_PATH || './database/db.sqlite';

console.log('\n=== Database Configuration ===');
console.log('Computed DB path:', dbPath);
console.log('DB directory exists:', fs.existsSync(path.dirname(dbPath)));
console.log('DB file exists:', fs.existsSync(dbPath));

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  console.log('DB file size:', stats.size, 'bytes');
  console.log('DB file created:', stats.birthtime);
  console.log('DB file modified:', stats.mtime);
}

// Test database connection
console.log('\n=== Database Connection Test ===');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        console.error('❌ Error checking users table:', err.message);
      } else if (row) {
        console.log('✅ Users table exists');
        
        // Count users
        db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
          if (err) {
            console.error('❌ Error counting users:', err.message);
          } else {
            console.log('📊 Total users:', result.count);
          }
          
          // Check for admin user
          db.get("SELECT email, role FROM users WHERE role = 'Super Admin' LIMIT 1", (err, admin) => {
            if (err) {
              console.error('❌ Error checking admin user:', err.message);
            } else if (admin) {
              console.log('✅ Admin user found:', admin.email);
            } else {
              console.log('⚠️  No admin user found');
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error closing database:', err.message);
              } else {
                console.log('✅ Database connection closed');
              }
              
              console.log('\n=== Diagnostic Complete ===');
              process.exit(0);
            });
          });
        });
      } else {
        console.log('❌ Users table does not exist');
        db.close();
        process.exit(1);
      }
    });
  }
}); 