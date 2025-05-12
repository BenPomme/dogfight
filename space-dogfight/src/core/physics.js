/**
 * Space Dogfight - Physics System
 * 
 * This class manages the physics simulation for the game, including collision detection
 * and physics body interactions.
 */

import * as THREE from 'three';

export default class Physics {
  constructor() {
    // Collection of physics objects
    this.bodies = [];
    
    // Collision configuration
    this.collisionGroups = {
      SHIP: 1,
      PROJECTILE: 2,
      OBSTACLE: 4,
      POWERUP: 8
    };
    
    // Physics constants
    this.gravity = 0; // Zero gravity for space simulation
    
    // Broad phase collision grid
    this.gridSize = 500;
    this.gridCells = {};
  }
  
  /**
   * Add a physics body to the simulation
   * 
   * @param {Object} body - The physics body to add
   * @param {THREE.Vector3} body.position - Position vector
   * @param {THREE.Vector3} body.velocity - Velocity vector
   * @param {THREE.Vector3} body.acceleration - Acceleration vector
   * @param {number} body.mass - Body mass
   * @param {number} body.radius - Collision radius
   * @param {number} body.collisionGroup - Collision group bitmask
   * @param {number} body.collisionMask - Collision mask bitmask
   * @param {Function} body.onCollision - Collision callback
   */
  addBody(body) {
    this.bodies.push(body);
    this.updateGridCell(body);
  }
  
  /**
   * Remove a physics body from the simulation
   * 
   * @param {Object} body - The physics body to remove
   */
  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }
  
  /**
   * Update the physics simulation
   * 
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @param {Array} entities - Game entities to update physics for
   */
  update(deltaTime, entities) {
    // Optimization: clear grid cells
    this.gridCells = {};
    
    // Update physics for all entities
    for (const entity of entities) {
      if (entity.position && entity.velocity) {
        // Apply physics updates
        this.updatePhysics(entity, deltaTime);
        
        // Update grid position for broad phase collision
        this.updateGridCell(entity);
      }
    }
    
    // Detect and resolve collisions
    this.detectCollisions(entities);
  }
  
  /**
   * Update physics for a single entity
   * 
   * @param {Object} entity - The entity to update
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updatePhysics(entity, deltaTime) {
    // Apply acceleration to velocity
    if (entity.acceleration) {
      entity.velocity.add(entity.acceleration.clone().multiplyScalar(deltaTime));
    }
    
    // Apply velocity to position
    if (entity.velocity) {
      entity.position.add(entity.velocity.clone().multiplyScalar(deltaTime));
    }
    
    // Apply gravity if enabled
    if (this.gravity !== 0 && entity.mass) {
      entity.velocity.y -= this.gravity * deltaTime;
    }
    
    // Apply damping if specified
    if (entity.damping) {
      entity.velocity.multiplyScalar(1 - entity.damping * deltaTime);
    }
    
    // Reset acceleration for next frame if needed
    if (entity.resetAcceleration && entity.acceleration) {
      entity.acceleration.set(0, 0, 0);
    }
  }
  
  /**
   * Update the grid cell for an entity
   * 
   * @param {Object} entity - The entity to update
   */
  updateGridCell(entity) {
    if (!entity.position || !entity.radius) return;
    
    // Calculate grid cell coordinates
    const cellX = Math.floor(entity.position.x / this.gridSize);
    const cellY = Math.floor(entity.position.y / this.gridSize);
    const cellZ = Math.floor(entity.position.z / this.gridSize);
    const cellKey = `${cellX},${cellY},${cellZ}`;
    
    // Store entity's current cell
    entity.cellKey = cellKey;
    
    // Add entity to the cell
    if (!this.gridCells[cellKey]) {
      this.gridCells[cellKey] = [];
    }
    
    this.gridCells[cellKey].push(entity);
  }
  
  /**
   * Detect and resolve collisions between entities
   * 
   * @param {Array} entities - Game entities to check for collisions
   */
  detectCollisions(entities) {
    // Process only entities with collision properties
    const collidableEntities = entities.filter(entity => 
      entity.position && entity.radius && entity.cellKey);
    
    // Check for collisions
    for (const entityA of collidableEntities) {
      // Get potential collision candidates from nearby grid cells
      const candidates = this.getPotentialCollisions(entityA);
      
      for (const entityB of candidates) {
        // Skip self-collision
        if (entityA === entityB) continue;
        
        // Check if collision groups match
        if (entityA.collisionGroup && entityB.collisionMask) {
          if (!(entityA.collisionGroup & entityB.collisionMask)) continue;
        }
        
        if (entityB.collisionGroup && entityA.collisionMask) {
          if (!(entityB.collisionGroup & entityA.collisionMask)) continue;
        }
        
        // Calculate distance between entities
        const distance = entityA.position.distanceTo(entityB.position);
        const minDistance = entityA.radius + entityB.radius;
        
        // Check for collision
        if (distance < minDistance) {
          // Handle collision
          this.resolveCollision(entityA, entityB, distance, minDistance);
        }
      }
    }
  }
  
  /**
   * Get potential collision candidates for an entity
   * 
   * @param {Object} entity - The entity to check
   * @returns {Array} - Array of potential collision candidates
   */
  getPotentialCollisions(entity) {
    if (!entity.cellKey) return [];
    
    // Get entities in the same cell
    const candidates = [...(this.gridCells[entity.cellKey] || [])];
    
    // Check neighboring cells (for entities that might be at the edge of cells)
    const [cellX, cellY, cellZ] = entity.cellKey.split(',').map(Number);
    
    // Check all 26 neighboring cells (3x3x3 cube minus the center)
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the center cell (already added)
          if (x === 0 && y === 0 && z === 0) continue;
          
          const neighborKey = `${cellX + x},${cellY + y},${cellZ + z}`;
          const neighborEntities = this.gridCells[neighborKey] || [];
          candidates.push(...neighborEntities);
        }
      }
    }
    
    return candidates;
  }
  
  /**
   * Resolve a collision between two entities
   * 
   * @param {Object} entityA - First colliding entity
   * @param {Object} entityB - Second colliding entity
   * @param {number} distance - Distance between entities
   * @param {number} minDistance - Minimum distance to avoid collision
   */
  resolveCollision(entityA, entityB, distance, minDistance) {
    // Calculate collision normal
    const normal = new THREE.Vector3()
      .subVectors(entityA.position, entityB.position)
      .normalize();
    
    // Calculate penetration depth
    const penetrationDepth = minDistance - distance;
    
    // Calculate position correction
    const percent = 0.8; // Correction percentage
    const correction = normal.clone().multiplyScalar(penetrationDepth * percent);
    
    // Apply position correction based on mass (if available)
    if (entityA.mass && entityB.mass) {
      const totalMass = entityA.mass + entityB.mass;
      const ratioA = entityB.mass / totalMass;
      const ratioB = entityA.mass / totalMass;
      
      entityA.position.add(correction.clone().multiplyScalar(ratioA));
      entityB.position.sub(correction.clone().multiplyScalar(ratioB));
    } else {
      // Equal distribution if no mass information
      entityA.position.add(correction.clone().multiplyScalar(0.5));
      entityB.position.sub(correction.clone().multiplyScalar(0.5));
    }
    
    // Calculate impulse for velocity response
    if (entityA.velocity && entityB.velocity) {
      // Calculate relative velocity
      const relativeVelocity = new THREE.Vector3()
        .subVectors(entityB.velocity, entityA.velocity);
      
      // Calculate velocity along normal
      const velocityAlongNormal = relativeVelocity.dot(normal);
      
      // Skip if objects are separating
      if (velocityAlongNormal > 0) return;
      
      // Calculate restitution (bounciness)
      const restitution = Math.min(
        entityA.restitution || 0.2,
        entityB.restitution || 0.2
      );
      
      // Calculate impulse scalar
      let impulseScalar;
      
      if (entityA.mass && entityB.mass) {
        impulseScalar = -(1 + restitution) * velocityAlongNormal;
        impulseScalar /= 1 / entityA.mass + 1 / entityB.mass;
      } else {
        impulseScalar = -(1 + restitution) * velocityAlongNormal * 0.5;
      }
      
      // Apply impulse
      const impulse = normal.clone().multiplyScalar(impulseScalar);
      
      if (entityA.mass) {
        entityA.velocity.sub(impulse.clone().divideScalar(entityA.mass));
      } else {
        entityA.velocity.sub(impulse);
      }
      
      if (entityB.mass) {
        entityB.velocity.add(impulse.clone().divideScalar(entityB.mass));
      } else {
        entityB.velocity.add(impulse);
      }
    }
    
    // Call collision handlers if they exist
    if (entityA.onCollision) {
      entityA.onCollision(entityB);
    }
    
    if (entityB.onCollision) {
      entityB.onCollision(entityA);
    }
  }
  
  /**
   * Apply a force to a physics body
   * 
   * @param {Object} body - The physics body
   * @param {THREE.Vector3} force - The force vector to apply
   */
  applyForce(body, force) {
    if (!body.acceleration) {
      body.acceleration = new THREE.Vector3(0, 0, 0);
    }
    
    if (body.mass) {
      // F = ma, so a = F/m
      body.acceleration.add(force.clone().divideScalar(body.mass));
    } else {
      body.acceleration.add(force);
    }
  }
  
  /**
   * Apply an impulse to a physics body (instant velocity change)
   * 
   * @param {Object} body - The physics body
   * @param {THREE.Vector3} impulse - The impulse vector to apply
   */
  applyImpulse(body, impulse) {
    if (!body.velocity) {
      body.velocity = new THREE.Vector3(0, 0, 0);
    }
    
    if (body.mass) {
      body.velocity.add(impulse.clone().divideScalar(body.mass));
    } else {
      body.velocity.add(impulse);
    }
  }
  
  /**
   * Check if a ray intersects with a physics body
   * 
   * @param {THREE.Vector3} rayOrigin - The origin point of the ray
   * @param {THREE.Vector3} rayDirection - The direction vector of the ray
   * @param {number} maxDistance - The maximum distance to check
   * @param {Array} collisionMask - Optional collision mask to filter objects
   * @returns {Object|null} - Collision result or null if no collision
   */
  raycast(rayOrigin, rayDirection, maxDistance, collisionMask) {
    const ray = new THREE.Ray(rayOrigin, rayDirection.normalize());
    let closestHit = null;
    let closestDistance = maxDistance;
    
    for (const body of this.bodies) {
      // Skip bodies without position or radius
      if (!body.position || !body.radius) continue;
      
      // Check collision mask if specified
      if (collisionMask && body.collisionGroup) {
        if (!(body.collisionGroup & collisionMask)) continue;
      }
      
      // Perform sphere intersection test
      const sphere = new THREE.Sphere(body.position, body.radius);
      const intersectionPoint = new THREE.Vector3();
      
      if (ray.intersectSphere(sphere, intersectionPoint)) {
        const distance = rayOrigin.distanceTo(intersectionPoint);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestHit = {
            body: body,
            point: intersectionPoint.clone(),
            distance: distance,
            normal: new THREE.Vector3().subVectors(intersectionPoint, body.position).normalize()
          };
        }
      }
    }
    
    return closestHit;
  }
}