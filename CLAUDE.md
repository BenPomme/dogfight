# Claude Space Dogfight Project

## Project Overview

We've created a Three.js-based space dogfight game with the following features:
- Physics-based spaceship movement with inertia and drift
- Combat system with lasers and missiles
- Voice-controlled assistant drone system
- Space environment with destructible asteroids
- Third-person camera with smooth following

## Current Status

The project has been successfully debugged and is now running correctly. Key improvements:

1. **Fixed WebGL Renderer Error**: Resolved "Cannot read properties of null (reading 'width')" error by:
   - Creating a fallback canvas element when needed
   - Adding proper DOM element checks
   - Ensuring loading screen is properly displayed and hidden

2. **Fixed Three.js Import Issues**: Created a centralized Three.js import file at `/src/utils/three.js` to avoid multiple instances being loaded

3. **Developed Simplified Demo**: Created a simplified interactive spaceship demo that:
   - Properly initializes WebGL
   - Implements basic physics and controls
   - Has working keyboard and mouse input
   - Features a third-person camera

4. **Multiple Demo Versions**: The project includes several demo files for testing:
   - `index.html`: Main game entry point
   - `simple-demo.html`: Minimalist game with basic controls
   - `playable-dogfight.html`: Fully styled Wing Commander-inspired UI demo
   - `wingcommander-demo.html`: Alternative Wing Commander theme UI

## How to Run the Game

```bash
cd /Users/benjamin.pommeraud/Desktop/DogFight/space-dogfight
npm install
npm start
```

Then access the game at: http://localhost:8080

## Controls

- **W/A/S/D**: Move ship forward/left/back/right
- **Space/Shift**: Move up/down
- **Mouse**: Aim ship
- **Left Click**: Fire primary weapon
- **Right Click**: Fire secondary weapon (missiles)
- **E**: Boost
- **R**: Brake
- **V**: Activate voice commands for drones

## MCP Integration

The project now has the following MCP (Management Control Protocol) components integrated:

1. **Browser Tools**: Connected for real-time browser debugging
   - Console logs and errors monitoring
   - Network monitoring
   - Screenshot capabilities
   - Performance auditing
   - Documentation: https://browsertools.agentdesk.ai/installation

2. **Filesystem Tools**: Connected for file management
   - Reading and writing files
   - Directory operations
   - File search and manipulation

3. **GitHub Integration**: Connected for version control
   - Repository management
   - File operations
   - Pull request handling
   - Issue tracking

4. **Puppeteer**: Connected for browser automation
   - Navigation
   - UI interaction
   - DOM manipulation
   - Visual testing

## Current Development Focus

1. **Core Gameplay**: Continue refining the spaceship controls and physics
2. **Visual Improvements**: Add more visual feedback and game feel elements
3. **Feature Development**: Complete weapon systems and drone controls
4. **Firebase Integration**: Set up multiplayer features using Firebase
5. **MCP Testing**: Use integrated MCP modules for automated testing and CI/CD

## Troubleshooting

If you encounter any issues:

1. Check browser console for errors
2. Verify webpack is running correctly (port 8080)
3. Try clearing browser cache
4. For port conflicts: `lsof -ti:8080 | xargs kill -9` to free the port
5. Browser tools MCP can be used to diagnose renderer issues
6. See `deploy.md` for additional troubleshooting tips and deployment instructions