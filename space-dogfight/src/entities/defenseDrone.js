/**
 * Space Dogfight - Defense Drone
 * 
 * This class implements the defense drone type which provides shield and ECM capabilities
 * to protect the player's ship from incoming attacks.
 */

import * as THREE from 'three';
import Drone, { DroneState, DroneType } from './drone';

class DefenseDrone extends Drone {
  constructor(options = {}) {
    // Set drone type to DEFENSE before calling parent constructor
    options.type = DroneType.DEFENSE;
    options.color = options.color || 0x3333ff; // Blue color for defense drones
    
    super(options);
    
    // Defense drone specific properties
    this.systems = {
      shield: {
        name: 'Energy Shield',
        strength: options.shieldStrength || 100,
        range: options.shieldRange || 30,
        cooldown: options.shieldCooldown || 5.0,
        energyCost: 20,
        rechargeRate: options.shieldRechargeRate || 5, // Per second
        active: false
      },
      ecm: {
        name: 'ECM System',
        strength: options.ecmStrength || 75,
        range: options.ecmRange || 150,
        cooldown: options.ecmCooldown || 8.0,
        energyCost: 30,
        duration: options.ecmDuration || 4.0, // Seconds
        active: false
      }
    };
    
    // Energy system
    this.energy = {
      current: options.energy || 100,
      max: options.maxEnergy || 100,
      rechargeRate: options.energyRechargeRate || 8 // Units per second
    };
    
    // Defense parameters
    this.shieldRadius = this.systems.shield.range;
    this.shieldActive = false;
    this.ecmActive = false;
    this.ecmTimer = 0;
    this.defenseTarget = null;
    this.defenseDuration = 0;
    this.maxDefenseDuration = options.maxDefenseDuration || 15.0; // Maximum time to spend defending
    
    // Defense pattern
    this.orbitSpeed = Math.random() * 0.3 + 0.2; // Slower than attack drones
    this.orbitRadius = options.orbitRadius || 15; // Closer to target
    this.orbitHeight = options.orbitHeight || 10;
    this.orbitAngle = Math.random() * Math.PI * 2; // Start at random angle
    
    // Create shield and ECM systems
    this.createDefenseSystems();
  }
  
  /**
   * Create shield and ECM systems
   */
  createDefenseSystems() {
    // Create shield mesh
    const shieldGeometry = new THREE.SphereGeometry(this.shieldRadius, 16, 16);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    this.group.add(this.shieldMesh);
    
    // Create ECM emitter
    const ecmGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    const ecmMaterial = new THREE.MeshPhongMaterial({
      color: 0x0066ff,
      emissive: 0x0033aa,
      shininess: 100
    });
    
    this.ecmEmitter = new THREE.Mesh(ecmGeometry, ecmMaterial);
    this.ecmEmitter.position.set(0, 1, 0);
    this.ecmEmitter.rotation.x = Math.PI;
    this.mesh.add(this.ecmEmitter);
    
    // Create ECM particles (simplified)
    const ecmParticleGeometry = new THREE.BufferGeometry();
    const ecmParticleMaterial = new THREE.PointsMaterial({
      color: 0x00aaff,
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    // Create particle positions (will be animated)
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    // Initialize particles in a sphere
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    ecmParticleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    this.ecmParticles = new THREE.Points(ecmParticleGeometry, ecmParticleMaterial);
    this.ecmParticles.visible = false;
    this.group.add(this.ecmParticles);
  }
  
  /**
   * Create visual effects for the drone
   */
  createEffects() {
    super.createEffects();
    
    // Create shield pulse effect
    const pulseGeometry = new THREE.RingGeometry(1, 1.2, 16);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    this.pulseMesh.rotation.x = Math.PI / 2;
    this.group.add(this.pulseMesh);
  }
  
  /**
   * Process a command from the voice system
   */
  processCommand(command) {
    // Call parent method
    super.processCommand(command);
    
    // Process defense drone specific commands
    switch(command.action) {
      case 'drone-shield':
        return this.handleShieldCommand(command);
        
      case 'drone-ecm':
      case 'drone-defend':
        return this.handleECMCommand(command);
        
      case 'drone-recall':
        return this.handleRecallCommand(command);
        
      case 'drone-all':
        if (command.params.command === 'defend' || command.params.command === 'shield') {
          return this.handleShieldCommand(command);
        } else if (command.params.command === 'ecm' || command.params.command === 'jam') {
          return this.handleECMCommand(command);
        }
        break;
    }
    
    return false;
  }
  
  /**
   * Handle shield command
   */
  handleShieldCommand(command) {
    // Check if owner exists
    if (!this.owner) {
      console.log("No owner to defend");
      return false;
    }
    
    // Check cooldown
    if (this.isOnCooldown('shield')) {
      console.log(`Shield system is on cooldown`);
      return false;
    }
    
    // Check energy
    if (this.energy.current < this.systems.shield.energyCost) {
      console.log(`Not enough energy for shield`);
      return false;
    }
    
    // Set defense target to owner
    this.defenseTarget = this.owner;
    
    // Parse shield state
    const shieldState = command.params.state || 'on';
    
    // Activate or deactivate shield
    if (shieldState.toLowerCase() === 'off') {
      this.deactivateShield();
      return true;
    }
    
    // Set to execute state
    this.setState(DroneState.EXECUTE);
    this.defenseDuration = 0;
    
    // Apply cooldown
    this.startCooldown('shield', this.systems.shield.cooldown);
    
    // Reduce energy
    this.energy.current -= this.systems.shield.energyCost;
    
    // Activate shield
    this.activateShield();
    
    return true;
  }
  
  /**
   * Handle ECM command
   */
  handleECMCommand(command) {
    // Check if owner exists
    if (!this.owner) {
      console.log("No owner to defend");
      return false;
    }
    
    // Check cooldown
    if (this.isOnCooldown('ecm')) {
      console.log(`ECM system is on cooldown`);
      return false;
    }
    
    // Check energy
    if (this.energy.current < this.systems.ecm.energyCost) {
      console.log(`Not enough energy for ECM`);
      return false;
    }
    
    // Set defense target to owner
    this.defenseTarget = this.owner;
    
    // Set to execute state
    this.setState(DroneState.EXECUTE);
    this.defenseDuration = 0;
    
    // Apply cooldown
    this.startCooldown('ecm', this.systems.ecm.cooldown);
    
    // Reduce energy
    this.energy.current -= this.systems.ecm.energyCost;
    
    // Activate ECM
    this.activateECM();
    
    return true;
  }
  
  /**
   * Handle recall command
   */
  handleRecallCommand(command) {
    // Deactivate systems
    this.deactivateShield();
    this.deactivateECM();
    
    // Clear defense target
    this.defenseTarget = null;
    
    // Return to owner
    this.setState(DroneState.RETURN);
    
    return true;
  }
  
  /**
   * Activate shield
   */
  activateShield() {
    this.shieldActive = true;
    this.systems.shield.active = true;
    
    // Make shield visible with fade-in
    this.shieldMesh.material.opacity = 0.2;
    
    console.log(`Drone ${this.id} activated shield`);
    
    // In a full implementation, would register the shield with a collision system
  }
  
  /**
   * Deactivate shield
   */
  deactivateShield() {
    this.shieldActive = false;
    this.systems.shield.active = false;
    
    // Fade-out shield
    this.shieldMesh.material.opacity = 0.0;
    
    console.log(`Drone ${this.id} deactivated shield`);
  }
  
  /**
   * Activate ECM
   */
  activateECM() {
    this.ecmActive = true;
    this.systems.ecm.active = true;
    this.ecmTimer = 0;
    
    // Show ECM particles
    this.ecmParticles.visible = true;
    
    console.log(`Drone ${this.id} activated ECM system`);
    
    // In a full implementation, would register with the enemy targeting system
    // to reduce accuracy or disable enemy locks
  }
  
  /**
   * Deactivate ECM
   */
  deactivateECM() {
    this.ecmActive = false;
    this.systems.ecm.active = false;
    
    // Hide ECM particles
    this.ecmParticles.visible = false;
    
    console.log(`Drone ${this.id} deactivated ECM system`);
  }
  
  /**
   * Update execute state behavior
   */
  updateExecuteState(deltaTime) {
    // Handle defense logic when in execute state
    if (this.defenseTarget) {
      // Update defense duration
      this.defenseDuration += deltaTime;
      
      // Check if defense should end due to time limit
      if (this.defenseDuration >= this.maxDefenseDuration) {
        this.deactivateShield();
        this.deactivateECM();
        this.defenseTarget = null;
        this.setState(DroneState.RETURN);
        return;
      }
      
      // Get target position
      const targetPosition = this.defenseTarget.position.clone();
      
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
      
      // Update defense systems
      this.updateDefenseSystems(deltaTime);
    } else {
      // No target, return to owner
      super.updateExecuteState(deltaTime);
    }
  }
  
  /**
   * Update defense systems
   */
  updateDefenseSystems(deltaTime) {
    // Recharge energy
    this.energy.current = Math.min(
      this.energy.current + this.energy.rechargeRate * deltaTime,
      this.energy.max
    );
    
    // Update shield
    if (this.shieldActive) {
      // Position shield at the defense target
      if (this.defenseTarget) {
        const relativePos = this.defenseTarget.position.clone().sub(this.position);
        this.shieldMesh.position.copy(relativePos);
      } else {
        this.shieldMesh.position.set(0, 0, 0);
      }
      
      // Pulse shield with subtle animation
      const pulseIntensity = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
      this.shieldMesh.material.opacity = pulseIntensity;
      
      // Create pulse wave effect
      this.createShieldPulse();
    }
    
    // Update ECM
    if (this.ecmActive) {
      // Update ECM timer
      this.ecmTimer += deltaTime;
      
      // Check if ECM duration has expired
      if (this.ecmTimer >= this.systems.ecm.duration) {
        this.deactivateECM();
      } else {
        // Animate ECM particles
        this.updateECMParticles(deltaTime);
      }
    }
  }
  
  /**
   * Create shield pulse wave effect
   */
  createShieldPulse() {
    // Only create pulse at intervals
    if (Math.random() > 0.05) return; // ~3 pulses per second
    
    // Reset pulse ring
    this.pulseMesh.material.opacity = 0.7;
    this.pulseMesh.scale.set(5, 5, 5);
    
    // Position at shield center
    this.pulseMesh.position.copy(this.shieldMesh.position);
    
    // Animate the pulse
    const animatePulse = () => {
      // Expand and fade
      this.pulseMesh.scale.multiplyScalar(1.1);
      this.pulseMesh.material.opacity *= 0.9;
      
      // Continue animation until faded
      if (this.pulseMesh.material.opacity > 0.01) {
        requestAnimationFrame(animatePulse);
      } else {
        this.pulseMesh.material.opacity = 0;
      }
    };
    
    // Start animation
    requestAnimationFrame(animatePulse);
  }
  
  /**
   * Update ECM particles
   */
  updateECMParticles(deltaTime) {
    // Get particle positions
    const positions = this.ecmParticles.geometry.attributes.position.array;
    const particleCount = positions.length / 3;
    
    // Animate each particle
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Move outward from center
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Calculate distance from center
      const distance = Math.sqrt(x*x + y*y + z*z);
      
      // If particle is too far, reset to center
      if (distance > this.systems.ecm.range) {
        positions[i3] = (Math.random() - 0.5) * 5;
        positions[i3 + 1] = (Math.random() - 0.5) * 5;
        positions[i3 + 2] = (Math.random() - 0.5) * 5;
      } else {
        // Move particle outward
        const speed = (30 + Math.random() * 20) * deltaTime;
        const direction = distance > 0 ? speed / distance : 0;
        
        positions[i3] += x * direction;
        positions[i3 + 1] += y * direction;
        positions[i3 + 2] += z * direction;
        
        // Add some random movement
        positions[i3] += (Math.random() - 0.5) * deltaTime * 5;
        positions[i3 + 1] += (Math.random() - 0.5) * deltaTime * 5;
        positions[i3 + 2] += (Math.random() - 0.5) * deltaTime * 5;
      }
    }
    
    // Update geometry
    this.ecmParticles.geometry.attributes.position.needsUpdate = true;
    
    // Pulse ECM emitter
    const pulseIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
    this.ecmEmitter.material.emissive.setRGB(0, 0.2 * pulseIntensity, 0.5 * pulseIntensity);
  }
  
  /**
   * Update visual effects
   */
  updateEffects(deltaTime) {
    super.updateEffects(deltaTime);
    
    // Pulse ECM emitter based on cooldown
    if (this.isOnCooldown('ecm')) {
      const cooldownPercent = this.getCooldownRemaining('ecm') / this.systems.ecm.cooldown;
      
      // Fade from dim to bright as cooldown progresses
      const intensity = 1 - cooldownPercent;
      this.ecmEmitter.material.emissive.setRGB(0, intensity * 0.2, intensity * 0.5);
    } else if (!this.ecmActive) {
      // Ready to fire - subtle glow
      this.ecmEmitter.material.emissive.setRGB(0, 0.2, 0.5);
    }
  }
}

export default DefenseDrone;