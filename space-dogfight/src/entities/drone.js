/**
 * Space Dogfight - Drone Base Class
 * 
 * This is the base class for all assistant drones in the game.
 * It provides common functionality for all drone types.
 */

import * as THREE from 'three';

// Drone states
export const DroneState = {
  IDLE: 'idle',       // Default state, following at a distance
  FOLLOW: 'follow',   // Actively following the player closely
  EXECUTE: 'execute', // Executing a specific command
  RETURN: 'return'    // Returning to the player after execution
};

// Drone types
export const DroneType = {
  ATTACK: 'attack',   // Combat drone with offensive capabilities
  DEFENSE: 'defense', // Shield and ECM drone
  RECON: 'recon'      // Scanning and reconnaissance drone
};

// Base drone class
class Drone {
  constructor(options = {}) {
    // Basic properties
    this.id = options.id || `drone-${Date.now()}`;
    this.type = options.type || DroneType.ATTACK;
    this.level = options.level || 1;
    this.name = options.name || `Drone ${this.id}`;
    this.owner = options.owner || null;
    
    // State and behavior
    this.state = DroneState.IDLE;
    this.target = null;
    this.targetPosition = new THREE.Vector3();
    this.followDistance = options.followDistance || 5;
    this.followOffset = options.followOffset || new THREE.Vector3(0, 2, -5);
    this.executionTimer = 0;
    this.cooldowns = new Map();
    
    // Physics properties
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.maxSpeed = options.maxSpeed || 80;
    this.maxAcceleration = options.maxAcceleration || 40;
    this.damping = options.damping || 0.05;
    
    // Visual representation
    this.group = new THREE.Group();
    this.group.name = this.name;
    
    // Create the drone mesh
    this.createMesh(options.color);
    
    // Add visual effects
    this.effects = [];
    this.createEffects();
    
    // Command history
    this.commandHistory = [];
    
    // Add to scene if provided
    if (options.scene) {
      options.scene.add(this.group);
    }
  }
  
  /**
   * Create the drone mesh using Three.js geometry
   */
  createMesh(color = 0x00ffff) {
    // Base geometry for all drones
    const bodyGeometry = new THREE.TetrahedronGeometry(1, 0);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 80,
      emissive: new THREE.Color(color).multiplyScalar(0.2)
    });
    
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.group.add(this.mesh);
    
    // Add glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    
    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      glowMaterial
    );
    
    this.mesh.add(glowMesh);
    
    // Add propulsion effect
    const engineGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    
    this.engineMesh = new THREE.Mesh(engineGeometry, engineMaterial);
    this.engineMesh.position.set(0, 0, 1);
    this.engineMesh.rotation.x = Math.PI;
    this.mesh.add(this.engineMesh);
    
    // Add light
    this.light = new THREE.PointLight(color, 1, 5);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }
  
  /**
   * Create visual effects for the drone
   */
  createEffects() {
    // This will be implemented in subclasses
  }
  
  /**
   * Update the drone state
   * 
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update cooldowns
    this.updateCooldowns(deltaTime);
    
    // Update state machine
    switch (this.state) {
      case DroneState.IDLE:
        this.updateIdleState(deltaTime);
        break;
      case DroneState.FOLLOW:
        this.updateFollowState(deltaTime);
        break;
      case DroneState.EXECUTE:
        this.updateExecuteState(deltaTime);
        break;
      case DroneState.RETURN:
        this.updateReturnState(deltaTime);
        break;
    }
    
    // Apply physics
    this.updatePhysics(deltaTime);
    
    // Update effects
    this.updateEffects(deltaTime);
    
    // Update mesh position and rotation
    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);
  }
  
  /**
   * Update idle state behavior
   */
  updateIdleState(deltaTime) {
    if (!this.owner) return;
    
    // In idle state, maintain a distance from the owner
    // and slowly orbit around them
    
    // Get owner position
    const ownerPosition = this.owner.position.clone();
    
    // Calculate target position: offset from owner
    const offsetVector = this.calculateIdleOffset(deltaTime);
    
    // Set target position
    this.targetPosition.copy(ownerPosition).add(offsetVector);
    
    // Move towards target position
    this.moveTowards(this.targetPosition, 0.5); // Half of max acceleration
  }
  
  /**
   * Calculate offset position for idle state with gentle orbiting
   */
  calculateIdleOffset(deltaTime) {
    // Create a time-based rotation around the owner
    const angle = (Date.now() * 0.0005) % (Math.PI * 2);
    
    // Calculate offset with gentle bobbing motion
    const xOffset = Math.sin(angle) * this.followDistance;
    const yOffset = Math.cos(angle) * 0.5 + 2; // Hovering above with bob
    const zOffset = Math.cos(angle) * this.followDistance;
    
    return new THREE.Vector3(xOffset, yOffset, zOffset);
  }
  
  /**
   * Update follow state behavior
   */
  updateFollowState(deltaTime) {
    if (!this.owner) return;
    
    // In follow state, closely follow the owner
    
    // Get owner position
    const ownerPosition = this.owner.position.clone();
    const ownerForward = new THREE.Vector3(0, 0, -1).applyEuler(this.owner.rotation);
    
    // Calculate target position: offset from owner in their local space
    const offset = this.followOffset.clone();
    const targetPosition = ownerPosition.clone();
    
    // Apply offset in owner's local space
    targetPosition.x += ownerForward.x * offset.z - ownerForward.z * offset.x;
    targetPosition.y += offset.y;
    targetPosition.z += ownerForward.z * offset.z + ownerForward.x * offset.x;
    
    // Set target position
    this.targetPosition.copy(targetPosition);
    
    // Move towards target position
    this.moveTowards(this.targetPosition, 0.8); // 80% of max acceleration
    
    // Face the same direction as owner
    this.faceDirection(ownerForward);
  }
  
  /**
   * Update execute state behavior
   */
  updateExecuteState(deltaTime) {
    // This will be implemented in subclasses
    // By default, just return to follow state after a short time
    
    this.executionTimer += deltaTime;
    
    // Default timeout of 3 seconds
    if (this.executionTimer > 3) {
      this.executionTimer = 0;
      this.setState(DroneState.RETURN);
    }
  }
  
  /**
   * Update return state behavior
   */
  updateReturnState(deltaTime) {
    if (!this.owner) {
      this.setState(DroneState.IDLE);
      return;
    }
    
    // In return state, move back to the owner quickly
    
    // Get owner position
    const ownerPosition = this.owner.position.clone();
    
    // Set target position directly to owner
    this.targetPosition.copy(ownerPosition);
    
    // Move towards owner at full acceleration
    this.moveTowards(this.targetPosition, 1.0);
    
    // Check if close enough to return to idle
    const distanceToOwner = this.position.distanceTo(ownerPosition);
    if (distanceToOwner < this.followDistance) {
      this.setState(DroneState.IDLE);
    }
  }
  
  /**
   * Move towards a target position with a given acceleration factor
   */
  moveTowards(targetPosition, accelerationFactor = 1.0) {
    // Calculate direction to target
    const direction = targetPosition.clone().sub(this.position).normalize();
    
    // Calculate acceleration based on distance (slowing down as we approach)
    const distance = this.position.distanceTo(targetPosition);
    const acceleration = Math.min(this.maxAcceleration * accelerationFactor, distance * 2);
    
    // Apply acceleration
    this.acceleration.copy(direction).multiplyScalar(acceleration);
  }
  
  /**
   * Face a specific direction
   */
  faceDirection(direction) {
    // Calculate target rotation
    const targetRotation = new THREE.Euler();
    
    // Look in the direction
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(
      new THREE.Vector3(0, 0, 0),
      direction,
      new THREE.Vector3(0, 1, 0)
    );
    
    // Extract rotation from matrix
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromRotationMatrix(lookAtMatrix);
    
    // Convert to Euler
    targetRotation.setFromQuaternion(targetQuaternion);
    
    // Smoothly interpolate current rotation towards target
    this.rotation.x += (targetRotation.x - this.rotation.x) * 0.1;
    this.rotation.y += (targetRotation.y - this.rotation.y) * 0.1;
    this.rotation.z += (targetRotation.z - this.rotation.z) * 0.1;
  }
  
  /**
   * Look at a specific position
   */
  lookAt(position) {
    // Calculate direction to position
    const direction = position.clone().sub(this.position).normalize();
    
    // Use faceDirection to look at it
    this.faceDirection(direction);
  }
  
  /**
   * Apply physics calculations
   */
  updatePhysics(deltaTime) {
    // Apply acceleration to velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    
    // Apply damping to velocity
    this.velocity.multiplyScalar(1 - this.damping * deltaTime);
    
    // Limit velocity to max speed
    const speed = this.velocity.length();
    if (speed > this.maxSpeed) {
      this.velocity.multiplyScalar(this.maxSpeed / speed);
    }
    
    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0, 0);
  }
  
  /**
   * Update visual effects
   */
  updateEffects(deltaTime) {
    // Pulse the engine based on velocity
    const speed = this.velocity.length();
    const thrust = Math.min(speed / this.maxSpeed, 1);
    
    // Scale the engine mesh based on thrust
    this.engineMesh.scale.set(1, 1 + thrust, 1 + thrust * 2);
    
    // Update engine glow color and intensity
    const engineColor = new THREE.Color(0xffffff);
    engineColor.lerp(new THREE.Color(0xff8800), thrust);
    this.engineMesh.material.color = engineColor;
    this.engineMesh.material.opacity = 0.5 + thrust * 0.5;
    
    // Pulse the light intensity
    this.light.intensity = 0.5 + thrust * 0.5 + Math.sin(Date.now() * 0.01) * 0.1;
  }
  
  /**
   * Set the drone state
   */
  setState(state) {
    const previousState = this.state;
    this.state = state;
    
    // Reset execution timer when entering execute state
    if (state === DroneState.EXECUTE) {
      this.executionTimer = 0;
    }
    
    console.log(`Drone ${this.id} state changed: ${previousState} -> ${state}`);
  }
  
  /**
   * Process a command from the voice system
   */
  processCommand(command) {
    // Store command in history
    this.commandHistory.push({
      timestamp: Date.now(),
      command: command
    });
    
    // Log the command
    console.log(`Drone ${this.id} received command:`, command);
    
    // Default implementation just changes state to execute
    this.setState(DroneState.EXECUTE);
    
    // Return true to indicate command was handled
    return true;
  }
  
  /**
   * Check if a cooldown is active
   */
  isOnCooldown(cooldownName) {
    return this.cooldowns.has(cooldownName) && this.cooldowns.get(cooldownName) > 0;
  }
  
  /**
   * Start a cooldown timer
   */
  startCooldown(cooldownName, duration) {
    this.cooldowns.set(cooldownName, duration);
  }
  
  /**
   * Update all cooldown timers
   */
  updateCooldowns(deltaTime) {
    for (const [name, timeRemaining] of this.cooldowns.entries()) {
      const newTime = timeRemaining - deltaTime;
      if (newTime <= 0) {
        this.cooldowns.delete(name);
      } else {
        this.cooldowns.set(name, newTime);
      }
    }
  }
  
  /**
   * Get the remaining time for a cooldown
   */
  getCooldownRemaining(cooldownName) {
    return this.cooldowns.has(cooldownName) ? this.cooldowns.get(cooldownName) : 0;
  }
}

export default Drone;