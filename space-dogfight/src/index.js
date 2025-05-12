/**
 * Space Dogfight - Main Entry Point
 *
 * This file serves as the entry point for the application.
 */

// Import styles
import './styles.css';
import THREE from './utils/three';

console.log("Space Dogfight starting...");

// Immediately hide loading screen
window.addEventListener('DOMContentLoaded', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Set a timeout to forcibly hide the loading screen after 1 second
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      console.log("Loading screen forcibly hidden");
    }, 1000);
  }
});

// Create a controllable spaceship
window.addEventListener('load', () => {
  console.log("Window loaded, creating interactive spaceship scene");
  
  // Create a simple playable scene
  const createInteractiveScene = () => {
    console.log("Creating interactive scene");
    
    // Create container
    const container = document.getElementById('game-container');
    if (!container) {
      console.error("Game container not found");
      return;
    }
    
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000020); // Dark blue background
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true });
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
      }
      
      animate();
      
      // Add instructions
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
        - Mouse: Aim
      `;
      document.body.appendChild(instructions);
      
      console.log("Interactive scene created successfully");
    } catch (error) {
      console.error("Error creating renderer:", error);
    }
  };
  
  // Execute after a delay to ensure DOM is ready
  setTimeout(createInteractiveScene, 500);
});