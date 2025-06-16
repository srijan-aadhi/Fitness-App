require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_PATH || './database/db.sqlite';
console.log('📍 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
  }
});

console.log('🗑️  Deleting all records from performance_tests table...');

db.run('DELETE FROM performance_tests', function(err) {
  if (err) {
    console.error('❌ Error deleting records:', err.message);
    process.exit(1);
  } else {
    console.log(`✅ Successfully deleted ${this.changes} records from performance_tests table`);
  }
  
  // Verify the table is empty
  db.get('SELECT COUNT(*) as count FROM performance_tests', (err, row) => {
    if (err) {
      console.error('Error checking count:', err.message);
    } else {
      console.log(`📊 Current record count in performance_tests: ${row.count}`);
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  });
}); 