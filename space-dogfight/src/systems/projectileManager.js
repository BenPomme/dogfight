/**
 * Space Dogfight - Projectile Manager
 * 
 * This system manages all projectiles in the game, including lasers, missiles, and other weapons.
 */

import THREE from '../utils/three';

export default class ProjectileManager {
  constructor(scene, renderer, physics) {
    this.scene = scene;
    this.renderer = renderer;
    this.physics = physics;
    
    // Store active projectiles
    this.projectiles = [];
    
    // Projectile configuration
    this.config = {
      laser: {
        speed: 500,
        range: 1000,
        damage: 10,
        color: 0xff0000,
        collisionGroup: physics.collisionGroups.PROJECTILE,
        collisionMask: physics.collisionGroups.SHIP | physics.collisionGroups.OBSTACLE
      },
      missile: {
        speed: 200,
        range: 2000,
        damage: 50,
        color: 0xff8800,
        collisionGroup: physics.collisionGroups.PROJECTILE,
        collisionMask: physics.collisionGroups.SHIP | physics.collisionGroups.OBSTACLE,
        trackingStrength: 0.8
      },
      plasma: {
        speed: 300,
        range: 800,
        damage: 30,
        color: 0x33ffff,
        collisionGroup: physics.collisionGroups.PROJECTILE,
        collisionMask: physics.collisionGroups.SHIP | physics.collisionGroups.OBSTACLE,
        areaEffect: true,
        areaRadius: 20
      }
    };
  }
  
  /**
   * Create a laser projectile
   * 
   * @param {THREE.Vector3} origin - The starting position
   * @param {THREE.Vector3} direction - The direction vector
   * @param {Object} source - The entity that fired the projectile
   * @param {Object} options - Optional configuration overrides
   * @returns {Object} - The created projectile
   */
  createLaser(origin, direction, source, options = {}) {
    // Create base configuration by merging defaults with options
    const config = { ...this.config.laser, ...options };
    
    // Create visual representation using renderer
    const laser = this.renderer.createLaser(
      origin,
      direction,
      config.color,
      config.speed,
      config.range
    );
    
    // Create physics body
    const physicsBody = {
      position: laser.mesh.position,
      velocity: laser.velocity.clone(),
      radius: 0.2,
      collisionGroup: config.collisionGroup,
      collisionMask: config.collisionMask,
      onCollision: (target) => this.handleProjectileCollision(projectile, target)
    };
    
    // Add to physics system
    this.physics.addBody(physicsBody);
    
    // Create projectile object
    const projectile = {
      type: 'laser',
      visual: laser,
      physics: physicsBody,
      source: source,
      damage: config.damage,
      distanceTraveled: 0,
      maxDistance: config.range,
      isActive: true
    };
    
    // Add to active projectiles
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  /**
   * Create a missile projectile
   * 
   * @param {THREE.Vector3} origin - The starting position
   * @param {THREE.Vector3} direction - The direction vector
   * @param {Object} source - The entity that fired the projectile
   * @param {Object} target - Optional target entity for homing missiles
   * @param {Object} options - Optional configuration overrides
   * @returns {Object} - The created projectile
   */
  createMissile(origin, direction, source, target = null, options = {}) {
    // Create base configuration by merging defaults with options
    const config = { ...this.config.missile, ...options };
    
    // Create visual representation using renderer
    const missile = this.renderer.createMissile(
      origin,
      direction,
      config.color,
      config.speed
    );
    
    // Set target if provided
    if (target) {
      missile.target = target;
    }
    
    // Create physics body
    const physicsBody = {
      position: missile.mesh.position,
      velocity: missile.velocity.clone(),
      radius: 0.5,
      collisionGroup: config.collisionGroup,
      collisionMask: config.collisionMask,
      onCollision: (target) => this.handleProjectileCollision(projectile, target)
    };
    
    // Add to physics system
    this.physics.addBody(physicsBody);
    
    // Create projectile object
    const projectile = {
      type: 'missile',
      visual: missile,
      physics: physicsBody,
      source: source,
      target: target,
      damage: config.damage,
      distanceTraveled: 0,
      maxDistance: config.range,
      isActive: true,
      trackingStrength: config.trackingStrength
    };
    
    // Add to active projectiles
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  /**
   * Create a plasma projectile
   * 
   * @param {THREE.Vector3} origin - The starting position
   * @param {THREE.Vector3} direction - The direction vector
   * @param {Object} source - The entity that fired the projectile
   * @param {Object} options - Optional configuration overrides
   * @returns {Object} - The created projectile
   */
  createPlasma(origin, direction, source, options = {}) {
    // Create base configuration by merging defaults with options
    const config = { ...this.config.plasma, ...options };
    
    // Create visual representation (similar to laser but larger and different color)
    const plasma = this.renderer.createLaser(
      origin,
      direction,
      config.color,
      config.speed,
      config.range
    );
    
    // Adjust scale for plasma ball effect
    plasma.mesh.scale.set(2, 2, 1);
    
    // Create physics body
    const physicsBody = {
      position: plasma.mesh.position,
      velocity: plasma.velocity.clone(),
      radius: 1.0,
      collisionGroup: config.collisionGroup,
      collisionMask: config.collisionMask,
      onCollision: (target) => this.handleProjectileCollision(projectile, target)
    };
    
    // Add to physics system
    this.physics.addBody(physicsBody);
    
    // Create projectile object
    const projectile = {
      type: 'plasma',
      visual: plasma,
      physics: physicsBody,
      source: source,
      damage: config.damage,
      distanceTraveled: 0,
      maxDistance: config.range,
      isActive: true,
      areaEffect: config.areaEffect,
      areaRadius: config.areaRadius
    };
    
    // Add to active projectiles
    this.projectiles.push(projectile);
    
    return projectile;
  }
  
  /**
   * Handle projectile collision with a target
   * 
   * @param {Object} projectile - The projectile that collided
   * @param {Object} target - The entity that was hit
   */
  handleProjectileCollision(projectile, target) {
    // Skip if projectile is already inactive
    if (!projectile.isActive) return;
    
    // Skip if target is the source
    if (target === projectile.source) return;
    
    // Apply damage to target if it has a takeDamage method
    if (target.takeDamage) {
      target.takeDamage(projectile.damage, projectile.source);
    }
    
    // Handle area effect damage for plasma
    if (projectile.type === 'plasma' && projectile.areaEffect) {
      this.applyAreaEffectDamage(
        projectile.physics.position,
        projectile.areaRadius,
        projectile.damage * 0.5,
        projectile.source
      );
    }
    
    // Create impact effect
    switch (projectile.type) {
      case 'laser':
        this.renderer.createMuzzleFlash(projectile.physics.position, projectile.visual.light.color);
        break;
      case 'missile':
        this.renderer.createExplosion(projectile.physics.position, 1, projectile.visual.light.color);
        break;
      case 'plasma':
        this.renderer.createExplosion(projectile.physics.position, 1.5, projectile.visual.light.color);
        break;
    }
    
    // Deactivate projectile
    this.deactivateProjectile(projectile);
  }
  
  /**
   * Apply area effect damage around a position
   * 
   * @param {THREE.Vector3} position - The center position
   * @param {number} radius - The effect radius
   * @param {number} damage - The damage amount
   * @param {Object} source - The entity that caused the damage
   */
  applyAreaEffectDamage(position, radius, damage, source) {
    // Get all entities in the area
    const entitiesInRange = [];
    
    // In a full implementation, we would use a spatial partitioning system
    // For now, we'll check all bodies in the physics system
    for (const body of this.physics.bodies) {
      // Skip entities without position or those that can't take damage
      if (!body.position || !body.takeDamage) continue;
      
      // Skip the source entity
      if (body === source) continue;
      
      // Calculate distance to entity
      const distance = position.distanceTo(body.position);
      
      // Check if within radius
      if (distance <= radius) {
        // Calculate damage falloff based on distance
        const falloff = 1 - (distance / radius);
        const adjustedDamage = damage * falloff;
        
        // Apply damage
        body.takeDamage(adjustedDamage, source);
        
        // Add to affected entities
        entitiesInRange.push(body);
      }
    }
    
    return entitiesInRange;
  }
  
  /**
   * Deactivate a projectile and remove it from the scene
   * 
   * @param {Object} projectile - The projectile to deactivate
   */
  deactivateProjectile(projectile) {
    // Skip if already inactive
    if (!projectile.isActive) return;
    
    // Mark as inactive
    projectile.isActive = false;
    
    // Remove visual representation
    projectile.visual.remove();
    
    // Remove physics body
    this.physics.removeBody(projectile.physics);
  }
  
  /**
   * Update all projectiles
   * 
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  update(deltaTime) {
    // Process all active projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Skip inactive projectiles
      if (!projectile.isActive) {
        // Remove from array
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Update visual representation
      const removeProjectile = projectile.visual.update(deltaTime);
      
      // Sync physics body with visual representation
      projectile.physics.position.copy(projectile.visual.mesh.position);
      
      // Calculate distance traveled this frame
      const distanceThisFrame = projectile.visual.velocity.length() * deltaTime;
      projectile.distanceTraveled += distanceThisFrame;
      
      // Check if projectile has exceeded maximum range
      if (removeProjectile || projectile.distanceTraveled >= projectile.maxDistance) {
        this.deactivateProjectile(projectile);
        this.projectiles.splice(i, 1);
      }
      
      // Handle missile tracking
      if (projectile.type === 'missile' && projectile.target && projectile.target.position) {
        // Calculate direction to target
        const currentDirection = projectile.visual.velocity.clone().normalize();
        const targetDirection = new THREE.Vector3()
          .subVectors(projectile.target.position, projectile.physics.position)
          .normalize();
        
        // Interpolate between current direction and target direction
        const newDirection = new THREE.Vector3()
          .copy(currentDirection)
          .lerp(targetDirection, projectile.trackingStrength * deltaTime);
        
        // Apply new direction while maintaining speed
        const speed = projectile.visual.velocity.length();
        projectile.visual.velocity.copy(newDirection).multiplyScalar(speed);
        projectile.physics.velocity.copy(projectile.visual.velocity);
        
        // Update missile orientation to face direction of travel
        projectile.visual.mesh.lookAt(
          projectile.visual.mesh.position.clone().add(projectile.visual.velocity)
        );
      }
    }
  }
}