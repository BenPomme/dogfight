/**
 * Space Dogfight - Main Entry Point
 * 
 * This file serves as the entry point for the application.
 */

// Import styles
import '../public/css/styles.css';

// Import the game class
import Game from './core/game';

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  // Create new game instance
  const game = new Game();
});