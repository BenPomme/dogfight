import THREE from '../utils/three';
import Spaceship from '../entities/spaceship';
import InputManager from '../core/inputManager';

export default class PracticeScene {
  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Lighting
    this.setupLighting();
    
    // Input manager
    this.input = new InputManager();
    
    // Game objects
    this.ships = [];
    this.setupShips();
    
    // Game state
    this.lastTime = performance.now();
    this.isRunning = false;
    
    // Debug info
    this.debugInfo = document.createElement('div');
    this.debugInfo.style.position = 'absolute';
    this.debugInfo.style.top = '10px';
    this.debugInfo.style.left = '10px';
    this.debugInfo.style.color = 'white';
    this.debugInfo.style.fontFamily = 'monospace';
    document.body.appendChild(this.debugInfo);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(100, 100, 100);
    this.scene.add(sunLight);
  }
  
  setupShips() {
    // Create player ship
    const playerShip = new Spaceship('Player', true, this.scene, this.camera);
    playerShip.position.set(0, 0, 0);
    this.ships.push(playerShip);
    
    // Create AI ship
    const aiShip = new Spaceship('AI', false, this.scene, this.camera, playerShip);
    aiShip.position.set(50, 0, 50);
    this.ships.push(aiShip);
  }
  
  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(this.animate.bind(this));
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    // Update all ships
    this.ships.forEach(ship => {
      ship.update(deltaTime, this.input);
    });
    
    // Update camera to follow player
    const playerShip = this.ships[0];
    if (playerShip) {
      // Position camera behind player ship
      const cameraOffset = new THREE.Vector3(0, 10, 30);
      const shipPosition = playerShip.position.clone();
      const cameraPosition = shipPosition.clone().add(cameraOffset);
      this.camera.position.lerp(cameraPosition, 0.1);
      this.camera.lookAt(shipPosition);
    }
    
    // Update debug info
    this.updateDebugInfo();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateDebugInfo() {
    const playerShip = this.ships[0];
    if (!playerShip) return;
    
    const speed = playerShip.velocity.length().toFixed(2);
    const position = playerShip.position.toArray().map(v => v.toFixed(2)).join(', ');
    const health = playerShip.stats.health.toFixed(0);
    const shield = playerShip.stats.shield.toFixed(0);
    
    this.debugInfo.innerHTML = `
      Speed: ${speed} m/s<br>
      Position: (${position})<br>
      Health: ${health}%<br>
      Shield: ${shield}%<br>
      Boost: ${playerShip.boostTimeRemaining.toFixed(1)}s
    `;
  }
  
  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
} 