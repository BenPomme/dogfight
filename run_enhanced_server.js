const { spawn } = require('child_process');
const path = require('path');

// Start the server
console.log('Starting game server...');

// Start the enhanced server in a separate process
const serverProcess = spawn('node', ['enhanced_serve_game.js'], {
  detached: true,
  stdio: 'inherit'
});

// Unref the child process so it can run independently
serverProcess.unref();

console.log('Server started in background process.');
console.log('View the game at: http://localhost:3000/');
console.log('To stop the server, use: killall node');

// Exit this process
setTimeout(() => {
  process.exit(0);
}, 1000);