const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// Define source and destination directories
const SOURCE_DIR = path.join(__dirname, 'space-dogfight');
const DEST_DIR = path.join(__dirname, 'unreal-mcp', 'Python', 'space-dogfight');

// Function to copy files
async function copyGameFiles() {
  console.log(`Copying game files from ${SOURCE_DIR} to ${DEST_DIR}...`);
  
  try {
    // Ensure destination directory exists
    await fs.ensureDir(DEST_DIR);
    
    // Copy files
    await fs.copy(SOURCE_DIR, DEST_DIR, {
      filter: (src, dest) => {
        // Skip node_modules directory to avoid huge file copying
        if (src.includes('node_modules')) {
          return false;
        }
        return true;
      }
    });
    
    console.log('Game files copied successfully.');
    return true;
  } catch (error) {
    console.error('Error copying files:', error.message);
    return false;
  }
}

// Function to start the server pointing to the new location
function startServer() {
  console.log('Starting game server for the copied files...');
  
  // Start the server in a separate process
  const serverProcess = spawn('node', ['enhanced_serve_game.js'], {
    env: { ...process.env, GAME_DIR: DEST_DIR },
    detached: true,
    stdio: 'inherit'
  });
  
  // Unref the child process so it can run independently
  serverProcess.unref();
  
  console.log('Server started in background process.');
  console.log('View the game at: http://localhost:3000/');
  console.log('To stop the server, use: killall node');
}

// Main function
async function main() {
  console.log('====== Space Dogfight Game - Copy and Serve ======');
  
  // Copy game files
  const copySuccess = await copyGameFiles();
  
  if (copySuccess) {
    // Start server with the copied files
    startServer();
    
    console.log('Setup complete! The game should be available at http://localhost:3000/');
    
    // Exit this process
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } else {
    console.error('Failed to copy game files. Server not started.');
    process.exit(1);
  }
}

// Run the main function
main();