import * as THREE from 'three';
import BaseEnemy from './BaseEnemy';

/**
 * Destroyer - Heavy, durable enemy type with powerful weapons
 * Focuses on high damage output and resilience at the cost of mobility
 */
class Destroyer extends BaseEnemy {
  /**
   * Create a new Destroyer enemy
   * @param {Object} config - Enemy configuration options
   */
  constructor(config = {}) {
    // Set destroyer-specific defaults
    const destroyerConfig = {
      type: 'destroyer',
      name: 'Destroyer',
      health: 200, // Much higher health than standard enemies
      speed: 6, // Slower than standard enemies
      turnRate: 0.02, // Less agile
      score: 300, // Higher score value
      behaviorType: 'hunter',
      fireRate: 0.5, // Slower fire rate
      bodyColor: 0x555555, // Gray/metallic color
      engineColor: 0x3366ff, // Blue engine glow
      radius: 4, // Larger collision radius
      // Default weapon loadout - heavier weapons
      weaponConfig: ['machine_gun_basic'],
      ...config
    };
    
    // Call parent constructor with destroyer configuration
    super(destroyerConfig);
    
    // Destroyer-specific properties
    this.shielded = true;
    this.shieldHealth = 75;
    this.maxShieldHealth = 75;
    this.shieldRegenRate = 5; // Shield points per second
    this.shieldRegenDelay = 3; // Seconds after damage before shield regen begins
    this.lastShieldDamage = 0; // Time tracker for shield regen
    
    // Secondary weapon system
    this.hasMissileLauncher = true;
    this.missileCooldown = 0;
    this.missileFireRate = 0.2; // Missiles per second
    this.missileBurstCount = 0;
    this.maxMissileBurst = 3; // Missiles per volley
    this.timeBetweenMissiles = 0.5; // Time between each missile in a volley
    this.missileVolleyCooldown = 8; // Time between volleys
    
    // Enhanced armor system
    this.armorRating = 5; // Damage reduction from incoming attacks
    
    // Create shield mesh
    this.createShieldMesh();
  }
  
  /**
   * Create the visual mesh for this destroyer
   */
  createMesh() {
    // Create a group to hold all parts
    this.meshGroup = new THREE.Group();
    
    // Create hulking destroyer body
    const bodyGeometry = new THREE.BoxGeometry(4, 1.8, 7);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: this.bodyColor,
      emissive: new THREE.Color(this.bodyColor).multiplyScalar(0.1),
      shininess: 60,
      flatShading: true
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.meshGroup.add(body);
    
    // Create detailed elements to make it look more mechanical
    
    // Front section (tapered)
    const frontGeometry = new THREE.CylinderGeometry(0.5, 2, 3, 4);
    frontGeometry.rotateZ(Math.PI / 2);
    frontGeometry.rotateY(Math.PI / 4);
    const frontMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      shininess: 70
    });
    const front = new THREE.Mesh(frontGeometry, frontMaterial);
    front.position.set(0, 0, -3.5);
    this.meshGroup.add(front);
    
    // Heavy side armor plates
    const armorGeometry = new THREE.BoxGeometry(2.5, 1, 5);
    const armorMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 40
    });
    
    // Left armor plate
    const leftArmor = new THREE.Mesh(armorGeometry, armorMaterial);
    leftArmor.position.set(-2.5, 0, 0);
    this.meshGroup.add(leftArmor);
    
    // Right armor plate
    const rightArmor = new THREE.Mesh(armorGeometry, armorMaterial);
    rightArmor.position.set(2.5, 0, 0);
    this.meshGroup.add(rightArmor);
    
    // Upper turret structure
    const turretBaseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 8);
    const turretBaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      shininess: 80
    });
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turretBase.position.set(0, 1.2, -1);
    this.meshGroup.add(turretBase);
    
    // Turret gun
    const turretGunGeometry = new THREE.BoxGeometry(0.6, 0.6, 2.5);
    const turretGunMaterial = new THREE.MeshPhongMaterial({
      color: 0x222222,
      shininess: 90
    });
    const turretGun = new THREE.Mesh(turretGunGeometry, turretGunMaterial);
    turretGun.position.set(0, 1.2, -2.5);
    this.meshGroup.add(turretGun);
    
    // Create large engine thrusters
    const engineGeometry = new THREE.CylinderGeometry(0.7, 1, 1.5, 8);
    engineGeometry.rotateX(Math.PI / 2);
    const engineMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x111111,
      shininess: 30
    });
    
    // Position engines at the rear
    const engines = [];
    const enginePositions = [
      { x: -1.5, y: -0.3, z: 3.5 },
      { x: 1.5, y: -0.3, z: 3.5 },
      { x: 0, y: 0.5, z: 3.5 }
    ];
    
    enginePositions.forEach((pos, index) => {
      const engine = new THREE.Mesh(engineGeometry, engineMaterial);
      engine.position.set(pos.x, pos.y, pos.z);
      this.meshGroup.add(engine);
      engines.push(engine);
      
      // Add engine glow
      const engineLight = new THREE.PointLight(this.engineColor, 1.5, 5);
      engineLight.position.set(pos.x, pos.y, pos.z + 1);
      this.meshGroup.add(engineLight);
      this[`engineLight${index}`] = engineLight;
    });
    
    // Add missile launcher pods
    const missilePodGeometry = new THREE.BoxGeometry(1, 0.6, 1.2);
    const missilePodMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      shininess: 50
    });
    
    // Left missile pod
    const leftMissilePod = new THREE.Mesh(missilePodGeometry, missilePodMaterial);
    leftMissilePod.position.set(-2, 0.8, 0);
    this.meshGroup.add(leftMissilePod);
    
    // Right missile pod
    const rightMissilePod = new THREE.Mesh(missilePodGeometry, missilePodMaterial);
    rightMissilePod.position.set(2, 0.8, 0);
    this.meshGroup.add(rightMissilePod);
    
    // Add missile launcher tubes
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 60
    });
    
    // Create 3 missile tubes per side
    [-2, 2].forEach(xPos => {
      for (let i = 0; i < 3; i++) {
        const tubeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
        tubeGeometry.rotateX(Math.PI / 2);
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        
        // Position in a row
        tube.position.set(
          xPos,
          0.8,
          -0.5 + i * 0.5
        );
        
        this.meshGroup.add(tube);
      }
    });
    
    // Store reference to the main body
    this.mesh = body;
  }
  
  /**
   * Create the shield mesh
   */
  createShieldMesh() {
    if (!this.meshGroup) return;
    
    // Create shield geometry (slightly larger than the ship)
    const shieldGeometry = new THREE.SphereGeometry(5, 16, 12);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.meshGroup.add(this.shieldMesh);
    
    // Add shield impact effect
    this.shieldImpacts = [];
  }
  
  /**
   * Create weapon mount points
   * @returns {Array} Array of mount point objects
   */
  createWeaponMountPoints() {
    const mountPoints = [];
    
    // Turret mount point (for primary weapon)
    const turretMount = new THREE.Object3D();
    turretMount.position.set(0, 1.2, -3);
    this.meshGroup.add(turretMount);
    mountPoints.push(turretMount);
    
    // Side cannon mount points
    const leftCannonMount = new THREE.Object3D();
    leftCannonMount.position.set(-1.8, 0, -2.5);
    this.meshGroup.add(leftCannonMount);
    mountPoints.push(leftCannonMount);
    
    const rightCannonMount = new THREE.Object3D();
    rightCannonMount.position.set(1.8, 0, -2.5);
    this.meshGroup.add(rightCannonMount);
    mountPoints.push(rightCannonMount);
    
    return mountPoints;
  }
  
  /**
   * Override update to handle shield and special abilities
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @param {Array} obstacles - Array of obstacles to avoid
   * @returns {boolean} Whether the enemy is still active
   */
  update(deltaTime, obstacles = []) {
    // Call parent update
    const isActive = super.update(deltaTime, obstacles);
    if (!isActive) return false;
    
    // Update shield
    this.updateShield(deltaTime);
    
    // Update missile system
    this.updateMissileLauncher(deltaTime);
    
    return true;
  }
  
  /**
   * Update shield system
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateShield(deltaTime) {
    // Skip if no shield
    if (!this.shielded || !this.shieldMesh) return;
    
    // Update shield regeneration
    if (this.shieldHealth < this.maxShieldHealth &&
        Date.now() - this.lastShieldDamage > this.shieldRegenDelay * 1000) {
      this.shieldHealth = Math.min(
        this.maxShieldHealth,
        this.shieldHealth + this.shieldRegenRate * deltaTime
      );
    }
    
    // Update shield visibility and opacity
    if (this.shieldHealth > 0) {
      this.shieldMesh.visible = true;
      
      // Shield opacity based on health percentage
      const healthPercent = this.shieldHealth / this.maxShieldHealth;
      this.shieldMesh.material.opacity = 0.1 + healthPercent * 0.2;
      
      // Make shield pulse slightly
      const pulseAmount = 0.03;
      const pulseSpeed = 2;
      const pulse = 1 + Math.sin(Date.now() / 1000 * pulseSpeed) * pulseAmount;
      this.shieldMesh.scale.set(pulse, pulse, pulse);
    } else {
      this.shieldMesh.visible = false;
    }
    
    // Update shield impact effects
    for (let i = this.shieldImpacts.length - 1; i >= 0; i--) {
      const impact = this.shieldImpacts[i];
      
      // Update impact lifetime
      impact.lifetime += deltaTime;
      if (impact.lifetime >= impact.maxLifetime) {
        // Remove expired impact
        if (impact.mesh && this.meshGroup) {
          this.meshGroup.remove(impact.mesh);
        }
        this.shieldImpacts.splice(i, 1);
        continue;
      }
      
      // Update impact visual (expand and fade)
      const progress = impact.lifetime / impact.maxLifetime;
      const scale = 1 + progress * 2;
      impact.mesh.scale.set(scale, scale, scale);
      
      if (impact.mesh.material) {
        impact.mesh.material.opacity = 0.7 * (1 - progress);
      }
    }
  }
  
  /**
   * Create shield impact effect at a point
   * @param {THREE.Vector3} position - Impact position
   * @param {number} damage - Amount of damage
   */
  createShieldImpact(position, damage) {
    if (!this.meshGroup || !this.shieldMesh || !this.shieldMesh.visible) return;
    
    // Calculate position on shield surface
    const toPosition = new THREE.Vector3().subVectors(
      position,
      this.position
    ).normalize();
    
    const shieldRadius = 5 * this.shieldMesh.scale.x;
    const impactPos = this.position.clone().add(
      toPosition.multiplyScalar(shieldRadius)
    );
    
    // Create impact geometry
    const size = 0.5 + (damage / 20);
    const impactGeometry = new THREE.CircleGeometry(size, 8);
    
    // Ensure the impact faces outward
    impactGeometry.lookAt(toPosition);
    
    // Create impact material
    const impactMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    // Create impact mesh
    const impactMesh = new THREE.Mesh(impactGeometry, impactMaterial);
    impactMesh.position.copy(impactPos);
    
    // Orient to face outward
    impactMesh.lookAt(position);
    
    // Add to scene
    this.meshGroup.add(impactMesh);
    
    // Create impact data
    const impact = {
      mesh: impactMesh,
      lifetime: 0,
      maxLifetime: 0.5 + (damage / 50)
    };
    
    this.shieldImpacts.push(impact);
  }
  
  /**
   * Update missile launcher system
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateMissileLauncher(deltaTime) {
    // Skip if missiles disabled or no target
    if (!this.hasMissileLauncher || !this.target || !this.target.isAlive) return;
    
    // Update missile cooldown
    if (this.missileCooldown > 0) {
      this.missileCooldown -= deltaTime;
      return;
    }
    
    // Check if we should fire missiles
    if (this.shouldFireMissiles()) {
      // Fire next missile in burst
      if (this.missileBurstCount < this.maxMissileBurst) {
        this.fireMissile();
        this.missileBurstCount++;
        this.missileCooldown = this.timeBetweenMissiles;
      } else {
        // Reset burst and set cooldown
        this.missileBurstCount = 0;
        this.missileCooldown = this.missileVolleyCooldown;
      }
    }
  }
  
  /**
   * Determine if the destroyer should fire missiles
   * @returns {boolean} Whether to fire missiles
   */
  shouldFireMissiles() {
    if (!this.target) return false;
    
    // Calculate distance to target
    const distanceToTarget = this.position.distanceTo(this.target.position);
    
    // Check if target is within missile firing range
    const missileRange = 60; // Longer than primary weapon range
    if (distanceToTarget > missileRange) return false;
    
    // Check if we are roughly facing the target
    const toTarget = new THREE.Vector3().subVectors(
      this.target.position,
      this.position
    ).normalize();
    
    // Get forward direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.meshGroup.quaternion);
    
    // Calculate dot product (1 = perfect alignment, -1 = opposite direction)
    const dotProduct = forward.dot(toTarget);
    
    // Missiles have broader firing arc than primary weapons
    return dotProduct > 0.5;
  }
  
  /**
   * Fire a missile at the target
   */
  fireMissile() {
    if (!this.scene || !this.target) return;
    
    // Determine which side to fire from (alternate)
    const side = this.missileBurstCount % 2 === 0 ? 'left' : 'right';
    const xPos = side === 'left' ? -2 : 2;
    
    // Determine which tube in the row (0, 1, or 2)
    const tubeIndex = this.missileBurstCount % 3;
    const zOffset = -0.5 + tubeIndex * 0.5;
    
    // Calculate missile start position
    const missileStart = new THREE.Vector3(xPos, 0.8, zOffset);
    this.meshGroup.localToWorld(missileStart);
    
    // Calculate direction to target
    const toTarget = new THREE.Vector3().subVectors(
      this.target.position,
      missileStart
    ).normalize();
    
    // Create missile geometry
    const missileGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6);
    missileGeometry.rotateX(Math.PI / 2);
    const missileMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      emissive: 0x111111,
      shininess: 70
    });
    const missileMesh = new THREE.Mesh(missileGeometry, missileMaterial);
    missileMesh.position.copy(missileStart);
    
    // Orient missile towards target
    missileMesh.lookAt(this.target.position);
    
    // Add engine glow
    const engineLight = new THREE.PointLight(0xff3300, 2, 5);
    engineLight.position.copy(missileStart);
    // Offset to back of missile
    const backward = toTarget.clone().multiplyScalar(-0.6);
    engineLight.position.add(backward);
    
    // Add to scene
    this.scene.add(missileMesh);
    this.scene.add(engineLight);
    
    // Create missile smoke trail
    const smokeParticles = [];
    
    // Create a missile projectile
    const missile = {
      mesh: missileMesh,
      light: engineLight,
      position: missileStart.clone(),
      velocity: toTarget.clone().multiplyScalar(25), // Fast but not as fast as lasers
      acceleration: 15, // Missiles accelerate over time
      target: this.target,
      maxSpeed: 40,
      turnRate: 2, // How quickly the missile can turn
      damage: 25,
      lifetime: 0,
      maxLifetime: 4, // 4 seconds of flight time
      fromPlayer: false,
      smokeTrail: smokeParticles,
      lastSmokeEmit: 0,
      
      update: function(deltaTime) {
        // Update lifetime
        this.lifetime += deltaTime;
        if (this.lifetime >= this.maxLifetime) return false;
        
        // If target is alive, home in on it
        if (this.target && this.target.isAlive) {
          // Calculate vector to target
          const toTarget = new THREE.Vector3().subVectors(
            this.target.position,
            this.position
          ).normalize();
          
          // Gradually adjust velocity towards target
          const steerForce = toTarget.clone().multiplyScalar(this.turnRate);
          this.velocity.add(steerForce.multiplyScalar(deltaTime));
        }
        
        // Apply acceleration
        const currentSpeed = this.velocity.length();
        if (currentSpeed < this.maxSpeed) {
          this.velocity.normalize().multiplyScalar(
            Math.min(currentSpeed + this.acceleration * deltaTime, this.maxSpeed)
          );
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Update missile orientation to match velocity
        if (this.velocity.lengthSq() > 0.1) {
          this.mesh.lookAt(this.position.clone().add(this.velocity));
        }
        
        // Update mesh and light positions
        this.mesh.position.copy(this.position);
        
        // Keep light at back of missile
        const backward = this.velocity.clone().normalize().multiplyScalar(-0.6);
        this.light.position.copy(this.position).add(backward);
        
        // Emit smoke particles
        this.lastSmokeEmit += deltaTime;
        if (this.lastSmokeEmit >= 0.03) { // Emit smoke every 30ms
          this.emitSmoke();
          this.lastSmokeEmit = 0;
        }
        
        // Update existing smoke particles
        this.updateSmokeTrail(deltaTime);
        
        return true;
      },
      
      emitSmoke: function() {
        if (!this.mesh.parent) return;
        
        // Create smoke particle at missile position
        const smokeSize = 0.2 + Math.random() * 0.3;
        const smokeGeometry = new THREE.SphereGeometry(smokeSize, 4, 4);
        const smokeMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 0.3 + Math.random() * 0.3
        });
        
        const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        
        // Position at back of missile
        const backward = this.velocity.clone().normalize().multiplyScalar(-0.6);
        smoke.position.copy(this.position).add(backward);
        
        // Add some randomness to position
        smoke.position.x += (Math.random() - 0.5) * 0.2;
        smoke.position.y += (Math.random() - 0.5) * 0.2;
        smoke.position.z += (Math.random() - 0.5) * 0.2;
        
        // Add to scene
        this.mesh.parent.add(smoke);
        
        // Create particle data
        const particle = {
          mesh: smoke,
          lifetime: 0,
          maxLifetime: 0.5 + Math.random() * 0.5,
          expansionRate: 1 + Math.random() * 2
        };
        
        this.smokeTrail.push(particle);
      },
      
      updateSmokeTrail: function(deltaTime) {
        for (let i = this.smokeTrail.length - 1; i >= 0; i--) {
          const smoke = this.smokeTrail[i];
          smoke.lifetime += deltaTime;
          
          if (smoke.lifetime >= smoke.maxLifetime) {
            if (smoke.mesh.parent) {
              smoke.mesh.parent.remove(smoke.mesh);
            }
            this.smokeTrail.splice(i, 1);
            continue;
          }
          
          // Expand smoke
          const expansionAmount = smoke.expansionRate * deltaTime;
          smoke.mesh.scale.x += expansionAmount;
          smoke.mesh.scale.y += expansionAmount;
          smoke.mesh.scale.z += expansionAmount;
          
          // Fade out smoke
          const fadeRate = smoke.lifetime / smoke.maxLifetime;
          smoke.mesh.material.opacity = 0.3 * (1 - fadeRate);
        }
      },
      
      destroy: function() {
        if (this.mesh.parent) {
          this.mesh.parent.remove(this.mesh);
        }
        
        if (this.light.parent) {
          this.light.parent.remove(this.light);
        }
        
        // Remove all smoke particles
        this.smokeTrail.forEach(smoke => {
          if (smoke.mesh.parent) {
            smoke.mesh.parent.remove(smoke.mesh);
          }
        });
      }
    };
    
    // Add missile to projectiles
    if (this.scene.addProjectile) {
      this.scene.addProjectile(missile);
    }
    
    // Create launch effect
    this.createMissileLaunchEffect(missileStart);
  }
  
  /**
   * Create visual effect for missile launch
   * @param {THREE.Vector3} position - Launch position
   */
  createMissileLaunchEffect(position) {
    if (!this.scene) return;
    
    // Create flash effect
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Create light flash
    const light = new THREE.PointLight(0xff6600, 2, 8);
    light.position.copy(position);
    this.scene.add(light);
    
    // Animate and remove after a short time
    let age = 0;
    const maxAge = 0.4;
    
    const updateEffect = (deltaTime) => {
      age += deltaTime;
      
      // Fade out flash
      const fadeRate = age / maxAge;
      flashMaterial.opacity = 0.8 * (1 - fadeRate);
      
      // Shrink flash
      const scale = 1 - fadeRate * 0.5;
      flash.scale.set(scale, scale, scale);
      
      // Reduce light intensity
      light.intensity = 2 * (1 - fadeRate);
      
      // Remove when done
      if (age >= maxAge) {
        this.scene.remove(flash);
        this.scene.remove(light);
        return false;
      }
      
      return true;
    };
    
    // Add update to game loop
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateEffect);
    }
  }
  
  /**
   * Override takeDamage to handle shield absorption
   * @param {number} amount - Amount of damage to take
   * @param {Object} source - Source of the damage
   * @returns {boolean} Whether the enemy is still alive
   */
  takeDamage(amount, source) {
    // Record time of damage for shield regen delay
    this.lastShieldDamage = Date.now();
    
    // Apply damage reduction from armor
    const reducedDamage = Math.max(1, amount - this.armorRating);
    
    // If shield is active, damage it first
    if (this.shielded && this.shieldHealth > 0) {
      // Create shield impact effect
      if (source && source.position) {
        this.createShieldImpact(source.position, reducedDamage);
      }
      
      // Apply damage to shield
      this.shieldHealth -= reducedDamage;
      
      // If shield is depleted, apply overflow damage to hull
      if (this.shieldHealth < 0) {
        const overflowDamage = -this.shieldHealth;
        this.shieldHealth = 0;
        
        // Call parent implementation with overflow damage
        return super.takeDamage(overflowDamage, source);
      }
      
      // Shield absorbed all damage
      return true;
    }
    
    // No shield or shield depleted, damage hull directly
    return super.takeDamage(reducedDamage, source);
  }
}

export default Destroyer;