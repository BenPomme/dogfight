# Space Dogfight Troubleshooting Guide

This guide provides quick solutions for common issues with the Space Dogfight game.

## Quick Start

1. **Basic Test**: Open `/public/basic-test.html` to verify basic Three.js functionality
2. **Diagnostics**: Open `/public/diagnostics.html` to run comprehensive tests 
3. **Check Console**: Open browser devtools (F12) and look for errors

## Common Issues and Solutions

### 1. Blank Screen / Loading Screen Never Disappears

**Solution**:
```javascript
// In src/core/game.js:
// Add this to the constructor:
if (this.loadingScreen) {
  // Force hide loading screen after 5 seconds as fallback
  setTimeout(() => {
    this.loadingScreen.style.display = 'none';
    console.log("Loading screen forcibly hidden");
  }, 5000);
}
```

### 2. WebGL Renderer Errors

**Solution**:
```javascript
// In src/systems/rendering.js:
// Add fallback canvas creation:
try {
  this.instance = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });
} catch (error) {
  console.error('Error creating WebGLRenderer:', error);
  
  // Create a fallback canvas
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 800;
  fallbackCanvas.height = 600;
  
  this.instance = new THREE.WebGLRenderer({
    canvas: fallbackCanvas,
    antialias: false,
    alpha: false,
    powerPreference: 'low-power'
  });
  
  // Append to container
  const container = document.getElementById('game-container');
  if (container) {
    container.appendChild(this.instance.domElement);
  }
}
```

### 3. Multiple Three.js Instances

**Solution**:
- Always import Three.js from `/src/utils/three.js`
- Never use direct imports from 'three'

```javascript
// Correct way to import:
import THREE from '../utils/three';
```

### 4. Input Not Working

**Solution**:
```javascript
// In src/core/input.js:
// Ensure proper binding of event handlers:
constructor() {
  this.keys = {};
  this.mousePosition = { x: 0, y: 0 };
  this.mouseButtons = { left: false, right: false };
  
  // Bind methods to ensure proper 'this' context
  this.onKeyDown = this.onKeyDown.bind(this);
  this.onKeyUp = this.onKeyUp.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
  this.onMouseDown = this.onMouseDown.bind(this);
  this.onMouseUp = this.onMouseUp.bind(this);
  
  // Add event listeners to window to ensure they work everywhere
  window.addEventListener('keydown', this.onKeyDown);
  window.addEventListener('keyup', this.onKeyUp);
  window.addEventListener('mousemove', this.onMouseMove);
  window.addEventListener('mousedown', this.onMouseDown);
  window.addEventListener('mouseup', this.onMouseUp);
}
```

### 5. Port 8080 Already in Use

**Solution**:
```bash
# Kill process using port 8080
lsof -ti:8080 | xargs kill -9

# Then restart server
npm start
```

### 6. DOM Elements Missing

**Solution**:
- Ensure these elements exist in your HTML:
  - `#game-container`
  - `#loading-screen`
  - `#hud`
  - `#menu`

### 7. Game Doesn't Start

**Solution**:
```javascript
// In src/index.js:
// Add this fallback:
window.addEventListener('load', () => {
  setTimeout(() => {
    // If game isn't initialized after 3 seconds, force start
    if (!window.gameStarted) {
      console.log("Force starting game");
      new Game();
      window.gameStarted = true;
    }
  }, 3000);
});
```

## Diagnostic Tools

We've added several tools to help diagnose issues:

1. **Basic Test**: `/public/basic-test.html` - Simple Three.js scene to test core functionality
2. **Diagnostics Page**: `/public/diagnostics.html` - Comprehensive test suite
3. **Diagnostic Script**: `/test-tools/diagnose.js` - Add to any page for real-time diagnostics

## Using the Diagnostic Tools

1. Open `diagnostics.html` in your browser
2. Run each test to identify which components are working/failing
3. Check the console for specific error messages
4. Refer to `DEBUG_GUIDE.md` for detailed solutions

## Testing in Isolation

To verify core functionality:

1. Open `basic-test.html` which uses Three.js from CDN
2. Verify WebGL works and controls respond
3. If this works but the main game doesn't, the issue is in game initialization

## MCP Integration

The project supports these MCP components:

1. **Browser Tools**: For debugging console and performance
2. **Filesystem Tools**: For file operations
3. **GitHub Tools**: For version control
4. **Puppeteer**: For browser automation

Refer to individual tool documentation for usage.

## Need More Help?

If you're still experiencing issues:

1. Check `DEBUG_GUIDE.md` for detailed troubleshooting
2. Examine browser console errors
3. Try the `basic-test.html` demo
4. Run the diagnostic tests in `diagnostics.html`