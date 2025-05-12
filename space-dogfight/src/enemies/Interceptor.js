import * as THREE from 'three';
import BaseEnemy from './BaseEnemy';

/**
 * Interceptor - Fast, agile enemy type with light weapons
 * Focuses on rapid movement and flanking maneuvers
 */
class Interceptor extends BaseEnemy {
  /**
   * Create a new Interceptor enemy
   * @param {Object} config - Enemy configuration options
   */
  constructor(config = {}) {
    // Set interceptor-specific defaults
    const interceptorConfig = {
      type: 'interceptor',
      name: 'Interceptor',
      health: 60,
      speed: 15, // Faster than standard enemies
      turnRate: 0.08, // Very agile
      score: 150,
      behaviorType: 'hunter',
      fireRate: 2, // 2 shots per second
      bodyColor: 0xff6600,
      engineColor: 0xff9900,
      // Default weapon loadout
      weaponConfig: ['laser_basic'],
      ...config
    };
    
    // Call parent constructor with interceptor configuration
    super(interceptorConfig);
    
    // Interceptor-specific properties
    this.burstFireEnabled = true;
    this.burstCount = 0;
    this.maxBurstsPerAttack = 3;
    this.burstCooldown = 0;
    this.timeBetweenBursts = 0.3;
    this.shotsPerBurst = 2;
    this.currentBurstShot = 0;
    this.timeBetweenBurstShots = 0.1;
    
    // Boost capability
    this.canBoost = true;
    this.boostSpeed = this.speed * 2;
    this.normalSpeed = this.speed;
    this.boostCooldown = 0;
    this.boostMaxCooldown = 5; // Seconds between boosts
    this.boostDuration = 0;
    this.boostMaxDuration = 1.2; // Seconds of boost
    this.isBoosting = false;
  }
  
  /**
   * Create the visual mesh for this enemy
   */
  createMesh() {
    // Create a group to hold all parts
    this.meshGroup = new THREE.Group();
    
    // Create sleek interceptor body
    const bodyGeometry = new THREE.ConeGeometry(0.8, 5, 8);
    bodyGeometry.rotateX(Math.PI / 2); // Rotate to point forward
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.bodyColor,
      emissive: new THREE.Color(this.bodyColor).multiplyScalar(0.2),
      shininess: 90
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.meshGroup.add(body);
    
    // Create thin, swept-back wings
    const wingGeometry = new THREE.BoxGeometry(5, 0.15, 1.2);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: this.bodyColor,
      emissive: new THREE.Color(this.bodyColor).multiplyScalar(0.2),
      shininess: 70
    });
    
    // Left wing - swept back
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, 0.5);
    leftWing.rotation.y = Math.PI * 0.1; // Sweep angle
    this.meshGroup.add(leftWing);
    
    // Right wing - swept back
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, 0.5);
    rightWing.rotation.y = -Math.PI * 0.1; // Sweep angle
    this.meshGroup.add(rightWing);
    
    // Create engine thrusters
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.5, 1, 8);
    engineGeometry.rotateX(Math.PI / 2);
    const engineMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x111111,
      shininess: 30
    });
    
    // Left engine
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-0.8, 0, 2);
    this.meshGroup.add(leftEngine);
    
    // Right engine
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(0.8, 0, 2);
    this.meshGroup.add(rightEngine);
    
    // Engine glow - left
    const leftEngineLight = new THREE.PointLight(this.engineColor, 2, 6);
    leftEngineLight.position.set(-0.8, 0, 2.5);
    this.meshGroup.add(leftEngineLight);
    this.leftEngineLight = leftEngineLight;
    
    // Engine glow - right
    const rightEngineLight = new THREE.PointLight(this.engineColor, 2, 6);
    rightEngineLight.position.set(0.8, 0, 2.5);
    this.meshGroup.add(rightEngineLight);
    this.rightEngineLight = rightEngineLight;
    
    // Add cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.5, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    cockpitGeometry.rotateX(Math.PI);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x222266,
      emissive: 0x0000aa,
      shininess: 100,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.4, -1);
    this.meshGroup.add(cockpit);
    
    // Store reference to the main body
    this.mesh = body;
  }
  
  /**
   * Create weapon mount points
   * @returns {Array} Array of mount point objects
   */
  createWeaponMountPoints() {
    const mountPoints = [];
    
    // Wingtip weapon mounts
    const leftMount = new THREE.Object3D();
    leftMount.position.set(-2.2, 0, -0.5);
    this.meshGroup.add(leftMount);
    mountPoints.push(leftMount);
    
    const rightMount = new THREE.Object3D();
    rightMount.position.set(2.2, 0, -0.5);
    this.meshGroup.add(rightMount);
    mountPoints.push(rightMount);
    
    return mountPoints;
  }
  
  /**
   * Override updateWeapons to implement burst fire
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateWeapons(deltaTime) {
    // Skip if dead or no target
    if (!this.isAlive || !this.target || !this.target.isAlive) return;
    
    // Check if we should begin an attack
    if (this.burstFireEnabled) {
      // Update burst cooldown
      if (this.burstCooldown > 0) {
        this.burstCooldown -= deltaTime;
        return; // Still on cooldown
      }
      
      // Check if we should fire at target
      if (this.shouldFireAtTarget()) {
        // Handle burst firing
        if (this.burstCount < this.maxBurstsPerAttack) {
          if (this.currentBurstShot < this.shotsPerBurst) {
            // Fire a shot in the burst
            this.fireWeapons();
            this.currentBurstShot++;
            
            // Set time until next shot in burst
            this.burstCooldown = this.timeBetweenBurstShots;
          } else {
            // Move to next burst
            this.currentBurstShot = 0;
            this.burstCount++;
            
            // Set time until next burst
            this.burstCooldown = this.timeBetweenBursts;
          }
        } else {
          // All bursts fired, reset
          this.burstCount = 0;
          this.currentBurstShot = 0;
          
          // Set cooldown until next attack
          this.burstCooldown = this.fireCooldown;
        }
      } else {
        // Not in position to fire, reset burst fire
        this.burstCount = 0;
        this.currentBurstShot = 0;
      }
    } else {
      // Use standard firing mechanism if burst fire is disabled
      super.updateWeapons(deltaTime);
    }
  }
  
  /**
   * Override updateBehavior to implement boost capability
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateBehavior(deltaTime) {
    // Call parent updateBehavior
    super.updateBehavior(deltaTime);
    
    // Update boost cooldown
    if (this.boostCooldown > 0) {
      this.boostCooldown -= deltaTime;
    }
    
    // Handle boost
    if (this.isBoosting) {
      // Update boost duration
      this.boostDuration -= deltaTime;
      
      // End boost if duration expired
      if (this.boostDuration <= 0) {
        this.endBoost();
      }
    } else {
      // Check if we should start a new boost
      if (this.canBoost && this.boostCooldown <= 0) {
        // Boost is more likely when closing in on the target
        if (this.behaviorState === 'seek' && Math.random() < 0.1) {
          this.startBoost();
        }
        
        // Boost is also likely when fleeing
        if (this.behaviorState === 'flee' && Math.random() < 0.3) {
          this.startBoost();
        }
      }
    }
  }
  
  /**
   * Start the speed boost
   */
  startBoost() {
    if (!this.canBoost || this.boostCooldown > 0 || this.isBoosting) return;
    
    this.isBoosting = true;
    this.speed = this.boostSpeed;
    this.boostDuration = this.boostMaxDuration;
    
    // Visual effect for boost
    this.thrusterIntensity = 3.0;
    
    if (this.leftEngineLight) {
      this.leftEngineLight.intensity = 3.0;
      this.leftEngineLight.distance = 10;
    }
    
    if (this.rightEngineLight) {
      this.rightEngineLight.intensity = 3.0;
      this.rightEngineLight.distance = 10;
    }
    
    // Create boost trail effect
    this.createBoostTrail();
  }
  
  /**
   * End the speed boost
   */
  endBoost() {
    if (!this.isBoosting) return;
    
    this.isBoosting = false;
    this.speed = this.normalSpeed;
    this.boostCooldown = this.boostMaxCooldown;
    
    // Reset engine visuals
    this.thrusterIntensity = 1.0;
    
    if (this.leftEngineLight) {
      this.leftEngineLight.intensity = 2.0;
      this.leftEngineLight.distance = this.originalLightDistance || 6;
    }
    
    if (this.rightEngineLight) {
      this.rightEngineLight.intensity = 2.0;
      this.rightEngineLight.distance = this.originalLightDistance || 6;
    }
    
    // Stop the boost trail effect
    if (this.boostTrail) {
      this.boostTrail.active = false;
    }
  }
  
  /**
   * Create visual trail effect during boost
   */
  createBoostTrail() {
    if (!this.scene) return;
    
    // Store original light distance
    if (this.leftEngineLight && !this.originalLightDistance) {
      this.originalLightDistance = this.leftEngineLight.distance;
    }
    
    // Create trail effect with particles
    const trailParticles = [];
    const particleCount = 30;
    const trailColors = [0xff9900, 0xff6600, 0xff3300];
    
    // Create initial particles
    for (let i = 0; i < particleCount; i++) {
      this.createTrailParticle(trailParticles, trailColors);
    }
    
    // Create trail update function
    const updateTrail = (deltaTime) => {
      // Check if trail is still active
      if (!this.isBoosting || !this.isAlive) {
        // Remove all particles
        trailParticles.forEach(particle => {
          if (particle.mesh && this.scene) {
            this.scene.remove(particle.mesh);
          }
        });
        return false;
      }
      
      // Update existing particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        
        // Update lifetime
        particle.lifetime += deltaTime;
        
        if (particle.lifetime >= particle.maxLifetime) {
          // Remove expired particle
          if (this.scene) {
            this.scene.remove(particle.mesh);
          }
          trailParticles.splice(i, 1);
          continue;
        }
        
        // Update particle scale and opacity based on lifetime
        const lifeRatio = 1 - (particle.lifetime / particle.maxLifetime);
        const scale = lifeRatio * particle.initialScale;
        particle.mesh.scale.set(scale, scale, scale);
        
        if (particle.mesh.material) {
          particle.mesh.material.opacity = lifeRatio * 0.7;
        }
      }
      
      // Add new particles
      const particlesPerSecond = 30;
      const particleChance = particlesPerSecond * deltaTime;
      
      if (Math.random() < particleChance) {
        this.createTrailParticle(trailParticles, trailColors);
      }
      
      return true;
    };
    
    // Add trail update to game loop
    if (this.scene.addUpdateCallback) {
      this.boostTrail = this.scene.addUpdateCallback(updateTrail);
    }
  }
  
  /**
   * Create a single trail particle
   * @param {Array} trailParticles - Array to add the particle to
   * @param {Array} trailColors - Array of possible colors
   */
  createTrailParticle(trailParticles, trailColors) {
    if (!this.scene || !this.isAlive) return;
    
    // Choose a random engine position to emit from
    const enginePosition = Math.random() < 0.5 ?
      new THREE.Vector3(-0.8, 0, 2.5) :
      new THREE.Vector3(0.8, 0, 2.5);
    
    // Transform to world position
    const worldPosition = enginePosition.clone();
    this.meshGroup.localToWorld(worldPosition);
    
    // Create particle geometry
    const size = 0.5 + Math.random() * 0.5;
    const particleGeometry = new THREE.SphereGeometry(size, 6, 6);
    
    // Random color
    const colorIndex = Math.floor(Math.random() * trailColors.length);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: trailColors[colorIndex],
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
    particleMesh.position.copy(worldPosition);
    
    // Add to scene
    this.scene.add(particleMesh);
    
    // Create particle data
    const particle = {
      mesh: particleMesh,
      lifetime: 0,
      maxLifetime: 0.3 + Math.random() * 0.3,
      initialScale: size
    };
    
    trailParticles.push(particle);
  }
  
  /**
   * Override updateVisualEffects for interceptor-specific effects
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateVisualEffects(deltaTime) {
    // Call parent updateVisualEffects
    super.updateVisualEffects(deltaTime);
    
    // Update engine glow color based on boost status
    if (this.isBoosting) {
      // Pulse engine color during boost
      const pulseFrequency = 5; // Cycles per second
      const pulseAmount = 0.3; // Amount of color variation
      const pulse = 1 + Math.sin(Date.now() / 1000 * pulseFrequency * Math.PI * 2) * pulseAmount;
      
      // Apply to both engine lights
      if (this.leftEngineLight) {
        const boostColor = new THREE.Color(this.engineColor);
        boostColor.r *= pulse;
        this.leftEngineLight.color.copy(boostColor);
      }
      
      if (this.rightEngineLight) {
        const boostColor = new THREE.Color(this.engineColor);
        boostColor.r *= pulse;
        this.rightEngineLight.color.copy(boostColor);
      }
    }
  }
}

export default Interceptor;