/**
 * Space Dogfight - Spaceship Entity
 * 
 * This class represents a spaceship in the game, which can be player-controlled or AI.
 */

import * as THREE from 'three';

export default class Spaceship {
  constructor(name, isPlayer, scene, camera) {
    this.name = name;
    this.isPlayer = isPlayer;
    this.scene = scene;
    this.camera = camera;
    
    // Create a group to hold all the spaceship parts
    this.group = new THREE.Group();
    this.group.name = name;
    
    // Spaceship stats
    this.stats = {
      health: 100,
      maxHealth: 100,
      shield: 100,
      maxShield: 100,
      shieldRechargeRate: 5, // Units per second
      maxSpeed: 100,
      acceleration: 50,
      rotationSpeed: 2,
      boostMultiplier: 2,
      boostDuration: 3, // Seconds
      boostCooldown: 5, // Seconds
      weapons: {
        primary: {
          damage: 10,
          fireRate: 5, // Shots per second
          lastFired: 0, // Time since last fired
          range: 1000,
          speed: 500,
          unlimited: true
        },
        secondary: {
          damage: 50,
          fireRate: 1, // Shots per second
          lastFired: 0, // Time since last fired
          ammo: 8,
          maxAmmo: 8,
          range: 2000,
          speed: 200
        }
      }
    };
    
    // Physics state
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    
    // Boost state
    this.isBoosting = false;
    this.boostTimeRemaining = this.stats.boostDuration;
    this.boostCooldownRemaining = 0;
    
    // Create the spaceship mesh
    this.createMesh();
    
    // Add the group to the scene
    this.scene.add(this.group);
  }
  
  /**
   * Create the spaceship mesh using Three.js geometries
   */
  createMesh() {
    // Create body using cone geometry
    const bodyGeometry = new THREE.ConeGeometry(1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3377ff });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.rotation.x = Math.PI / 2; // Rotate to point forward (along Z axis)
    this.group.add(this.mesh);
    
    // Create wings using box geometries
    const wingGeometry = new THREE.BoxGeometry(3, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x3377ff });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, 0);
    this.group.add(leftWing);
    
    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, 0);
    this.group.add(rightWing);
    
    // Create cockpit using sphere geometry
    const cockpitGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ color: 0x88aaff, transparent: true, opacity: 0.7 });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, -1);
    this.group.add(cockpit);
    
    // Create engine glow using point light
    const engineLight = new THREE.PointLight(0x00ffff, 2, 10);
    engineLight.position.set(0, 0, 2);
    this.group.add(engineLight);
    
    // Create weapon mounts
    this.weaponMounts = {
      primaryLeft: new THREE.Object3D(),
      primaryRight: new THREE.Object3D(),
      secondary: new THREE.Object3D()
    };
    
    // Position weapon mounts
    this.weaponMounts.primaryLeft.position.set(-1, 0, -1.5);
    this.weaponMounts.primaryRight.position.set(1, 0, -1.5);
    this.weaponMounts.secondary.position.set(0, -0.5, -1);
    
    // Add weapon mounts to group
    this.group.add(this.weaponMounts.primaryLeft);
    this.group.add(this.weaponMounts.primaryRight);
    this.group.add(this.weaponMounts.secondary);
    
    // Set initial position
    this.group.position.set(0, 0, 0);
  }
  
  /**
   * Update the spaceship state
   * 
   * @param {number} deltaTime - Time since last update in seconds
   * @param {object} input - Input state
   */
  update(deltaTime, input) {
    if (this.isPlayer) {
      this.handlePlayerInput(deltaTime, input);
    } else {
      this.handleAI(deltaTime);
    }
    
    // Apply physics
    this.updatePhysics(deltaTime);
    
    // Update spaceship position and rotation
    this.group.position.copy(this.position);
    this.group.rotation.copy(this.rotation);
    
    // Update shield recharge
    if (this.stats.shield < this.stats.maxShield) {
      this.stats.shield = Math.min(
        this.stats.shield + this.stats.shieldRechargeRate * deltaTime,
        this.stats.maxShield
      );
    }
    
    // Update boost cooldown
    if (this.boostCooldownRemaining > 0) {
      this.boostCooldownRemaining = Math.max(0, this.boostCooldownRemaining - deltaTime);
    }
    
    // Update weapon cooldowns
    this.stats.weapons.primary.lastFired += deltaTime;
    this.stats.weapons.secondary.lastFired += deltaTime;
  }
  
  /**
   * Handle player input
   */
  handlePlayerInput(deltaTime, input) {
    const movement = input.getMovement();
    const aim = input.getAim();
    
    // Apply thrust based on input
    const thrustVector = new THREE.Vector3(
      movement.right,
      movement.up,
      movement.forward
    ).normalize().multiplyScalar(this.stats.acceleration);
    
    // Apply thrust in local space
    this.acceleration.set(0, 0, 0);
    this.group.localToWorld(thrustVector);
    this.acceleration.add(thrustVector);
    
    // Handle boost
    if (movement.boost && this.boostCooldownRemaining === 0 && this.boostTimeRemaining > 0) {
      this.isBoosting = true;
      this.boostTimeRemaining = Math.max(0, this.boostTimeRemaining - deltaTime);
      
      // Apply boost multiplier to acceleration
      this.acceleration.multiplyScalar(this.stats.boostMultiplier);
      
      // Start cooldown if boost depleted
      if (this.boostTimeRemaining === 0) {
        this.isBoosting = false;
        this.boostCooldownRemaining = this.stats.boostCooldown;
      }
    } else {
      this.isBoosting = false;
      
      // Recharge boost when not in use and not on cooldown
      if (this.boostCooldownRemaining === 0 && this.boostTimeRemaining < this.stats.boostDuration) {
        this.boostTimeRemaining = Math.min(
          this.boostTimeRemaining + deltaTime * 0.5, // Recharge at half the depletion rate
          this.stats.boostDuration
        );
      }
    }
    
    // Handle brake
    if (movement.brake) {
      // Apply braking force opposite to velocity
      if (this.velocity.length() > 0) {
        const brakeVector = this.velocity.clone().normalize().negate().multiplyScalar(this.stats.acceleration * 2);
        this.acceleration.add(brakeVector);
      }
    }
    
    // Handle aim (rotation) using mouse
    // In a real implementation, we would use raycasting with a plane to determine aim point
    // For now, we'll just rotate towards the mouse position
    if (Math.abs(aim.x) > 0.1 || Math.abs(aim.y) > 0.1) {
      // Calculate target rotation based on mouse position
      const targetPitch = -aim.y * Math.PI * 0.5;
      const targetYaw = aim.x * Math.PI * 0.5;
      
      // Apply rotation with smooth interpolation
      this.rotation.x += (targetPitch - this.rotation.x) * deltaTime * this.stats.rotationSpeed;
      this.rotation.y += (targetYaw - this.rotation.y) * deltaTime * this.stats.rotationSpeed;
    }
    
    // Handle firing weapons
    if (input.isPrimaryFiring()) {
      this.firePrimaryWeapon();
    }
    
    if (input.isSecondaryFiring()) {
      this.fireSecondaryWeapon();
    }
  }
  
  /**
   * Handle AI behavior (to be implemented)
   */
  handleAI(deltaTime) {
    // AI behavior will be implemented later
  }
  
  /**
   * Update physics
   */
  updatePhysics(deltaTime) {
    // Apply acceleration to velocity
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    
    // Apply drag (simulating space, so very low drag)
    const drag = 0.1;
    this.velocity.multiplyScalar(1 - drag * deltaTime);
    
    // Limit speed
    const currentSpeed = this.velocity.length();
    const maxSpeed = this.stats.maxSpeed * (this.isBoosting ? this.stats.boostMultiplier : 1);
    
    if (currentSpeed > maxSpeed) {
      this.velocity.normalize().multiplyScalar(maxSpeed);
    }
    
    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Reset acceleration for next frame
    this.acceleration.set(0, 0, 0);
  }
  
  /**
   * Fire primary weapon (lasers)
   */
  firePrimaryWeapon() {
    const primaryWeapon = this.stats.weapons.primary;
    const fireInterval = 1 / primaryWeapon.fireRate;
    
    if (primaryWeapon.lastFired >= fireInterval) {
      // Reset fire timer
      primaryWeapon.lastFired = 0;
      
      console.log('Firing primary weapon (laser)');
      
      // In the actual implementation, we would create laser projectiles here
      // For now, we'll just log to the console
    }
  }
  
  /**
   * Fire secondary weapon (missiles)
   */
  fireSecondaryWeapon() {
    const secondaryWeapon = this.stats.weapons.secondary;
    const fireInterval = 1 / secondaryWeapon.fireRate;
    
    if (secondaryWeapon.lastFired >= fireInterval && secondaryWeapon.ammo > 0) {
      // Reset fire timer
      secondaryWeapon.lastFired = 0;
      
      // Decrease ammo
      secondaryWeapon.ammo--;
      
      console.log(`Firing secondary weapon (missile), ${secondaryWeapon.ammo} missiles remaining`);
      
      // In the actual implementation, we would create missile projectiles here
    }
  }
  
  /**
   * Apply damage to the spaceship
   */
  takeDamage(amount) {
    // Damage is applied to shields first, then health
    if (this.stats.shield > 0) {
      const shieldDamage = Math.min(this.stats.shield, amount);
      this.stats.shield -= shieldDamage;
      amount -= shieldDamage;
    }
    
    // Apply remaining damage to health
    if (amount > 0) {
      this.stats.health = Math.max(0, this.stats.health - amount);
      
      // Check if destroyed
      if (this.stats.health <= 0) {
        this.onDestroyed();
      }
    }
  }
  
  /**
   * Handle spaceship destruction
   */
  onDestroyed() {
    console.log(`${this.name} was destroyed!`);
    
    // In the actual implementation, we would create explosion effects
    // and remove the spaceship from the scene
  }
}