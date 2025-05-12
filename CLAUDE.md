# Claude Space Dogfight Project

## Project Overview

We've created a Three.js-based space dogfight game with the following features:
- Physics-based spaceship movement with inertia and drift
- Combat system with lasers and missiles
- Enemy fighters with tactical AI behaviors
- Mission objectives and progression system
- Power-ups and upgrade system
- Scoring and high-score tracking
- Immersive space environment with visual effects
- Third-person camera with smooth following

## Current Status

The project has been successfully enhanced with multiple gameplay improvements:

1. **Enhanced Game**: Created a standalone, fully-functional version that:
   - Loads Three.js directly from CDN to avoid import conflicts
   - Features proper physics, camera tracking, and responsive controls
   - Includes asteroids, weapon systems, and collision detection
   - Implements AI enemy fighters with tactical behaviors
   - Works reliably across browsers that support WebGL

2. **Gameplay Features**:
   - **AI Enemies**: Different types of enemies with varied behaviors
   - **Power-ups**: Five different power-up types with unique effects
   - **Mission System**: Multiple mission types with objectives and rewards
   - **Scoring**: Combo-based scoring system with high score tracking
   - **Visual Effects**: Nebulae, dust particles, distant stars, and planets

3. **Multiple Game Versions**: The project includes several options:
   - `2d-mode.html`: NEW! Top-down 2D combat arena with simplified controls
   - `enhanced-game.html`: The most reliable and feature-complete 3D version
   - `three-demo.html`: Simplified interactive Three.js demo
   - `playable-dogfight.html`: Styled Wing Commander-inspired UI demo
   - `wingcommander-demo.html`: Alternative Wing Commander theme UI

4. **Diagnostic Tools**: Created tools to diagnose WebGL and rendering issues:
   - WebGL capability testing
   - Three.js compatibility testing
   - Renderer initialization diagnostics
   - Input handling verification

## How to Run the Game

### Local Development
```bash
cd /Users/benjamin.pommeraud/Desktop/DogFight/space-dogfight
npm install
npm start
```
Then access the game at: http://localhost:8080

### Firebase Deployment
The game is also deployed to Firebase and can be accessed at:
https://dogfight-3ae8b.web.app

## Controls

### 3D Mode Controls (Arcade Mode)
- **W**: Accelerate/Increase throttle
- **Arrow Keys**: Control pitch (up/down) and yaw (left/right)
- **Q/E**: Roll left/right
- **Space**: Fire primary weapon (lasers)
- **D**: Fire secondary weapon (missiles)
- **ESC**: Pause game

### 2D Mode Controls
- **Up Arrow or W**: Accelerate forward
- **Down Arrow or S**: Brake/reverse
- **A/D or Left/Right Arrow**: Turn left/right
- **Space**: Fire primary weapon (lasers)
- **Shift**: Fire secondary weapon (missiles)
- **ESC**: Pause game

### Mouse Controls (Optional in 3D Mode)
- **Mouse**: Aim ship (when not in arcade mode)
- **Left Click**: Fire primary weapon
- **Right Click**: Fire secondary weapon (missiles)

## Technical Implementation

1. **Three.js Integration**: Fixed issues with Three.js integration by:
   - Using direct CDN imports to avoid bundling conflicts
   - Creating a standalone implementation that doesn't rely on module imports
   - Setting up proper camera tracking and physics calculations

2. **Rendering Pipeline**: Optimized the rendering pipeline by:
   - Using efficient material types with proper lighting
   - Implementing smooth camera following with appropriate offsets
   - Adding debug visuals (grid, axes) to assist with orientation
   - Enhanced visual effects (explosions, missile trails, laser impacts)

3. **Asset Loading**: Improved asset loading and initialization:
   - Using synchronous loading to ensure assets are available
   - Adding proper loading screens with progress indicators
   - Using fallbacks when needed to prevent rendering failures

4. **AI System**: Implemented enemy AI with the following features:
   - Enemy ships that detect and pursue the player
   - Combat tactics including attack runs and evasive maneuvers
   - Projectile weapons with visual effects
   - Health and damage systems
   - Enemy respawning to maintain combat engagement

5. **Mission System**: Created a comprehensive mission framework:
   - Multiple mission types (tutorial, defend, attack, collect, boss)
   - Objectives tracking with visual feedback
   - Mission rewards and progression
   - UI for mission selection and status

6. **Modular Architecture**: Split code into logical modules:
   - Core game mechanics in separate files
   - UI system with HUD, scoring, and mission interfaces
   - Entity system for players, enemies, and mission objects
   - Effects system for visual enhancements

7. **2D Mode Implementation**: Created a simplified top-down gameplay variant:
   - Restricted movement to a 2D plane (X and Z axes only)
   - Implemented fixed top-down camera perspective
   - Created a circular arena with visual boundary and effects
   - Added arena collision detection and bouncing physics
   - Simplified controls for more responsive handling
   - Forward/backward movement with up/down arrow keys
   - Ships shoot projectiles from their front correctly
   - Stable camera that doesn't flip or rotate

## Troubleshooting

If you encounter any issues:

1. **Rendering Issues**: If 3D elements aren't visible:
   - Try the 2d-mode.html version first (most reliable and simpler)
   - Try the enhanced-game.html version if you want 3D gameplay
   - Run the diagnostics tool to check WebGL support
   - Check browser console for specific error messages

2. **Performance Issues**:
   - Lower your browser window size for better performance
   - Close other browser tabs and applications
   - Check if hardware acceleration is enabled in your browser

3. **General Troubleshooting**:
   - Clear browser cache and reload
   - Try a different browser (Chrome is recommended)
   - For port conflicts: `lsof -ti:8080 | xargs kill -9` to free the port
   - See `deploy.md` for additional troubleshooting tips