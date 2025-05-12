/**
 * Space Dogfight - Attack Drone
 * 
 * This class implements the attack drone type which provides offensive capabilities
 * to the player's ship, including laser and missile attacks.
 */

import * as THREE from 'three';
import Drone, { DroneState, DroneType } from './drone';

class AttackDrone extends Drone {
  constructor(options = {}) {
    // Set drone type to ATTACK before calling parent constructor
    options.type = DroneType.ATTACK;
    options.color = options.color || 0xff3333; // Red color for attack drones
    
    super(options);
    
    // Attack drone specific properties
    this.weapons = {
      primary: {
        name: 'Laser',
        damage: options.laserDamage || 10,
        range: options.laserRange || 500,
        cooldown: options.laserCooldown || 0.2,
        energyCost: 1,
        projectileSpeed: 500,
        color: 0xff0000
      },
      secondary: {
        name: 'Missile',
        damage: options.missileDamage || 50,
        range: options.missileRange || 800,
        cooldown: options.missileCooldown || 3.0,
        energyCost: 10,
        projectileSpeed: 200,
        color: 0xff8800
      }
    };
    
    // Energy system
    this.energy = {
      current: options.energy || 100,
      max: options.maxEnergy || 100,
      rechargeRate: options.energyRechargeRate || 10 // Units per second
    };
    
    // Attack parameters
    this.attackTarget = null;
    this.attackDuration = 0;
    this.attackMode = 'primary';
    this.attackDistance = this.weapons.primary.range * 0.7; // 70% of max range
    this.maxAttackDuration = options.maxAttackDuration || 8.0; // Maximum time to spend attacking
    
    // Attack pattern
    this.orbitSpeed = Math.random() * 0.5 + 0.5; // Randomize orbit speed
    this.orbitRadius = options.orbitRadius || 100;
    this.orbitHeight = options.orbitHeight || 50;
    this.orbitAngle = Math.random() * Math.PI * 2; // Start at random angle
    
    // Add weapon mounts
    this.createWeaponMounts();
  }
  
  /**
   * Create weapon mounts for the attack drone
   */
  createWeaponMounts() {
    // Create weapon mount points
    this.weaponMounts = {
      left: new THREE.Object3D(),
      right: new THREE.Object3D(),
      center: new THREE.Object3D()
    };
    
    // Position the mounts
    this.weaponMounts.left.position.set(-0.8, 0, -0.5);
    this.weaponMounts.right.position.set(0.8, 0, -0.5);
    this.weaponMounts.center.position.set(0, -0.5, -0.5);
    
    // Add to the mesh
    this.mesh.add(this.weaponMounts.left);
    this.mesh.add(this.weaponMounts.right);
    this.mesh.add(this.weaponMounts.center);
    
    // Create visual representations of weapons
    const laserGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
    const laserMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      emissive: 0x880000,
      shininess: 100
    });
    
    const leftLaser = new THREE.Mesh(laserGeometry, laserMaterial);
    const rightLaser = new THREE.Mesh(laserGeometry, laserMaterial);
    
    leftLaser.rotation.x = -Math.PI / 2;
    rightLaser.rotation.x = -Math.PI / 2;
    
    this.weaponMounts.left.add(leftLaser);
    this.weaponMounts.right.add(rightLaser);
    
    // Missile launcher
    const missileGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
    const missileMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      emissive: 0x222222
    });
    
    const missileLauncher = new THREE.Mesh(missileGeometry, missileMaterial);
    this.weaponMounts.center.add(missileLauncher);
  }
  
  /**
   * Create visual effects for the drone
   */
  createEffects() {
    super.createEffects();
    
    // Create targeting laser effect
    const targetingGeometry = new THREE.BufferGeometry();
    const targetingMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    
    // Set initial positions (will be updated dynamically)
    const positions = new Float32Array(6); // 2 points, 3 coordinates each
    targetingGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    this.targetingLaser = new THREE.Line(targetingGeometry, targetingMaterial);
    this.targetingLaser.visible = false;
    this.group.add(this.targetingLaser);
  }
  
  /**
   * Process a command from the voice system
   */
  processCommand(command) {
    // Call parent method
    super.processCommand(command);
    
    // Process attack drone specific commands
    switch(command.action) {
      case 'drone-attack':
        return this.handleAttackCommand(command);
        
      case 'drone-recall':
        return this.handleRecallCommand(command);
        
      case 'drone-all':
        if (command.params.command === 'attack') {
          return this.handleAttackCommand(command);
        }
        break;
    }
    
    return false;
  }
  
  /**
   * Handle attack command
   */
  handleAttackCommand(command) {
    // Check if a target is available
    if (!this.owner || !this.owner.target) {
      console.log("No target available for attack");
      return false;
    }
    
    // Get target from owner
    this.attackTarget = this.owner.target;
    
    // Determine weapon mode from params (if specified)
    if (command.params.weaponType === 'missile') {
      this.attackMode = 'secondary';
    } else if (command.params.weaponType === 'laser') {
      this.attackMode = 'primary';
    } else {
      // Default to primary
      this.attackMode = 'primary';
    }
    
    // Check cooldown for the selected weapon
    if (this.isOnCooldown(this.attackMode)) {
      console.log(`Weapon ${this.attackMode} is on cooldown`);
      return false;
    }
    
    // Check energy for the selected weapon
    const weapon = this.weapons[this.attackMode];
    if (this.energy.current < weapon.energyCost) {
      console.log(`Not enough energy for ${weapon.name}`);
      return false;
    }
    
    // Set to execute state
    this.setState(DroneState.EXECUTE);
    this.attackDuration = 0;
    
    // Apply cooldown
    this.startCooldown(this.attackMode, weapon.cooldown);
    
    // Reduce energy
    this.energy.current -= weapon.energyCost;
    
    // Create attack effect
    this.createAttackEffect();
    
    return true;
  }
  
  /**
   * Handle recall command
   */
  handleRecallCommand(command) {
    // Stop any ongoing attack
    this.attackTarget = null;
    this.targetingLaser.visible = false;
    
    // Return to owner
    this.setState(DroneState.RETURN);
    
    return true;
  }
  
  /**
   * Create visual effect for attack
   */
  createAttackEffect() {
    if (!this.attackTarget) return;
    
    // Different effects based on weapon type
    if (this.attackMode === 'primary') {
      // Show targeting laser
      this.targetingLaser.visible = true;
      
      // Update targeting laser positions
      const positions = this.targetingLaser.geometry.attributes.position.array;
      
      // Start position (drone's position)
      positions[0] = 0;
      positions[1] = 0;
      positions[2] = 0;
      
      // End position (target's position in local space)
      const targetWorldPos = this.attackTarget.position.clone();
      const targetLocalPos = this.group.worldToLocal(targetWorldPos);
      
      positions[3] = targetLocalPos.x;
      positions[4] = targetLocalPos.y;
      positions[5] = targetLocalPos.z;
      
      this.targetingLaser.geometry.attributes.position.needsUpdate = true;
      
      // Create laser beam effect (would be done with a particle system in a full implementation)
      console.log(`Drone ${this.id} firing lasers at target`);
    } else {
      // Missile effect
      console.log(`Drone ${this.id} launching missile at target`);
      
      // In a full implementation, would create a missile entity here
    }
  }
  
  /**
   * Update execute state behavior
   */
  updateExecuteState(deltaTime) {
    // Handle attack logic when in execute state
    if (this.attackTarget) {
      // Update attack duration
      this.attackDuration += deltaTime;
      
      // Check if attack should end
      if (this.attackDuration >= this.maxAttackDuration) {
        this.attackTarget = null;
        this.targetingLaser.visible = false;
        this.setState(DroneState.RETURN);
        return;
      }
      
      // Get target position
      const targetPosition = this.attackTarget.position.clone();
      
      // Calculate orbit position around target
      this.orbitAngle += this.orbitSpeed * deltaTime;
      
      // Calculate orbit position
      const orbitX = Math.cos(this.orbitAngle) * this.orbitRadius;
      const orbitY = Math.sin(this.orbitAngle * 0.5) * this.orbitHeight; // Oscillate height
      const orbitZ = Math.sin(this.orbitAngle) * this.orbitRadius;
      
      // Set target position at orbit distance from target
      this.targetPosition.set(
        targetPosition.x + orbitX,
        targetPosition.y + orbitY,
        targetPosition.z + orbitZ
      );
      
      // Move towards orbit position
      this.moveTowards(this.targetPosition, 0.9);
      
      // Look at target
      this.lookAt(targetPosition);
      
      // Update targeting beam if visible
      if (this.targetingLaser.visible) {
        // Update targeting laser positions
        const positions = this.targetingLaser.geometry.attributes.position.array;
        
        // Start position (drone's position)
        positions[0] = 0;
        positions[1] = 0;
        positions[2] = 0;
        
        // End position (target's position in local space)
        const targetLocalPos = this.group.worldToLocal(targetPosition);
        
        positions[3] = targetLocalPos.x;
        positions[4] = targetLocalPos.y;
        positions[5] = targetLocalPos.z;
        
        this.targetingLaser.geometry.attributes.position.needsUpdate = true;
      }
      
      // Continue attack while in execute state
      this.attackCycle(deltaTime);
    } else {
      // No target, return to owner
      super.updateExecuteState(deltaTime);
    }
  }
  
  /**
   * Perform attack cycle during execute state
   */
  attackCycle(deltaTime) {
    // Recharge energy
    this.energy.current = Math.min(
      this.energy.current + this.energy.rechargeRate * deltaTime,
      this.energy.max
    );
    
    // Attempt to fire if cooldown is over and we have energy
    const weapon = this.weapons[this.attackMode];
    
    if (!this.isOnCooldown(this.attackMode) && this.energy.current >= weapon.energyCost) {
      // Apply cooldown
      this.startCooldown(this.attackMode, weapon.cooldown);
      
      // Reduce energy
      this.energy.current -= weapon.energyCost;
      
      // Fire weapon - in a full implementation, would create projectiles here
      console.log(`Drone ${this.id} firing ${weapon.name} at target`);
      
      // Apply damage directly to target (simplified)
      if (this.attackTarget && typeof this.attackTarget.takeDamage === 'function') {
        this.attackTarget.takeDamage(weapon.damage);
      }
    }
  }
  
  /**
   * Update visual effects
   */
  updateEffects(deltaTime) {
    super.updateEffects(deltaTime);
    
    // Pulse weapons based on cooldown
    const leftLaser = this.weaponMounts.left.children[0];
    const rightLaser = this.weaponMounts.right.children[0];
    
    // Pulse color based on cooldown
    if (this.isOnCooldown('primary')) {
      const cooldownPercent = this.getCooldownRemaining('primary') / this.weapons.primary.cooldown;
      
      // Fade from bright to dim as cooldown progresses
      const intensity = 1 - cooldownPercent;
      leftLaser.material.emissive.setRGB(intensity * 0.8, 0, 0);
      rightLaser.material.emissive.setRGB(intensity * 0.8, 0, 0);
    } else {
      // Ready to fire - bright glow
      leftLaser.material.emissive.setRGB(0.8, 0, 0);
      rightLaser.material.emissive.setRGB(0.8, 0, 0);
    }
    
    // Missile launcher effect
    const missileLauncher = this.weaponMounts.center.children[0];
    
    if (this.isOnCooldown('secondary')) {
      const cooldownPercent = this.getCooldownRemaining('secondary') / this.weapons.secondary.cooldown;
      
      // Fade from bright to dim as cooldown progresses
      const intensity = 1 - cooldownPercent;
      missileLauncher.material.emissive.setRGB(intensity * 0.2, intensity * 0.1, 0);
    } else {
      // Ready to fire - subtle glow
      missileLauncher.material.emissive.setRGB(0.2, 0.1, 0);
    }
  }
}

export default AttackDrone;