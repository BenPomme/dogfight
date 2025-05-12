const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define the directory of the space-dogfight project
const GAME_DIR = path.join(__dirname, 'space-dogfight');

// Function to check if node_modules exists
function checkDependencies() {
  const nodeModulesPath = path.join(GAME_DIR, 'node_modules');
  
  return new Promise((resolve, reject) => {
    fs.access(nodeModulesPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log('Node modules not found. Installing dependencies...');
        
        // Execute npm install in the game directory
        exec('npm install', { cwd: GAME_DIR }, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error installing dependencies: ${error.message}`);
            reject(error);
            return;
          }
          
          console.log('Dependencies installed successfully.');
          console.log(stdout);
          
          if (stderr) {
            console.error(`stderr: ${stderr}`);
          }
          
          resolve();
        });
      } else {
        console.log('Dependencies already installed.');
        resolve();
      }
    });
  });
}

// Function to build the project
function buildProject() {
  return new Promise((resolve, reject) => {
    console.log('Building project using webpack...');
    
    // Execute webpack build
    exec('npx webpack --mode development', { cwd: GAME_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error building project: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log('Project built successfully.');
      console.log(stdout);
      
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      
      resolve();
    });
  });
}

// Function to start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting game server...');
    
    // Start the server script
    const server = exec('node serve_game.js', { cwd: __dirname });
    
    server.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      resolve();
    });
    
    // Keep the server running
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.kill();
      process.exit(0);
    });
  });
}

// Main function to run the entire process
async function main() {
  try {
    console.log('====== Space Dogfight Game ======');
    console.log(`Game directory: ${GAME_DIR}`);
    
    // Step 1: Check dependencies
    await checkDependencies();
    
    // Step 2: Build the project
    await buildProject();
    
    // Step 3: Start the server
    await startServer();
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Run the main function
main();