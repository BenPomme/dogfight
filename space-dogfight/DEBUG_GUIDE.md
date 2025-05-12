# Space Dogfight Debugging Guide

This document provides a comprehensive guide for debugging and fixing issues with the Space Dogfight game.

## Quick Diagnosis Tools

Use these approaches to quickly identify issues:

1. **Browser Console (F12)**: Check for JavaScript errors
2. **Network Tab**: Verify all resources are loading correctly
3. **MCP Browser Tools**: Use advanced debugging features through MCP

## Common Issues and Solutions

### 1. Blank Screen / Game Doesn't Appear

**Symptoms**: Browser shows a blank screen or loading screen never disappears.

**Possible Causes & Solutions**:

1. **WebGL Initialization Failure**
   - Check browser console for WebGL-related errors
   - Verify WebGL is supported: `about:config` -> `webgl.disabled` should be `false`
   - Solution: Add fallback rendering options in `rendering.js`

2. **DOM Elements Missing**
   - Check if all required DOM elements exist (`#game-container`, etc.)
   - Solution: Ensure HTML has all required elements and proper IDs

3. **Script Loading Order**
   - Check console for "X is not defined" errors
   - Solution: Ensure Three.js is loaded before any game code

4. **Webpack Issues**
   - Check browser networks tab for 404 errors
   - Solution: Verify webpack configuration and paths

### 2. Game Loads But Doesn't Respond

**Symptoms**: Game visuals appear but controls don't work.

**Possible Causes & Solutions**:

1. **Event Listeners Not Added**
   - Check if event handlers are properly attached
   - Solution: Verify event registration in `input.js` and `inputManager.js`

2. **Event Propagation Blocked**
   - Solution: Check for `stopPropagation()` calls in event handlers

3. **Focus Issues**
   - Solution: Ensure the game container has focus for keyboard events

### 3. Visual Glitches

**Symptoms**: Strange visual artifacts, missing textures, or graphical errors.

**Possible Causes & Solutions**:

1. **Renderer Configuration**
   - Solution: Check renderer parameters in `rendering.js`

2. **Camera Issues**
   - Solution: Verify camera settings and positioning in `camera.js`

3. **Material Issues**
   - Solution: Check material definitions for all meshes

### 4. Performance Issues

**Symptoms**: Game runs slowly or stutters.

**Possible Causes & Solutions**:

1. **Too Many Objects**
   - Solution: Implement object pooling in `projectileManager.js`

2. **High Poly Models**
   - Solution: Simplify geometric models or use LOD (Level of Detail)

3. **Inefficient Rendering**
   - Solution: Use `dispose()` method to clean up unused materials and geometries

4. **Collision Detection Too Expensive**
   - Solution: Optimize collision detection in `physics.js` with spatial partitioning

### 5. Network Issues (Multiplayer)

**Symptoms**: Disconnections or lag in multiplayer mode.

**Possible Causes & Solutions**:

1. **Firebase Configuration**
   - Solution: Verify Firebase credentials and setup in `.env`

2. **WebSocket Connection Issues**
   - Solution: Check for CORS issues and proper WebSocket setup

## Diagnostic Steps

For systematically debugging the game, follow these steps:

1. **Start with a Basic Demo**
   - Use `basic-test.html` to verify Three.js is working correctly
   - Incrementally add complexity to identify breaking points

2. **Component Testing**
   - Test each component in isolation:
     - Renderer: Does it create a canvas?
     - Input: Do key events register?
     - Physics: Do object movements work?

3. **End-to-End Testing**
   - Test complete gameplay scenarios and track any issues

## Using MCP Browser Tools for Debugging

1. **Console Logs**
   ```javascript
   mcp__browser-tools__getConsoleLogs()
   ```

2. **Console Errors**
   ```javascript
   mcp__browser-tools__getConsoleErrors()
   ```

3. **Network Monitoring**
   ```javascript
   mcp__browser-tools__getNetworkLogs()
   ```

4. **Take Screenshots**
   ```javascript
   mcp__browser-tools__takeScreenshot()
   ```

5. **Performance Auditing**
   ```javascript
   mcp__browser-tools__runPerformanceAudit()
   ```

## Fixing Specific Issues

### Fixing WebGLRenderer Issues

Add this to the renderer initialization:

```javascript
try {
  this.instance = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
  });
} catch (error) {
  console.error('Error creating WebGLRenderer:', error);
  
  // Create a fallback canvas if needed
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 800;
  fallbackCanvas.height = 600;
  
  // Try again with basic settings
  this.instance = new THREE.WebGLRenderer({
    canvas: fallbackCanvas,
    antialias: false,
    alpha: false,
    powerPreference: 'low-power'
  });
  
  // Append to container
  const container = document.getElementById('game-container');
  if (container && !container.contains(this.instance.domElement)) {
    container.appendChild(this.instance.domElement);
  }
}
```

### Fixing Event Handling

Ensure event handlers are properly registered:

```javascript
// Ensure event handlers are properly bound
constructor(domElement) {
  this.domElement = domElement || window;
  this.keys = {};
  this.mouse = {
    x: 0,
    y: 0,
    leftButton: false,
    rightButton: false
  };
  
  // Bind methods to ensure 'this' context
  this.onKeyDown = this.onKeyDown.bind(this);
  this.onKeyUp = this.onKeyUp.bind(this);
  this.onMouseMove = this.onMouseMove.bind(this);
  this.onMouseDown = this.onMouseDown.bind(this);
  this.onMouseUp = this.onMouseUp.bind(this);
  
  // Add event listeners
  window.addEventListener('keydown', this.onKeyDown);
  window.addEventListener('keyup', this.onKeyUp);
  window.addEventListener('mousemove', this.onMouseMove);
  window.addEventListener('mousedown', this.onMouseDown);
  window.addEventListener('mouseup', this.onMouseUp);
}
```

## Testing the Fixes

After applying fixes, test using the following approach:

1. Start with the basic test HTML
2. Progress to the simple demo
3. Test the full game implementation

## Reporting Issues

When reporting issues, include:

1. Browser and version
2. Operating system
3. Console log output
4. Steps to reproduce
5. Screenshots of the issue