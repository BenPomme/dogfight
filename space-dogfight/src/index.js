/**
 * Space Dogfight - Main Entry Point
 * 
 * This file serves as the entry point for the application.
 */

// Import styles
import './styles.css';

// Import the game class
import PracticeScene from './scenes/practiceScene';

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Create and start the practice scene
  const practiceScene = new PracticeScene();
  practiceScene.start();

  // Add some basic instructions to the page
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.bottom = '20px';
  instructions.style.left = '20px';
  instructions.style.color = 'white';
  instructions.style.fontFamily = 'monospace';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  instructions.style.padding = '10px';
  instructions.innerHTML = `
    Controls:<br>
    - WASD: Move ship<br>
    - Space/Shift: Up/Down<br>
    - Mouse: Aim<br>
    - Left Click: Primary weapon<br>
    - Right Click: Secondary weapon<br>
    - E: Boost<br>
    - Q: Brake
  `;
  document.body.appendChild(instructions);
});