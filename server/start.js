// Cross-platform start script for Railway
const { spawn } = require('child_process');

console.log('🚀 Starting DARES Fitness App...');

// Initialize database first
console.log('📊 Step 1: Initializing database...');
const initDb = spawn('node', ['server/init-db.js'], { stdio: 'inherit' });

initDb.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Database initialization failed with code:', code);
    process.exit(1);
  }
  
  console.log('✅ Database initialized successfully');
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
}); 