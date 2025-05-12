/**
 * Space Dogfight - Main Game Class
 * 
 * This class handles the core game loop and initialization.
 */

import * as THREE from 'three';
import Time from './time';
import Input from './input';
import Physics from './physics';
import Renderer from '../systems/rendering';
import Camera from '../systems/camera';
import ProjectileManager from '../systems/projectileManager';
import Spaceship from '../entities/spaceship';
import DroneController from './droneController';
import { DroneType } from '../entities/drone';

export default class Game {
  constructor() {
    // Initialize game state
    this.isRunning = false;
    this.isPaused = false;
    this.entities = [];
    this.projectiles = [];
    
    // Get DOM elements
    this.container = document.getElementById('game-container');
    this.loadingScreen = document.getElementById('loading-screen');
    this.hud = document.getElementById('hud');
    this.menu = document.getElementById('menu');
    this.droneStatusElement = document.getElementById('drone-status');
    this.voiceButtonElement = document.getElementById('voice-button');
    this.transcriptionElement = document.getElementById('voice-transcription');
    this.feedbackElement = document.getElementById('command-feedback');
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    
    // Setup ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    // Setup directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    
    // Initialize core systems
    this.time = new Time();
    this.renderer = new Renderer(null, this.scene);
    this.container.appendChild(this.renderer.instance.domElement);
    this.camera = new Camera(this.renderer.getAspect());
    this.input = new Input(this.renderer.instance.domElement);
    this.physics = new Physics();
    
    // Initialize projectile manager
    this.projectileManager = new ProjectileManager(this.scene, this.renderer, this.physics);
    
    // Setup event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    document.getElementById('start-game').addEventListener('click', this.startGame.bind(this));
    
    // Create environment
    this.createEnvironment();
    
    // Start loading assets
    this.loadAssets();
  }
  
  /**
   * Create space environment elements
   */
  createEnvironment() {
    // Create an asteroid field
    this.createAsteroidField(50, 500);
  }
  
  /**
   * Create asteroid field
   * 
   * @param {number} count - Number of asteroids to create
   * @param {number} radius - Radius of the asteroid field
   */
  createAsteroidField(count, radius) {
    const asteroids = [];
    
    for (let i = 0; i < count; i++) {
      // Create asteroid geometry
      const size = 5 + Math.random() * 15;
      const segments = 4 + Math.floor(Math.random() * 3);
      const geometry = new THREE.IcosahedronGeometry(size, segments);
      
      // Deform geometry slightly to make it look more natural
      const positions = geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        const x = positions.getX(j);
        const y = positions.getY(j);
        const z = positions.getZ(j);
        
        positions.setX(j, x + (Math.random() - 0.5) * size * 0.2);
        positions.setY(j, y + (Math.random() - 0.5) * size * 0.2);
        positions.setZ(j, z + (Math.random() - 0.5) * size * 0.2);
      }
      
      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.2
      });
      
      // Create mesh
      const asteroid = new THREE.Mesh(geometry, material);
      
      // Position asteroid randomly in a spherical volume
      const phi = Math.acos(-1 + Math.random() * 2);
      const theta = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * radius;
      
      asteroid.position.set(
        distance * Math.sin(phi) * Math.cos(theta),
        (Math.random() - 0.5) * radius * 0.5, // Flatten the field a bit
        distance * Math.sin(phi) * Math.sin(theta)
      );
      
      // Rotate asteroid randomly
      asteroid.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      // Add to scene
      this.scene.add(asteroid);
      
      // Add physics body for collision
      const asteroidBody = {
        position: asteroid.position,
        rotation: asteroid.rotation,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        ),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        radius: size,
        mass: size * size * size,
        collisionGroup: this.physics.collisionGroups.OBSTACLE,
        collisionMask: this.physics.collisionGroups.SHIP | this.physics.collisionGroups.PROJECTILE,
        health: size * 10,
        takeDamage: (damage) => {
          asteroidBody.health -= damage;
          if (asteroidBody.health <= 0) {
            // Destroy asteroid
            this.scene.remove(asteroid);
            this.physics.removeBody(asteroidBody);
            
            // Create explosion effect
            this.renderer.createExplosion(asteroid.position, size / 5, 0xaaaaaa);
            
            // Create smaller asteroid fragments if large enough
            if (size > 8) {
              const fragmentCount = 2 + Math.floor(Math.random() * 3);
              for (let k = 0; k < fragmentCount; k++) {
                // Create smaller asteroid at this position (recursive call)
                this.createAsteroidFragment(asteroid.position, size * 0.5);
              }
            }
          }
        }
      };
      
      this.physics.addBody(asteroidBody);
      
      // Store reference to physics body on mesh
      asteroid.userData.physicsBody = asteroidBody;
      
      // Add to entity list
      asteroids.push({
        mesh: asteroid,
        physicsBody: asteroidBody,
        update: (deltaTime) => {
          // Update asteroid rotation
          asteroid.rotation.x += asteroidBody.angularVelocity.x * deltaTime;
          asteroid.rotation.y += asteroidBody.angularVelocity.y * deltaTime;
          asteroid.rotation.z += asteroidBody.angularVelocity.z * deltaTime;
        }
      });
    }
    
    // Add asteroids to entities
    this.entities.push(...asteroids);
  }
  
  /**
   * Create an asteroid fragment
   * 
   * @param {THREE.Vector3} position - Position to create fragment at
   * @param {number} size - Size of the fragment
   */
  createAsteroidFragment(position, size) {
    // Create geometry
    const segments = 2 + Math.floor(Math.random() * 2);
    const geometry = new THREE.IcosahedronGeometry(size, segments);
    
    // Deform geometry
    const positions = geometry.attributes.position;
    for (let j = 0; j < positions.count; j++) {
      const x = positions.getX(j);
      const y = positions.getY(j);
      const z = positions.getZ(j);
      
      positions.setX(j, x + (Math.random() - 0.5) * size * 0.3);
      positions.setY(j, y + (Math.random() - 0.5) * size * 0.3);
      positions.setZ(j, z + (Math.random() - 0.5) * size * 0.3);
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Create mesh
    const asteroid = new THREE.Mesh(geometry, material);
    
    // Position near parent asteroid
    asteroid.position.copy(position);
    asteroid.position.x += (Math.random() - 0.5) * size;
    asteroid.position.y += (Math.random() - 0.5) * size;
    asteroid.position.z += (Math.random() - 0.5) * size;
    
    // Rotate asteroid randomly
    asteroid.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    // Add to scene
    this.scene.add(asteroid);
    
    // Add physics body
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    
    const asteroidBody = {
      position: asteroid.position,
      rotation: asteroid.rotation,
      velocity: velocity,
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      radius: size,
      mass: size * size * size,
      collisionGroup: this.physics.collisionGroups.OBSTACLE,
      collisionMask: this.physics.collisionGroups.SHIP | this.physics.collisionGroups.PROJECTILE,
      health: size * 5,
      takeDamage: (damage) => {
        asteroidBody.health -= damage;
        if (asteroidBody.health <= 0) {
          // Destroy asteroid
          this.scene.remove(asteroid);
          this.physics.removeBody(asteroidBody);
          
          // Create explosion effect
          this.renderer.createExplosion(asteroid.position, size / 5, 0xaaaaaa);
        }
      }
    };
    
    this.physics.addBody(asteroidBody);
    
    // Store reference to physics body on mesh
    asteroid.userData.physicsBody = asteroidBody;
    
    // Add to entity list
    this.entities.push({
      mesh: asteroid,
      physicsBody: asteroidBody,
      update: (deltaTime) => {
        // Update asteroid rotation
        asteroid.rotation.x += asteroidBody.angularVelocity.x * deltaTime;
        asteroid.rotation.y += asteroidBody.angularVelocity.y * deltaTime;
        asteroid.rotation.z += asteroidBody.angularVelocity.z * deltaTime;
      }
    });
  }
  
  /**
   * Load all game assets
   */
  async loadAssets() {
    // Here we would load models, textures, sounds, etc.
    // For now, let's just simulate loading with a timeout
    
    // Create loading progress bar
    const loadingBar = document.getElementById('loading-bar');
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (loadingBar) {
        loadingBar.style.width = `${progress}%`;
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.loadingScreen.style.display = 'none';
          console.log('Assets loaded');
        }, 500);
      }
    }, 100);
  }
  
  /**
   * Initialize the game
   */
  async init() {
    // Create player spaceship
    this.player = new Spaceship('Player', true, this.scene, this.camera);
    this.entities.push(this.player);
    
    // Extend spaceship class to handle weapon firing
    this.player.firePrimaryWeapon = () => {
      const primaryWeapon = this.player.stats.weapons.primary;
      const fireInterval = 1 / primaryWeapon.fireRate;
      
      if (primaryWeapon.lastFired >= fireInterval) {
        // Reset fire timer
        primaryWeapon.lastFired = 0;
        
        // Get weapon mount positions
        const leftMount = this.player.weaponMounts.primaryLeft;
        const rightMount = this.player.weaponMounts.primaryRight;
        
        // Convert to world positions
        const leftPosition = leftMount.getWorldPosition(new THREE.Vector3());
        const rightPosition = rightMount.getWorldPosition(new THREE.Vector3());
        
        // Calculate firing direction (forward along Z-axis)
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.player.group.quaternion);
        
        // Create laser projectiles
        this.projectileManager.createLaser(leftPosition, direction, this.player);
        this.projectileManager.createLaser(rightPosition, direction, this.player);
        
        // Add visual effects
        this.renderer.createMuzzleFlash(leftPosition);
        this.renderer.createMuzzleFlash(rightPosition);
        
        return true;
      }
      
      return false;
    };
    
    this.player.fireSecondaryWeapon = () => {
      const secondaryWeapon = this.player.stats.weapons.secondary;
      const fireInterval = 1 / secondaryWeapon.fireRate;
      
      if (secondaryWeapon.lastFired >= fireInterval && secondaryWeapon.ammo > 0) {
        // Reset fire timer
        secondaryWeapon.lastFired = 0;
        
        // Decrease ammo
        secondaryWeapon.ammo--;
        
        // Get weapon mount position
        const mount = this.player.weaponMounts.secondary;
        const position = mount.getWorldPosition(new THREE.Vector3());
        
        // Calculate firing direction (forward along Z-axis)
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.player.group.quaternion);
        
        // Find a target (nearest enemy in front)
        let target = null;
        
        // In a full implementation, we would search for enemy ships here
        // For now, we'll just use the nearest asteroid in front
        let minDistance = 1000;
        
        for (const entity of this.entities) {
          if (entity.mesh && entity.mesh.userData.physicsBody && entity !== this.player) {
            // Calculate direction to entity
            const toEntity = new THREE.Vector3().subVectors(entity.mesh.position, this.player.position);
            
            // Check if entity is in front (dot product with forward vector)
            const forwardDot = direction.dot(toEntity.normalize());
            if (forwardDot > 0.7) { // Within about 45 degrees of forward
              const distance = this.player.position.distanceTo(entity.mesh.position);
              if (distance < minDistance) {
                minDistance = distance;
                target = entity.mesh;
              }
            }
          }
        }
        
        // Create missile projectile
        this.projectileManager.createMissile(position, direction, this.player, target);
        
        // Add visual effect
        this.renderer.createMuzzleFlash(position, 0xff8800);
        
        return true;
      }
      
      return false;
    };
    
    // Add camera to scene
    this.scene.add(this.camera.instance);
    
    // Setup initial camera position
    this.camera.setTarget(this.player.mesh);
    
    // Initialize drone controller
    this.droneController = new DroneController({
      voiceEnabled: true,
      maxDrones: 3,
      initialDroneTypes: [DroneType.ATTACK], // Start with attack drone
      scene: this.scene,
      owner: this.player,
      droneStatusElement: this.droneStatusElement,
      voiceButtonElement: this.voiceButtonElement,
      transcriptionElement: this.transcriptionElement,
      feedbackElement: this.feedbackElement
    });
    
    // Initialize drone controller
    await this.droneController.initialize();
    
    // Update HUD
    this.updateHUD();
    
    console.log('Game initialized');
  }
  
  /**
   * Update the HUD with current player stats
   */
  updateHUD() {
    // Update health bar
    const healthValue = document.querySelector('.health-value');
    if (healthValue) {
      healthValue.style.transform = `scaleX(${this.player.stats.health / this.player.stats.maxHealth})`;
    }
    
    // Update shield bar
    const shieldValue = document.querySelector('.shield-value');
    if (shieldValue) {
      shieldValue.style.transform = `scaleX(${this.player.stats.shield / this.player.stats.maxShield})`;
    }
    
    // Update weapon ammo display
    const secondaryAmmo = document.querySelector('.weapon.secondary .weapon-ammo');
    if (secondaryAmmo) {
      secondaryAmmo.textContent = this.player.stats.weapons.secondary.ammo;
    }
    
    // Update boost indicator
    const boostValue = document.querySelector('.boost-value');
    if (boostValue) {
      boostValue.style.transform = `scaleX(${this.player.boostTimeRemaining / this.player.stats.boostDuration})`;
    }
  }
  
  /**
   * Start the game
   */
  startGame() {
    if (!this.isRunning) {
      this.init();
      this.menu.classList.remove('active');
      this.hud.classList.remove('hidden');
      this.isRunning = true;
      this.time.start();
      this.update();
    }
  }
  
  /**
   * Pause the game
   */
  pauseGame() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      // Show pause menu
      this.menu.classList.add('active');
    } else {
      // Hide pause menu
      this.menu.classList.remove('active');
    }
  }
  
  /**
   * Handle window resize
   */
  onResize() {
    this.renderer.onResize();
    this.camera.onResize(this.renderer.getAspect());
  }
  
  /**
   * Main game loop
   */
  update() {
    if (!this.isRunning) return;
    
    // Request the next frame
    requestAnimationFrame(this.update.bind(this));
    
    // Update delta time
    this.time.update();
    
    // Skip updates if game is paused
    if (this.isPaused) return;
    
    // Update input
    this.input.update();
    
    // Check for pause input
    if (this.input.isKeyPressed('Escape')) {
      this.pauseGame();
      return;
    }
    
    // Check for voice activation input
    if (this.input.isKeyJustPressed('v') || this.input.isKeyJustPressed('V')) {
      this.droneController.toggleVoiceListening();
    }
    
    // Update all entities
    for (const entity of this.entities) {
      entity.update(this.time.delta, this.input);
    }
    
    // Update projectiles
    this.projectileManager.update(this.time.delta);
    
    // Update drone controller
    this.droneController.update(this.time.delta);
    
    // Update physics
    this.physics.update(this.time.delta, this.entities);
    
    // Update camera
    this.camera.update(this.time.delta);
    
    // Update HUD
    this.updateHUD();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera.instance);
  }
  
  /**
   * Process a drone command directly (for testing without voice)
   */
  processDroneCommand(command) {
    if (this.droneController) {
      return this.droneController.processCommand(command);
    }
    return false;
  }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});