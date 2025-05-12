/**
 * ProjectileManager class - Manages all projectiles in the game
 * Handles updating, collision detection, and cleanup
 */
class ProjectileManager {
  /**
   * Create a new ProjectileManager
   * @param {Object} config - Configuration options
   * @param {THREE.Scene} config.scene - The THREE.js scene
   * @param {Function} config.onHit - Callback function when a projectile hits a target
   */
  constructor(config = {}) {
    this.scene = config.scene || null;
    this.onHit = config.onHit || null;
    
    // Array of active projectiles
    this.projectiles = [];
    
    // Track entities for collision detection
    this.entities = [];
    
    // Environmental collision parameters
    this.boundaryRadius = config.boundaryRadius || 150;
    this.useEnvironmentCollision = config.useEnvironmentCollision || true;
  }
  
  /**
   * Add projectiles to the manager
   * @param {Array|Object} projectiles - Projectile or array of projectiles to add
   */
  addProjectiles(projectiles) {
    if (Array.isArray(projectiles)) {
      this.projectiles = this.projectiles.concat(projectiles);
    } else {
      this.projectiles.push(projectiles);
    }
  }
  
  /**
   * Set entities to check for collisions
   * @param {Array} entities - Array of entities (ships, asteroids, etc.)
   */
  setEntities(entities) {
    this.entities = entities;
  }
  
  /**
   * Update all projectiles and check for collisions
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update projectiles and remove expired ones
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Update projectile
      const isActive = projectile.update(deltaTime);
      
      if (!isActive) {
        // Projectile expired, remove it
        projectile.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Check for collisions with boundary
      if (this.useEnvironmentCollision && this.boundaryRadius) {
        const distanceFromCenter = Math.sqrt(
          projectile.position.x * projectile.position.x +
          projectile.position.z * projectile.position.z
        );
        
        if (distanceFromCenter > this.boundaryRadius) {
          // Create a boundary hit effect
          this.createBoundaryHitEffect(projectile);
          
          // Remove projectile
          projectile.destroy();
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      
      // Check for collisions with entities
      for (const entity of this.entities) {
        // Skip collision check with the source of the projectile
        if (
          (projectile.fromPlayer && entity.isPlayer) || 
          (!projectile.fromPlayer && !entity.isPlayer)
        ) {
          continue;
        }
        
        // Skip destroyed entities
        if (!entity.isAlive) {
          continue;
        }
        
        // Check collision
        const distance = entity.position.distanceTo(projectile.position);
        const collisionRadius = entity.radius || 2; // Default radius if not specified
        
        if (distance < collisionRadius) {
          // Register hit
          this.registerHit(projectile, entity);
          
          // Remove projectile
          projectile.destroy();
          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
  
  /**
   * Register a hit on an entity and call the onHit callback
   * @param {Object} projectile - The projectile that hit
   * @param {Object} entity - The entity that was hit
   */
  registerHit(projectile, entity) {
    // Create hit effect at impact position
    this.createHitEffect(projectile, entity);
    
    // Call onHit callback if provided
    if (this.onHit) {
      this.onHit(projectile, entity);
    }
  }
  
  /**
   * Create a visual effect when a projectile hits an entity
   * @param {Object} projectile - The projectile
   * @param {Object} entity - The entity that was hit
   */
  createHitEffect(projectile, entity) {
    if (!this.scene) return;
    
    // Get the impact position (projectile's current position)
    const position = projectile.position.clone();
    
    // Create a flash effect
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: projectile.color || 0xffff00,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Add a point light at impact point
    const light = new THREE.PointLight(projectile.color || 0xffff00, 2, 10);
    light.position.copy(position);
    this.scene.add(light);
    
    // Add sparkle particles
    const particleCount = 10;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: projectile.color || 0xffff00,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      // Random velocity
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      
      // Add particle data
      particle.userData = {
        velocity,
        lifetime: 0,
        maxLifetime: 0.3 + Math.random() * 0.3
      };
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Animate and remove after a short time
    let age = 0;
    const maxAge = 0.6;
    
    const updateEffect = (deltaTime) => {
      age += deltaTime;
      
      // Scale down flash
      const scale = 1 - (age / maxAge);
      flash.scale.set(scale, scale, scale);
      
      // Fade out flash and light
      flashMaterial.opacity = 0.8 * (1 - (age / maxAge));
      light.intensity = 2 * (1 - (age / maxAge));
      
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
        
        // Slow down velocity
        data.velocity.multiplyScalar(0.9);
        
        // Fade out
        particle.material.opacity = 0.6 * (1 - (data.lifetime / data.maxLifetime));
      }
      
      // Remove effect when done
      if (age >= maxAge) {
        this.scene.remove(flash);
        this.scene.remove(light);
        
        // Remove any remaining particles
        particles.forEach(particle => {
          this.scene.remove(particle);
        });
        
        return false;
      }
      
      return true;
    };
    
    // Add the update function to the animation loop
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateEffect);
    }
  }
  
  /**
   * Create a visual effect when a projectile hits the boundary
   * @param {Object} projectile - The projectile
   */
  createBoundaryHitEffect(projectile) {
    if (!this.scene) return;
    
    // Create a simple flash at the boundary point
    const position = projectile.position.clone();
    const direction = position.clone().normalize();
    
    // Set position exactly at boundary
    position.copy(direction.multiplyScalar(this.boundaryRadius));
    
    // Create a flash
    const flashGeometry = new THREE.SphereGeometry(1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff, // Boundary color
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Add ripple effect at boundary
    const rippleGeometry = new THREE.RingGeometry(2, 2.2, 20);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.copy(position);
    
    // Orient ripple to face the center
    ripple.lookAt(new THREE.Vector3(0, 0, 0));
    
    this.scene.add(ripple);
    
    // Animate and remove after a short time
    let age = 0;
    const maxAge = 0.5;
    
    const updateEffect = (deltaTime) => {
      age += deltaTime;
      
      // Fade out flash
      flashMaterial.opacity = 0.6 * (1 - (age / maxAge));
      
      // Expand ripple
      const scale = 1 + (age / maxAge) * 3;
      ripple.scale.set(scale, scale, scale);
      rippleMaterial.opacity = 0.8 * (1 - (age / maxAge));
      
      // Remove effect when done
      if (age >= maxAge) {
        this.scene.remove(flash);
        this.scene.remove(ripple);
        return false;
      }
      
      return true;
    };
    
    // Add the update function to the animation loop
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateEffect);
    }
  }
  
  /**
   * Get all active projectiles
   * @returns {Array} Array of projectiles
   */
  getProjectiles() {
    return this.projectiles;
  }
  
  /**
   * Clear all projectiles
   */
  clearProjectiles() {
    // Destroy all projectiles
    this.projectiles.forEach(projectile => {
      projectile.destroy();
    });
    this.projectiles = [];
  }
  
  /**
   * Set the game boundary radius for collision detection
   * @param {number} radius - Boundary radius
   */
  setBoundaryRadius(radius) {
    this.boundaryRadius = radius;
  }
  
  /**
   * Toggle environment collision detection
   * @param {boolean} enabled - Whether environment collision is enabled
   */
  setEnvironmentCollision(enabled) {
    this.useEnvironmentCollision = enabled;
  }
}

// Add THREE.js import at the top when integrated with the game
// We'll need to add this when actually integrating
// import * as THREE from 'three';

export default ProjectileManager;