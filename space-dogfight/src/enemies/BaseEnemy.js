import * as THREE from 'three';

/**
 * BaseEnemy class - Foundation for all enemy types
 * This class provides the core functionality that all enemies share
 */
class BaseEnemy {
  /**
   * Create a new enemy
   * @param {Object} config - Enemy configuration options
   * @param {string} config.type - Enemy type identifier
   * @param {string} config.name - Display name for this enemy
   * @param {number} config.health - Initial health points
   * @param {number} config.speed - Maximum movement speed
   * @param {number} config.turnRate - How quickly the enemy can turn
   * @param {number} config.score - Score value when defeated
   * @param {Object} config.weapon - Weapon configuration
   * @param {THREE.Scene} config.scene - The game scene
   * @param {Object} config.target - The player or target to pursue
   */
  constructor(config = {}) {
    // Basic properties
    this.type = config.type || 'basic';
    this.name = config.name || 'Enemy Ship';
    this.scene = config.scene || null;
    this.target = config.target || null;
    
    // Physical properties
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.mesh = null;
    this.meshGroup = new THREE.Group();
    this.radius = config.radius || 2.5;
    
    // Status properties
    this.health = config.health || 100;
    this.maxHealth = this.health;
    this.isAlive = true;
    this.isPlayer = false; // Needed for projectile collision checks
    
    // Gameplay properties
    this.speed = config.speed || 5;
    this.turnRate = config.turnRate || 0.03;
    this.score = config.score || 100;
    this.level = config.level || 1;
    this.experienceValue = config.experienceValue || 10;
    
    // Combat properties
    this.weaponConfig = config.weapon || null;
    this.weaponManager = null;
    this.lastShotTime = 0;
    this.fireRate = config.fireRate || 1; // Shots per second
    this.fireCooldown = 1 / this.fireRate;
    this.currentFireCooldown = 0;
    
    // Behavior properties
    this.behaviorType = config.behaviorType || 'hunter';
    this.behaviorState = 'seek'; // Initial state
    this.behaviorTimer = 0;
    this.behaviorDuration = 3; // Default state duration in seconds
    this.targetPosition = new THREE.Vector3();
    this.fleeThreshold = config.fleeThreshold || 0.3; // % of health to trigger fleeing
    
    // Visual effects
    this.engineColor = config.engineColor || 0xff3300;
    this.bodyColor = config.bodyColor || 0x660000;
    this.thrusterIntensity = 0;
    
    // Status effect tracking
    this.statusEffects = [];
    
    // Initialize the enemy
    this.init(config);
  }
  
  /**
   * Initialize the enemy
   * @param {Object} config - Configuration options
   */
  init(config) {
    // Create enemy mesh
    this.createMesh();
    
    // Set initial position
    if (config.position) {
      this.position.copy(config.position);
      this.meshGroup.position.copy(this.position);
    }
    
    // Set initial rotation
    if (config.rotation) {
      this.rotation.copy(config.rotation);
      this.meshGroup.rotation.copy(this.rotation);
    }
    
    // Add to scene
    if (this.scene) {
      this.scene.add(this.meshGroup);
    }
    
    // Setup weapons if configured
    if (config.weaponManager) {
      this.weaponManager = config.weaponManager;
      
      // Create mount points for weapons
      const mountPoints = this.createWeaponMountPoints();
      
      // Create weapons based on configuration
      if (config.weaponConfig) {
        for (const weaponType of config.weaponConfig) {
          this.weaponManager.createWeapon(weaponType, {
            level: this.level // Match weapon level to enemy level
          });
        }
      }
      
      // Attach weapons to this enemy
      this.weaponManager.attachWeaponsToParent(this, mountPoints);
    }
  }
  
  /**
   * Create the visual mesh for this enemy
   * Override in subclasses for specific enemy models
   */
  createMesh() {
    // Create a simple default enemy mesh
    // This should be overridden by specific enemy types
    
    // Ship body
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 4);
    bodyGeometry.rotateX(Math.PI / 2); // Rotate to point forward
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.bodyColor,
      emissive: new THREE.Color(this.bodyColor).multiplyScalar(0.2),
      shininess: 70
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.meshGroup.add(body);
    
    // Ship wings
    const wingGeometry = new THREE.BoxGeometry(3, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({
      color: this.bodyColor,
      emissive: new THREE.Color(this.bodyColor).multiplyScalar(0.2)
    });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, 0);
    leftWing.rotation.z = -Math.PI / 8; // Angle wings downward
    this.meshGroup.add(leftWing);
    
    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, 0);
    rightWing.rotation.z = Math.PI / 8; // Angle wings downward
    this.meshGroup.add(rightWing);
    
    // Engine glow
    const engineLight = new THREE.PointLight(this.engineColor, 2, 6);
    engineLight.position.set(0, 0, 2);
    this.meshGroup.add(engineLight);
    this.engineLight = engineLight;
    
    // Store reference to the main body for later use
    this.mesh = body;
  }
  
  /**
   * Create weapon mount points
   * @returns {Array} Array of mount point objects
   */
  createWeaponMountPoints() {
    // Create default mount points (should be overridden by specific enemy types)
    const mountPoints = [];
    
    // Forward-facing weapon mounts on the wings
    const leftMount = new THREE.Object3D();
    leftMount.position.set(-1, 0, -2);
    this.meshGroup.add(leftMount);
    mountPoints.push(leftMount);
    
    const rightMount = new THREE.Object3D();
    rightMount.position.set(1, 0, -2);
    this.meshGroup.add(rightMount);
    mountPoints.push(rightMount);
    
    return mountPoints;
  }
  
  /**
   * Update enemy state
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @param {Array} obstacles - Array of obstacles to avoid
   * @returns {boolean} Whether the enemy is still active
   */
  update(deltaTime, obstacles = []) {
    if (!this.isAlive) return false;
    
    // Update behavior state
    this.updateBehavior(deltaTime);
    
    // Update movement
    this.updateMovement(deltaTime, obstacles);
    
    // Update weapons
    this.updateWeapons(deltaTime);
    
    // Update status effects
    this.updateStatusEffects(deltaTime);
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
    
    return true;
  }
  
  /**
   * Update enemy behavior state
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateBehavior(deltaTime) {
    // Update behavior timer
    this.behaviorTimer -= deltaTime;
    
    // Check if we need to change state
    if (this.behaviorTimer <= 0) {
      this.chooseBehaviorState();
    }
    
    // Health-based behavior changes
    const healthPercent = this.health / this.maxHealth;
    if (healthPercent < this.fleeThreshold && this.behaviorState !== 'flee') {
      this.behaviorState = 'flee';
      this.behaviorTimer = 4; // Flee for 4 seconds
    }
    
    // Execute current behavior
    switch (this.behaviorState) {
      case 'seek':
        this.behaviorSeek();
        break;
      case 'strafe':
        this.behaviorStrafe();
        break;
      case 'circle':
        this.behaviorCircle();
        break;
      case 'flee':
        this.behaviorFlee();
        break;
      case 'idle':
        this.behaviorIdle();
        break;
    }
  }
  
  /**
   * Choose a new behavior state
   */
  chooseBehaviorState() {
    // Different enemy types should prioritize different behaviors
    let availableStates = [];
    
    switch (this.behaviorType) {
      case 'hunter':
        availableStates = ['seek', 'strafe']; // Hunter prioritizes aggressive behaviors
        break;
      case 'scout':
        availableStates = ['circle', 'flee', 'strafe']; // Scout prioritizes evasive behaviors
        break;
      case 'sniper':
        availableStates = ['circle', 'strafe', 'idle']; // Sniper prioritizes distance attacks
        break;
      default:
        availableStates = ['seek', 'strafe', 'circle', 'idle'];
    }
    
    // Choose a random state from available ones
    const newState = availableStates[Math.floor(Math.random() * availableStates.length)];
    this.behaviorState = newState;
    
    // Set duration based on state
    switch (newState) {
      case 'seek':
        this.behaviorDuration = 2 + Math.random() * 2;
        break;
      case 'strafe':
        this.behaviorDuration = 1.5 + Math.random() * 1.5;
        break;
      case 'circle':
        this.behaviorDuration = 3 + Math.random() * 3;
        break;
      case 'idle':
        this.behaviorDuration = 1 + Math.random() * 1;
        break;
      case 'flee':
        this.behaviorDuration = 2 + Math.random() * 2;
        break;
    }
    
    this.behaviorTimer = this.behaviorDuration;
  }
  
  /**
   * Behavior: Seek target directly
   */
  behaviorSeek() {
    if (!this.target) return;
    
    // Simply set target position to target's position
    this.targetPosition.copy(this.target.position);
  }
  
  /**
   * Behavior: Strafe around target
   */
  behaviorStrafe() {
    if (!this.target) return;
    
    // Get direction to target
    const toTarget = new THREE.Vector3().subVectors(
      this.target.position,
      this.position
    );
    
    // Calculate perpendicular direction for strafing
    const strafeDirection = new THREE.Vector3(
      -toTarget.z,
      0,
      toTarget.x
    ).normalize();
    
    // Alternate strafing direction
    if (!this.strafeRight) {
      strafeDirection.multiplyScalar(-1);
    }
    
    // Calculate strafe position (to the side of target)
    const optimalDistance = 20; // Desired distance from target
    const currentDistance = toTarget.length();
    
    // Adjust to maintain optimal distance
    const distanceAdjustment = (currentDistance - optimalDistance) * 0.5;
    const adjustedDirection = toTarget.clone().normalize().multiplyScalar(distanceAdjustment);
    
    // Combine strafe and distance adjustment
    this.targetPosition.copy(this.position).add(
      strafeDirection.multiplyScalar(10).add(adjustedDirection)
    );
  }
  
  /**
   * Behavior: Circle around target
   */
  behaviorCircle() {
    if (!this.target) return;
    
    // Get direction to target
    const toTarget = new THREE.Vector3().subVectors(
      this.target.position,
      this.position
    );
    
    // Get current distance to target
    const currentDistance = toTarget.length();
    
    // Set orbit distance
    const orbitDistance = 25;
    
    // Calculate orbit direction (normalized perpendicular vector)
    const orbitDirection = new THREE.Vector3(
      -toTarget.z,
      0,
      toTarget.x
    ).normalize();
    
    // Alternate orbit direction
    if (this.orbitClockwise) {
      orbitDirection.multiplyScalar(-1);
    }
    
    // Calculate desired position (tangent to circle)
    const desiredPosition = this.position.clone().add(
      orbitDirection.multiplyScalar(5)
    );
    
    // Adjust to maintain orbit distance
    const distanceAdjustment = (currentDistance - orbitDistance) * 0.5;
    if (Math.abs(distanceAdjustment) > 0.5) {
      const adjustedDirection = toTarget.clone().normalize().multiplyScalar(distanceAdjustment);
      desiredPosition.add(adjustedDirection);
    }
    
    // Set target position
    this.targetPosition.copy(desiredPosition);
  }
  
  /**
   * Behavior: Flee from target
   */
  behaviorFlee() {
    if (!this.target) return;
    
    // Get direction away from target
    const fleeDirection = new THREE.Vector3().subVectors(
      this.position,
      this.target.position
    ).normalize();
    
    // Set target position far away in flee direction
    this.targetPosition.copy(this.position).add(
      fleeDirection.multiplyScalar(50)
    );
    
    // Add randomness to flee direction
    this.targetPosition.x += (Math.random() - 0.5) * 20;
    this.targetPosition.z += (Math.random() - 0.5) * 20;
  }
  
  /**
   * Behavior: Idle/hover in place
   */
  behaviorIdle() {
    // Stay at current position with small random movement
    this.targetPosition.copy(this.position);
    this.targetPosition.x += (Math.random() - 0.5) * 5;
    this.targetPosition.z += (Math.random() - 0.5) * 5;
  }
  
  /**
   * Update movement based on current behavior
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @param {Array} obstacles - Array of obstacles to avoid
   */
  updateMovement(deltaTime, obstacles = []) {
    // Calculate desired velocity vector
    const desiredVelocity = new THREE.Vector3().subVectors(
      this.targetPosition,
      this.position
    );
    
    // If target is close enough, slow down
    const distanceToTarget = desiredVelocity.length();
    if (distanceToTarget < 5) {
      desiredVelocity.normalize().multiplyScalar(this.speed * (distanceToTarget / 5));
    } else {
      desiredVelocity.normalize().multiplyScalar(this.speed);
    }
    
    // Apply obstacle avoidance
    this.avoidObstacles(desiredVelocity, obstacles);
    
    // Apply arena boundary constraints
    this.applyBoundaryConstraints(desiredVelocity);
    
    // Smoothly adjust current velocity towards desired velocity
    this.velocity.lerp(desiredVelocity, 0.1);
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.meshGroup.position.copy(this.position);
    
    // Update rotation to face movement direction
    if (this.velocity.lengthSq() > 0.1) {
      // Create target rotation that looks in velocity direction
      const targetRotation = new THREE.Quaternion();
      
      // Get look direction (opposite of velocity for enemy ships)
      const lookDirection = this.velocity.clone().normalize();
      
      // Create target rotation
      const forward = new THREE.Vector3(0, 0, -1);
      targetRotation.setFromUnitVectors(forward, lookDirection);
      
      // Convert to Euler angles
      const targetEuler = new THREE.Euler().setFromQuaternion(targetRotation);
      
      // Smoothly interpolate current rotation towards target rotation
      this.rotation.x += (targetEuler.x - this.rotation.x) * this.turnRate * deltaTime * 60;
      this.rotation.y += (targetEuler.y - this.rotation.y) * this.turnRate * deltaTime * 60;
      this.rotation.z += (targetEuler.z - this.rotation.z) * this.turnRate * deltaTime * 60;
      
      // Update mesh rotation
      this.meshGroup.rotation.copy(this.rotation);
    }
  }
  
  /**
   * Apply obstacle avoidance to desired velocity
   * @param {THREE.Vector3} desiredVelocity - The current desired velocity
   * @param {Array} obstacles - Array of obstacles to avoid
   */
  avoidObstacles(desiredVelocity, obstacles) {
    // Skip if no obstacles
    if (!obstacles || obstacles.length === 0) return;
    
    // Check for nearby obstacles
    const avoidanceRadius = this.radius * 5; // Look further ahead for obstacles
    let strongestAvoidance = null;
    let closestDistance = Infinity;
    
    for (const obstacle of obstacles) {
      // Skip self
      if (obstacle === this) continue;
      
      // Skip dead obstacles
      if (obstacle.isAlive === false) continue;
      
      // Calculate distance
      const distance = this.position.distanceTo(obstacle.position);
      const combinedRadius = this.radius + (obstacle.radius || 2);
      
      // Check if obstacle is within avoidance radius
      if (distance < avoidanceRadius + combinedRadius) {
        // Calculate avoidance force
        const avoidanceForce = new THREE.Vector3().subVectors(
          this.position,
          obstacle.position
        ).normalize();
        
        // Scale by closeness (closer = stronger force)
        const closeness = 1 - (distance / (avoidanceRadius + combinedRadius));
        avoidanceForce.multiplyScalar(closeness * this.speed * 2);
        
        // Keep track of the closest obstacle
        if (distance < closestDistance) {
          closestDistance = distance;
          strongestAvoidance = avoidanceForce;
        }
      }
    }
    
    // Apply the strongest avoidance force
    if (strongestAvoidance) {
      desiredVelocity.add(strongestAvoidance);
      desiredVelocity.normalize().multiplyScalar(this.speed);
    }
  }
  
  /**
   * Apply arena boundary constraints
   * @param {THREE.Vector3} desiredVelocity - The current desired velocity
   */
  applyBoundaryConstraints(desiredVelocity) {
    // Apply arena boundary - prevent ships from leaving the arena
    const arenaRadius = 150; // Should match the game arena size
    const distanceFromCenter = Math.sqrt(
      this.position.x * this.position.x +
      this.position.z * this.position.z
    );
    
    // Apply boundary force if approaching edge
    if (distanceFromCenter > arenaRadius - 15) {
      // Calculate inward direction
      const inwardDirection = new THREE.Vector3(
        -this.position.x / distanceFromCenter,
        0,
        -this.position.z / distanceFromCenter
      );
      
      // Stronger avoidance as we get closer to the edge
      const boundaryCloseness = (distanceFromCenter - (arenaRadius - 15)) / 15;
      const boundaryForce = inwardDirection.multiplyScalar(
        boundaryCloseness * this.speed * 4
      );
      
      // Add to desired velocity
      desiredVelocity.add(boundaryForce);
      desiredVelocity.normalize().multiplyScalar(this.speed);
    }
  }
  
  /**
   * Update weapon firing
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateWeapons(deltaTime) {
    // Update weapon cooldown
    if (this.currentFireCooldown > 0) {
      this.currentFireCooldown -= deltaTime;
    }
    
    // Check if we have a target and if we should fire
    if (this.target && this.target.isAlive && this.shouldFireAtTarget()) {
      // If cooldown expired, fire weapons
      if (this.currentFireCooldown <= 0) {
        this.fireWeapons();
        
        // Reset cooldown
        this.currentFireCooldown = this.fireCooldown;
      }
    }
  }
  
  /**
   * Determine if the enemy should fire at the target
   * @returns {boolean} Whether to fire weapons
   */
  shouldFireAtTarget() {
    if (!this.target) return false;
    
    // Calculate distance to target
    const distanceToTarget = this.position.distanceTo(this.target.position);
    
    // Check if target is within firing range
    const firingRange = 50; // Default firing range
    if (distanceToTarget > firingRange) return false;
    
    // Check if we are facing the target
    const toTarget = new THREE.Vector3().subVectors(
      this.target.position,
      this.position
    ).normalize();
    
    // Get forward direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.meshGroup.quaternion);
    
    // Calculate dot product (1 = perfect alignment, -1 = opposite direction)
    const dotProduct = forward.dot(toTarget);
    
    // Only fire if we're somewhat facing the target
    return dotProduct > 0.7;
  }
  
  /**
   * Fire weapons at target
   */
  fireWeapons() {
    // If we have a weapon manager, use it to fire
    if (this.weaponManager) {
      this.weaponManager.fireOnce();
    }
  }
  
  /**
   * Update status effects
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateStatusEffects(deltaTime) {
    // Update active status effects
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];
      
      // Update duration
      effect.duration -= deltaTime;
      
      // Remove expired effects
      if (effect.duration <= 0) {
        // Apply removal effect
        if (effect.onRemove) {
          effect.onRemove(this);
        }
        
        this.statusEffects.splice(i, 1);
      }
      
      // Apply periodic effect
      if (effect.onTick) {
        effect.tickTimer -= deltaTime;
        if (effect.tickTimer <= 0) {
          effect.onTick(this);
          effect.tickTimer = effect.tickInterval;
        }
      }
    }
  }
  
  /**
   * Update visual effects based on movement and status
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateVisualEffects(deltaTime) {
    // Engine glow based on speed
    const speedRatio = this.velocity.length() / this.speed;
    this.thrusterIntensity = 1 + speedRatio * 1.5;
    
    // Update engine light
    if (this.engineLight) {
      this.engineLight.intensity = this.thrusterIntensity;
    }
    
    // Flash when damaged
    if (this.justDamaged) {
      if (this.mesh) {
        this.mesh.material.emissive.set(0xff0000);
        this.justDamaged = false;
        
        // Reset after a short time
        setTimeout(() => {
          if (this.mesh && this.mesh.material) {
            this.mesh.material.emissive.set(new THREE.Color(this.bodyColor).multiplyScalar(0.2));
          }
        }, 100);
      }
    }
  }
  
  /**
   * Take damage from an attack
   * @param {number} amount - Amount of damage to take
   * @param {Object} source - Source of the damage
   * @returns {boolean} Whether the enemy is still alive
   */
  takeDamage(amount, source) {
    // Apply damage
    this.health -= amount;
    this.justDamaged = true;
    
    // Check if dead
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle enemy death
   */
  die() {
    if (!this.isAlive) return;
    
    this.isAlive = false;
    
    // Create explosion effect
    this.createExplosionEffect();
    
    // Remove from scene
    if (this.scene) {
      this.scene.remove(this.meshGroup);
    }
    
    // Drop items/power-ups
    this.dropItems();
  }
  
  /**
   * Create explosion effect when the enemy dies
   */
  createExplosionEffect() {
    if (!this.scene) return;
    
    // Create explosion at enemy position
    const explosionPosition = this.position.clone();
    
    // Create explosion light
    const explosionLight = new THREE.PointLight(0xff9900, 5, 20);
    explosionLight.position.copy(explosionPosition);
    this.scene.add(explosionLight);
    
    // Create explosion geometry
    const explosionGeometry = new THREE.SphereGeometry(3, 16, 16);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(explosionPosition);
    this.scene.add(explosion);
    
    // Create particle system for debris
    const particleCount = 30;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create particle geometry
      const size = 0.2 + Math.random() * 0.8;
      let particleGeometry;
      
      // Random shape for particles
      const shapeType = Math.floor(Math.random() * 3);
      switch (shapeType) {
        case 0:
          particleGeometry = new THREE.BoxGeometry(size, size, size);
          break;
        case 1:
          particleGeometry = new THREE.SphereGeometry(size / 2, 4, 4);
          break;
        case 2:
          particleGeometry = new THREE.TetrahedronGeometry(size / 2);
          break;
      }
      
      // Material with enemy color
      const particleMaterial = new THREE.MeshPhongMaterial({
        color: this.bodyColor,
        emissive: 0xff3300,
        shininess: 30
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(explosionPosition);
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      
      // Random rotation
      const rotation = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      
      // Particle data
      particle.userData = {
        velocity,
        rotation,
        lifetime: 0,
        maxLifetime: 1 + Math.random() * 2
      };
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Animate explosion
    let age = 0;
    const maxAge = 2;
    
    const updateExplosion = (deltaTime) => {
      age += deltaTime;
      
      // Update explosion
      const scale = 1 + age * 2;
      explosion.scale.set(scale, scale, scale);
      explosionMaterial.opacity = 0.9 * (1 - age / maxAge);
      
      // Update explosion light
      explosionLight.intensity = 5 * (1 - age / maxAge);
      
      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const data = particle.userData;
        
        // Update lifetime
        data.lifetime += deltaTime;
        if (data.lifetime >= data.maxLifetime) {
          this.scene.remove(particle);
          particles.splice(i, 1);
          continue;
        }
        
        // Update position
        particle.position.add(data.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply gravity
        data.velocity.y -= 9.8 * deltaTime;
        
        // Apply drag
        data.velocity.multiplyScalar(0.98);
        
        // Update rotation
        particle.rotation.x += data.rotation.x * deltaTime;
        particle.rotation.y += data.rotation.y * deltaTime;
        particle.rotation.z += data.rotation.z * deltaTime;
        
        // Fade out
        if (particle.material.opacity !== undefined) {
          particle.material.opacity = 1 - (data.lifetime / data.maxLifetime);
        }
      }
      
      // Remove explosion when finished
      if (age >= maxAge) {
        this.scene.remove(explosion);
        this.scene.remove(explosionLight);
        
        // Remove any remaining particles
        particles.forEach(particle => {
          this.scene.remove(particle);
        });
        
        return false;
      }
      
      return true;
    };
    
    // Add to game update loop
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateExplosion);
    }
  }
  
  /**
   * Drop items, power-ups, or currency on death
   */
  dropItems() {
    // This is handled by a central loot/item system
    // We'll implement item dropping in a separate class
    
    // Notify game manager of enemy death for scoring and drops
    if (this.onDestroy) {
      this.onDestroy({
        position: this.position.clone(),
        type: this.type,
        level: this.level,
        score: this.score,
        experienceValue: this.experienceValue
      });
    }
  }
  
  /**
   * Apply a status effect to the enemy
   * @param {Object} effect - The status effect to apply
   */
  applyStatusEffect(effect) {
    // Check if this effect type already exists
    const existingEffect = this.statusEffects.find(e => e.type === effect.type);
    
    if (existingEffect) {
      // Refresh duration or stack effect
      if (effect.stacks) {
        existingEffect.stacks = Math.min(existingEffect.maxStacks || 5, existingEffect.stacks + 1);
        existingEffect.duration = effect.duration;
      } else {
        // Just refresh duration
        existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
      }
    } else {
      // Add new effect
      this.statusEffects.push({ ...effect, tickTimer: effect.tickInterval || 0 });
      
      // Apply immediate effect
      if (effect.onApply) {
        effect.onApply(this);
      }
    }
  }
  
  /**
   * Get positional data for targeting
   * @returns {Object} Position and velocity data
   */
  getTargetData() {
    return {
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      radius: this.radius
    };
  }
  
  /**
   * Clean up resources when enemy is removed
   */
  dispose() {
    if (this.scene) {
      this.scene.remove(this.meshGroup);
    }
    
    this.isAlive = false;
    
    // Clean up weapon resources
    if (this.weaponManager) {
      this.weaponManager.dispose();
    }
    
    // Remove any status effects
    this.statusEffects = [];
  }
}

export default BaseEnemy;