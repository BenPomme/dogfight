import * as THREE from 'three';

export default class AIController {
  constructor(spaceship, target) {
    this.spaceship = spaceship;
    this.target = target;
    
    // AI behavior parameters
    this.parameters = {
      pursuitDistance: 200, // Distance to maintain from target
      attackDistance: 100,  // Distance to start attacking
      evasionDistance: 50,  // Distance to start evading
      rotationSpeed: 2,     // How fast to rotate towards target
      maxSpeed: 80,         // Maximum speed
      minSpeed: 20,         // Minimum speed
      attackCooldown: 1,    // Time between attacks
      lastAttackTime: 0,    // Last time an attack was made
      state: 'pursuit'      // Current AI state
    };
  }

  update(deltaTime) {
    // Calculate distance to target
    const distanceToTarget = this.spaceship.position.distanceTo(this.target.position);
    
    // Update AI state based on distance
    this.updateState(distanceToTarget);
    
    // Execute current state behavior
    switch (this.parameters.state) {
      case 'pursuit':
        this.pursueTarget(deltaTime);
        break;
      case 'attack':
        this.attackTarget(deltaTime);
        break;
      case 'evade':
        this.evadeTarget(deltaTime);
        break;
    }
  }

  updateState(distanceToTarget) {
    if (distanceToTarget < this.parameters.evasionDistance) {
      this.parameters.state = 'evade';
    } else if (distanceToTarget < this.parameters.attackDistance) {
      this.parameters.state = 'attack';
    } else {
      this.parameters.state = 'pursuit';
    }
  }

  pursueTarget(deltaTime) {
    // Calculate direction to target
    const directionToTarget = new THREE.Vector3()
      .subVectors(this.target.position, this.spaceship.position)
      .normalize();
    
    // Calculate desired velocity
    const desiredVelocity = directionToTarget.multiplyScalar(this.parameters.maxSpeed);
    
    // Calculate steering force
    const steeringForce = new THREE.Vector3()
      .subVectors(desiredVelocity, this.spaceship.velocity)
      .multiplyScalar(0.1);
    
    // Apply steering force
    this.spaceship.acceleration.add(steeringForce);
    
    // Rotate towards target
    this.rotateTowardsTarget(directionToTarget, deltaTime);
  }

  attackTarget(deltaTime) {
    // Calculate direction to target
    const directionToTarget = new THREE.Vector3()
      .subVectors(this.target.position, this.spaceship.position)
      .normalize();
    
    // Calculate desired velocity for attack
    const desiredVelocity = directionToTarget.multiplyScalar(this.parameters.maxSpeed * 0.8);
    
    // Calculate steering force
    const steeringForce = new THREE.Vector3()
      .subVectors(desiredVelocity, this.spaceship.velocity)
      .multiplyScalar(0.2);
    
    // Apply steering force
    this.spaceship.acceleration.add(steeringForce);
    
    // Rotate towards target
    this.rotateTowardsTarget(directionToTarget, deltaTime);
    
    // Attack if cooldown has passed
    if (deltaTime - this.parameters.lastAttackTime > this.parameters.attackCooldown) {
      this.spaceship.firePrimaryWeapon();
      this.parameters.lastAttackTime = deltaTime;
    }
  }

  evadeTarget(deltaTime) {
    // Calculate direction away from target
    const directionFromTarget = new THREE.Vector3()
      .subVectors(this.spaceship.position, this.target.position)
      .normalize();
    
    // Calculate desired velocity for evasion
    const desiredVelocity = directionFromTarget.multiplyScalar(this.parameters.maxSpeed);
    
    // Calculate steering force
    const steeringForce = new THREE.Vector3()
      .subVectors(desiredVelocity, this.spaceship.velocity)
      .multiplyScalar(0.3);
    
    // Apply steering force
    this.spaceship.acceleration.add(steeringForce);
    
    // Rotate away from target
    this.rotateTowardsTarget(directionFromTarget, deltaTime);
  }

  rotateTowardsTarget(direction, deltaTime) {
    // Calculate target rotation
    const targetRotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), // Forward direction
        direction
      )
    );
    
    // Calculate rotation difference
    const rotationDiff = new THREE.Euler(
      targetRotation.x - this.spaceship.rotation.x,
      targetRotation.y - this.spaceship.rotation.y,
      targetRotation.z - this.spaceship.rotation.z
    );
    
    // Apply rotation with smoothing
    this.spaceship.rotation.x += rotationDiff.x * this.parameters.rotationSpeed * deltaTime;
    this.spaceship.rotation.y += rotationDiff.y * this.parameters.rotationSpeed * deltaTime;
    this.spaceship.rotation.z += rotationDiff.z * this.parameters.rotationSpeed * deltaTime;
  }
} 