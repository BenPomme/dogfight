/**
 * Space Dogfight - Diagnostic Tool
 * 
 * This script provides diagnostic functions for identifying issues
 * with the Space Dogfight game. It can be included in any HTML page
 * to run diagnostics.
 */

// Create namespace
window.SpaceDogfightDiagnostics = {};

// Configuration
SpaceDogfightDiagnostics.config = {
  verbose: true,
  logToConsole: true, 
  logToUI: true
};

// Initialize 
SpaceDogfightDiagnostics.init = function() {
  this.logs = [];
  this.errors = [];
  this.warnings = [];
  
  if (this.config.logToUI) {
    this.setupUI();
  }
  
  this.log('Diagnostic tool initialized');
  this.detectEnvironment();
};

// Setup diagnostic UI
SpaceDogfightDiagnostics.setupUI = function() {
  const container = document.createElement('div');
  container.id = 'sd-diagnostics';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '0';
  container.style.width = '300px';
  container.style.maxHeight = '100vh';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  container.style.color = '#0f0';
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '12px';
  container.style.padding = '10px';
  container.style.zIndex = '9999';
  container.style.overflow = 'auto';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  
  const header = document.createElement('div');
  header.textContent = 'SPACE DOGFIGHT DIAGNOSTICS';
  header.style.borderBottom = '1px solid #0f0';
  header.style.marginBottom = '10px';
  header.style.paddingBottom = '5px';
  container.appendChild(header);
  
  const logContainer = document.createElement('div');
  logContainer.id = 'sd-diagnostics-log';
  logContainer.style.flexGrow = '1';
  logContainer.style.overflow = 'auto';
  container.appendChild(logContainer);
  
  document.body.appendChild(container);
  
  this.uiContainer = container;
  this.logContainer = logContainer;
};

// Log message
SpaceDogfightDiagnostics.log = function(message, type = 'info') {
  const logEntry = {
    time: new Date(),
    message: message,
    type: type
  };
  
  this.logs.push(logEntry);
  
  if (type === 'error') {
    this.errors.push(logEntry);
  } else if (type === 'warning') {
    this.warnings.push(logEntry);
  }
  
  if (this.config.logToConsole) {
    const consoleMethod = type === 'error' ? console.error : 
                         type === 'warning' ? console.warn : console.log;
    consoleMethod(`[SD Diagnostics] ${message}`);
  }
  
  if (this.config.logToUI && this.logContainer) {
    const logLine = document.createElement('div');
    logLine.textContent = `[${logEntry.time.toLocaleTimeString()}] ${message}`;
    
    if (type === 'error') {
      logLine.style.color = '#f00';
    } else if (type === 'warning') {
      logLine.style.color = '#ff0';
    }
    
    this.logContainer.appendChild(logLine);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }
};

// Detect environment
SpaceDogfightDiagnostics.detectEnvironment = function() {
  this.log('Detecting environment...');
  
  // Check WebGL support
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      this.log('WebGL not supported by your browser', 'error');
    } else {
      this.log(`WebGL supported: Version ${gl.getParameter(gl.VERSION)}`);
      
      // Get WebGL capabilities
      const extensions = gl.getSupportedExtensions();
      this.log(`WebGL extensions: ${extensions.length} available`);
      
      // Check specific extensions important for the game
      const requiredExtensions = [
        'ANGLE_instanced_arrays',
        'OES_texture_float',
        'WEBGL_compressed_texture_s3tc'
      ];
      
      for (const ext of requiredExtensions) {
        if (extensions.includes(ext)) {
          this.log(`Extension ${ext}: Available`);
        } else {
          this.log(`Extension ${ext}: Not available`, 'warning');
        }
      }
      
      // Get max texture size
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      this.log(`Max texture size: ${maxTextureSize}x${maxTextureSize}`);
    }
  } catch (e) {
    this.log(`Error detecting WebGL: ${e.message}`, 'error');
  }
  
  // Check browser features
  this.log(`User agent: ${navigator.userAgent}`);
  this.log(`Screen: ${window.screen.width}x${window.screen.height}`);
  this.log(`Window: ${window.innerWidth}x${window.innerHeight}`);
  this.log(`Device pixel ratio: ${window.devicePixelRatio}`);
  
  // Check if Three.js is loaded
  if (typeof THREE !== 'undefined') {
    this.log(`Three.js loaded: Version ${THREE.REVISION}`);
  } else {
    this.log('Three.js not loaded', 'error');
  }
  
  // Check for required DOM elements
  this.checkRequiredElements();
};

// Check required DOM elements
SpaceDogfightDiagnostics.checkRequiredElements = function() {
  const requiredElements = [
    'game-container',
    'loading-screen',
    'hud',
    'menu'
  ];
  
  for (const id of requiredElements) {
    const element = document.getElementById(id);
    if (element) {
      this.log(`Element #${id}: Found`);
    } else {
      this.log(`Element #${id}: Not found`, 'error');
    }
  }
};

// Test WebGL renderer initialization
SpaceDogfightDiagnostics.testRenderer = function() {
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 1;
    testCanvas.height = 1;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: testCanvas,
      antialias: true
    });
    
    this.log('Successfully created WebGLRenderer');
    return renderer;
  } catch (e) {
    this.log(`Failed to create WebGLRenderer: ${e.message}`, 'error');
    return null;
  }
};

// Test input handling
SpaceDogfightDiagnostics.testInput = function() {
  const testInput = {
    keydown: false,
    keyup: false,
    mousemove: false,
    mousedown: false, 
    mouseup: false
  };
  
  const keyHandler = () => { testInput.keydown = true; };
  const keyUpHandler = () => { testInput.keyup = true; };
  const mouseMoveHandler = () => { testInput.mousemove = true; };
  const mouseDownHandler = () => { testInput.mousedown = true; };
  const mouseUpHandler = () => { testInput.mouseup = true; };
  
  window.addEventListener('keydown', keyHandler);
  window.addEventListener('keyup', keyUpHandler);
  window.addEventListener('mousemove', mouseMoveHandler);
  window.addEventListener('mousedown', mouseDownHandler);
  window.addEventListener('mouseup', mouseUpHandler);
  
  this.log('Input test initialized. Please press a key and move/click your mouse.');
  
  // Check after a short period
  setTimeout(() => {
    window.removeEventListener('keydown', keyHandler);
    window.removeEventListener('keyup', keyUpHandler);
    window.removeEventListener('mousemove', mouseMoveHandler);
    window.removeEventListener('mousedown', mouseDownHandler);
    window.removeEventListener('mouseup', mouseUpHandler);
    
    this.log('Input test results:');
    this.log(`Keydown: ${testInput.keydown ? 'Detected' : 'Not detected'}`);
    this.log(`Keyup: ${testInput.keyup ? 'Detected' : 'Not detected'}`);
    this.log(`Mousemove: ${testInput.mousemove ? 'Detected' : 'Not detected'}`);
    this.log(`Mousedown: ${testInput.mousedown ? 'Detected' : 'Not detected'}`);
    this.log(`Mouseup: ${testInput.mouseup ? 'Detected' : 'Not detected'}`);
  }, 5000);
};

// Run all tests
SpaceDogfightDiagnostics.runAllTests = function() {
  this.log('Running all diagnostic tests...');
  this.detectEnvironment();
  this.testRenderer();
  this.testInput();
};

// Initialize when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SpaceDogfightDiagnostics.init());
} else {
  SpaceDogfightDiagnostics.init();
}

// Export for use in console
window.runSpaceDogfightDiagnostics = function() {
  SpaceDogfightDiagnostics.runAllTests();
};