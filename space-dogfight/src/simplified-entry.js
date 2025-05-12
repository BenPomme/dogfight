/**
 * Space Dogfight - Simplified Entry Point with Error Handling
 * 
 * This file provides a robust entry point for the game with
 * comprehensive error handling and fallbacks.
 */

// Import styles
import './styles.css';
import THREE from './utils/three';

console.log("Space Dogfight starting (simplified entry)...");

// Force hide loading screen after timeout
window.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Set a timeout to forcibly hide the loading screen after 5 seconds
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      console.log("Loading screen forcibly hidden");
    }, 5000);
  }
});

// Create a controllable spaceship with error handling
window.addEventListener('load', () => {
  console.log("Window loaded, creating interactive spaceship scene");
  
  // Timeout to ensure DOM is fully ready
  setTimeout(() => {
    try {
      createInteractiveScene();
    } catch (error) {
      console.error("Failed to create scene:", error);
      
      // Create fallback scene on error
      try {
        createFallbackScene();
      } catch (fallbackError) {
        console.error("Failed to create fallback scene:", fallbackError);
        showErrorMessage("Failed to initialize game. Please check console for details.");
      }
    }
  }, 500);
});

// Create interactive scene
function createInteractiveScene() {
  console.log("Creating interactive scene");
  
  // Create container
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error("Game container not found");
  }
  
  // Setup scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000020); // Dark blue background
  
  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);
  
  // Renderer with fallback options
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (error) {
    console.warn("Failed to create renderer with antialias, trying fallback options:", error);
    
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    } catch (fallbackError) {
      console.warn("Failed to create renderer without antialias, trying minimal options:", fallbackError);
      
      // Create a dummy canvas we can use for initialization
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 1;
      dummyCanvas.height = 1;
      
      renderer = new THREE.WebGLRenderer({
        canvas: dummyCanvas,
        antialias: false,
        alpha: false,
        powerPreference: 'low-power'
      });
    }
  }
  
  // Set renderer properties
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);
  
  // Create a simple spaceship
  const shipGroup = new THREE.Group();
  
  // Ship body
  const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3377ff });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.rotation.x = Math.PI / 2; // Point forward
  shipGroup.add(bodyMesh);
  
  // Add wings
  const wingGeometry = new THREE.BoxGeometry(3, 0.2, 1);
  const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3377ff });
  
  // Left wing
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(-1.5, 0, 0);
  shipGroup.add(leftWing);
  
  // Right wing
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(1.5, 0, 0);
  shipGroup.add(rightWing);
  
  // Add ship to scene
  scene.add(shipGroup);
  
  // Add grid for reference
  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
  scene.add(gridHelper);
  
  // Ship physics state
  const shipState = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    speed: 0,
    maxSpeed: 30,
    acceleration: 20,
    rotationSpeed: 2
  };
  
  // Input state
  const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    mouseX: 0,
    mouseY: 0
  };
  
  // Setup input listeners
  window.addEventListener('keydown', (e) => {
    switch(e.code) {
      case 'KeyW': input.forward = true; break;
      case 'KeyS': input.backward = true; break;
      case 'KeyA': input.left = true; break;
      case 'KeyD': input.right = true; break;
      case 'Space': input.up = true; break;
      case 'ShiftLeft': input.down = true; break;
    }
  });
  
  window.addEventListener('keyup', (e) => {
    switch(e.code) {
      case 'KeyW': input.forward = false; break;
      case 'KeyS': input.backward = false; break;
      case 'KeyA': input.left = false; break;
      case 'KeyD': input.right = false; break;
      case 'Space': input.up = false; break;
      case 'ShiftLeft': input.down = false; break;
    }
  });
  
  window.addEventListener('mousemove', (e) => {
    input.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    input.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  // Game loop
  let lastTime = performance.now();
  
  function animate() {
    requestAnimationFrame(animate);
    
    try {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      // Update ship based on input
      const thrustDirection = new THREE.Vector3(0, 0, 0);
      
      if (input.forward) thrustDirection.z -= 1;
      if (input.backward) thrustDirection.z += 1;
      if (input.right) thrustDirection.x += 1;
      if (input.left) thrustDirection.x -= 1;
      if (input.up) thrustDirection.y += 1;
      if (input.down) thrustDirection.y -= 1;
      
      // Apply thrust if direction is not zero
      if (thrustDirection.length() > 0) {
        thrustDirection.normalize();
        
        // Convert local direction to world direction
        const worldThrustDir = thrustDirection.clone();
        worldThrustDir.applyEuler(shipState.rotation);
        
        // Apply acceleration
        shipState.velocity.add(
          worldThrustDir.multiplyScalar(shipState.acceleration * deltaTime)
        );
      }
      
      // Apply drag/slowdown
      shipState.velocity.multiplyScalar(0.98);
      
      // Limit maximum speed
      const speed = shipState.velocity.length();
      if (speed > shipState.maxSpeed) {
        shipState.velocity.normalize().multiplyScalar(shipState.maxSpeed);
      }
      
      // Update position
      shipState.position.add(shipState.velocity.clone().multiplyScalar(deltaTime));
      
      // Rotate ship based on mouse input (for simple turning)
      const targetRotation = new THREE.Euler(
        input.mouseY * 0.5, // Pitch
        -input.mouseX * 0.5, // Yaw
        0 // Roll
      );
      
      // Smoothly interpolate current rotation to target rotation
      shipState.rotation.x += (targetRotation.x - shipState.rotation.x) * 5 * deltaTime;
      shipState.rotation.y += (targetRotation.y - shipState.rotation.y) * 5 * deltaTime;
      
      // Update ship visual
      shipGroup.position.copy(shipState.position);
      shipGroup.rotation.copy(shipState.rotation);
      
      // Update camera to follow ship
      const cameraOffset = new THREE.Vector3(0, 5, 15);
      cameraOffset.applyEuler(shipState.rotation);
      const cameraPosition = shipState.position.clone().add(cameraOffset);
      camera.position.lerp(cameraPosition, 0.1);
      camera.lookAt(shipState.position);
      
      // Render scene
      renderer.render(scene, camera);
    } catch (error) {
      console.error("Error in animation loop:", error);
      // Continue animation to try to recover
    }
  }
  
  // Start animation
  animate();
  
  // Add instructions
  addInstructions();
  
  // Hide any loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  // Show HUD if available
  const hud = document.getElementById('hud');
  if (hud && hud.classList.contains('hidden')) {
    hud.classList.remove('hidden');
  }
  
  // Hide menu if visible
  const menu = document.getElementById('menu');
  if (menu && menu.classList.contains('active')) {
    menu.classList.remove('active');
  }
  
  console.log("Interactive scene created successfully");
}

// Create a minimal fallback scene (in case the main scene fails)
function createFallbackScene() {
  console.log("Creating fallback scene");
  
  // Get or create container
  let container = document.getElementById('game-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'game-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    document.body.appendChild(container);
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  container.appendChild(canvas);
  
  // Get context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Could not get 2D context for fallback");
  }
  
  // Draw background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1;
  
  const gridSize = 50;
  const gridExtent = 1000;
  
  ctx.beginPath();
  for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
    const screenX = canvas.width / 2 + x;
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvas.height);
  }
  
  for (let z = -gridExtent; z <= gridExtent; z += gridSize) {
    const screenY = canvas.height / 2 + z;
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvas.width, screenY);
  }
  ctx.stroke();
  
  // Draw ship
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  ctx.fillStyle = '#3377ff';
  
  // Body (triangle)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 20);
  ctx.lineTo(centerX - 10, centerY + 20);
  ctx.lineTo(centerX + 10, centerY + 20);
  ctx.closePath();
  ctx.fill();
  
  // Wings
  ctx.fillRect(centerX - 30, centerY, 20, 5);
  ctx.fillRect(centerX + 10, centerY, 20, 5);
  
  // Add instructions
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WebGL initialization failed. Using fallback renderer.', centerX, centerY + 60);
  ctx.fillText('Please try reloading or use a different browser.', centerX, centerY + 80);
  
  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  console.log("Fallback scene created");
}

// Add instruction overlay
function addInstructions() {
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.bottom = '20px';
  instructions.style.left = '20px';
  instructions.style.color = 'white';
  instructions.style.fontFamily = 'monospace';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  instructions.style.padding = '10px';
  instructions.style.borderRadius = '5px';
  instructions.innerHTML = `
    Controls:<br>
    - WASD: Move ship<br>
    - Space/Shift: Up/Down<br>
    - Mouse: Aim
  `;
  document.body.appendChild(instructions);
}

// Show error message to user
function showErrorMessage(message) {
  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  // Create error container
  const errorContainer = document.createElement('div');
  errorContainer.style.position = 'absolute';
  errorContainer.style.top = '50%';
  errorContainer.style.left = '50%';
  errorContainer.style.transform = 'translate(-50%, -50%)';
  errorContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
  errorContainer.style.color = '#ff3333';
  errorContainer.style.padding = '20px';
  errorContainer.style.borderRadius = '5px';
  errorContainer.style.textAlign = 'center';
  errorContainer.style.maxWidth = '80%';
  
  // Add error message
  const errorMessage = document.createElement('h2');
  errorMessage.textContent = 'Error';
  errorMessage.style.marginTop = '0';
  errorContainer.appendChild(errorMessage);
  
  const errorText = document.createElement('p');
  errorText.textContent = message;
  errorContainer.appendChild(errorText);
  
  // Add retry button
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.style.padding = '10px 20px';
  retryButton.style.marginTop = '15px';
  retryButton.style.backgroundColor = '#333';
  retryButton.style.color = '#fff';
  retryButton.style.border = 'none';
  retryButton.style.borderRadius = '5px';
  retryButton.style.cursor = 'pointer';
  retryButton.onclick = () => window.location.reload();
  errorContainer.appendChild(retryButton);
  
  // Add diagnostic link
  const diagLink = document.createElement('p');
  diagLink.style.marginTop = '15px';
  diagLink.style.fontSize = '14px';
  
  const link = document.createElement('a');
  link.textContent = 'Run diagnostics';
  link.href = 'diagnostics.html';
  link.style.color = '#3399ff';
  link.target = '_blank';
  
  diagLink.appendChild(link);
  errorContainer.appendChild(diagLink);
  
  // Add container to body
  document.body.appendChild(errorContainer);
}

// Export for external use
export { createInteractiveScene, createFallbackScene };