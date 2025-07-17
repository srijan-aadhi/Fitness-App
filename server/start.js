// Cross-platform start script for Railway
const { spawn } = require('child_process');

console.log('🚀 Starting DARES Fitness App v2.0.0...');

// Initialize database first
console.log('📊 Step 1: Initializing database...');
const initDb = spawn('node', ['server/init-db.js'], { stdio: 'inherit' });

// Add timeout for database initialization
const dbTimeout = setTimeout(() => {
  console.log('⚠️  Database initialization taking too long, proceeding with server startup...');
  initDb.kill();
  startServer();
}, 30000); // 30 second timeout

initDb.on('close', (code) => {
  clearTimeout(dbTimeout);
  
  if (code !== 0) {
    console.error('❌ Database initialization failed with code:', code);
    console.log('⚠️  Attempting to start server anyway...');
  } else {
    console.log('✅ Database initialized successfully');
  }
  
  startServer();
});

initDb.on('error', (err) => {
  clearTimeout(dbTimeout);
  console.error('❌ Database initialization error:', err);
  console.log('⚠️  Attempting to start server anyway...');
  startServer();
});

function startServer() {
  console.log('🌐 Step 2: Starting server...');
  
  // Start the server
  const server = spawn('node', ['server/server.js'], { stdio: 'inherit' });
  
  server.on('close', (code) => {
    console.log('🔚 Server stopped with code:', code);
    process.exit(code);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
} 