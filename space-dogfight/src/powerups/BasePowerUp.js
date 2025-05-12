import * as THREE from 'three';

/**
 * BasePowerUp class - Foundation for all power-up types
 * Defines the base behavior and properties for power-ups
 */
class BasePowerUp {
  /**
   * Create a new power-up
   * @param {Object} config - Power-up configuration
   * @param {string} config.type - Type of power-up
   * @param {string} config.name - Display name for this power-up
   * @param {THREE.Vector3} config.position - Position in the world
   * @param {number} config.value - Value/potency of the power-up
   * @param {number} config.duration - How long the effect lasts (in seconds)
   * @param {THREE.Scene} config.scene - Game scene
   */
  constructor(config = {}) {
    // Basic properties
    this.type = config.type || 'base';
    this.name = config.name || 'Power-Up';
    this.description = config.description || 'A mysterious power-up';
    this.position = config.position ? config.position.clone() : new THREE.Vector3(0, 0, 0);
    this.scene = config.scene || null;
    
    // Physical properties
    this.mesh = null;
    this.meshGroup = new THREE.Group();
    this.radius = config.radius || 1.5;
    this.rotationSpeed = new THREE.Vector3(0, 1, 0.5).multiplyScalar(Math.random() + 0.5);
    
    // Status properties
    this.isActive = true;
    this.isCollected = false;
    this.lifespan = config.lifespan || 15; // How long it exists in the world (seconds)
    this.remainingLife = this.lifespan;
    
    // Effect properties
    this.value = config.value || 10;
    this.duration = config.duration || 0; // 0 means instant effect
    this.isPermanent = config.isPermanent || false;
    
    // Visual properties
    this.color = config.color || 0x00ffaa;
    this.glowIntensity = config.glowIntensity || 1.5;
    this.pulseRate = config.pulseRate || 1.5; // Pulses per second
    
    // Initialize the power-up
    this.init();
  }
  
  /**
   * Initialize the power-up
   */
  init() {
    // Create mesh
    this.createMesh();
    
    // Set position
    this.meshGroup.position.copy(this.position);
    
    // Add to scene
    if (this.scene) {
      this.scene.add(this.meshGroup);
    }
  }
  
  /**
   * Create the visual mesh for this power-up
   * Override in subclasses for specific designs
   */
  createMesh() {
    // Default to an icosahedron for power-ups
    const geometry = new THREE.IcosahedronGeometry(this.radius, 0);
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.mesh);
    
    // Add glow effect
    const glowLight = new THREE.PointLight(this.color, this.glowIntensity, 10);
    this.meshGroup.add(glowLight);
    this.glowLight = glowLight;
    
    // Add inner core with different material
    const coreGeometry = new THREE.IcosahedronGeometry(this.radius * 0.6, 0);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(this.color).multiplyScalar(0.8),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.meshGroup.add(core);
    this.core = core;
  }
  
  /**
   * Update the power-up state
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @returns {boolean} Whether the power-up is still active
   */
  update(deltaTime) {
    if (!this.isActive) return false;
    
    // Update lifespan
    this.remainingLife -= deltaTime;
    if (this.remainingLife <= 0) {
      this.remove();
      return false;
    }
    
    // Update visual effects
    this.updateVisuals(deltaTime);
    
    // Update position and rotation
    this.updateTransform(deltaTime);
    
    return true;
  }
  
  /**
   * Update visual effects
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateVisuals(deltaTime) {
    // Add pulsing effect
    const pulsePhase = (Date.now() / 1000) * this.pulseRate * Math.PI * 2;
    const pulseValue = 0.5 + Math.sin(pulsePhase) * 0.2;
    
    // Apply to mesh scale
    if (this.mesh) {
      const baseScale = 1;
      this.mesh.scale.set(baseScale * pulseValue, baseScale * pulseValue, baseScale * pulseValue);
    }
    
    // Apply to glow intensity
    if (this.glowLight) {
      this.glowLight.intensity = this.glowIntensity * (0.8 + pulseValue * 0.4);
    }
    
    // Fade out when close to expiring
    if (this.remainingLife < 3) {
      const fadeRatio = this.remainingLife / 3;
      if (this.mesh && this.mesh.material) {
        this.mesh.material.opacity = 0.9 * fadeRatio;
      }
      
      if (this.core && this.core.material) {
        this.core.material.opacity = 0.9 * fadeRatio;
      }
      
      if (this.glowLight) {
        this.glowLight.intensity *= fadeRatio;
      }
    }
  }
  
  /**
   * Update transform (position, rotation)
   * @param {number} deltaTime - Time elapsed since last update in seconds
   */
  updateTransform(deltaTime) {
    // Rotate gradually
    this.meshGroup.rotation.x += this.rotationSpeed.x * deltaTime;
    this.meshGroup.rotation.y += this.rotationSpeed.y * deltaTime;
    this.meshGroup.rotation.z += this.rotationSpeed.z * deltaTime;
    
    // Hover effect
    const hoverHeight = 0.5;
    const hoverSpeed = 1;
    this.meshGroup.position.y = this.position.y + Math.sin(Date.now() / 1000 * hoverSpeed) * hoverHeight;
  }
  
  /**
   * Called when a player collects the power-up
   * @param {Object} player - The player who collected the power-up
   * @returns {Object} Effect data for the player to apply
   */
  collect(player) {
    if (this.isCollected) return null;
    
    this.isCollected = true;
    this.isActive = false;
    
    // Play collection effect
    this.playCollectionEffect();
    
    // Remove from scene
    this.remove();
    
    // Return effect data for the player to apply
    return {
      type: this.type,
      value: this.value,
      duration: this.duration,
      isPermanent: this.isPermanent,
      // Include additional effect-specific data here
    };
  }
  
  /**
   * Play visual/audio effect when collected
   */
  playCollectionEffect() {
    if (!this.scene || !this.meshGroup) return;
    
    // Create collection effect at power-up position
    const position = this.meshGroup.position.clone();
    
    // Create flash effect
    const flashGeometry = new THREE.SphereGeometry(this.radius * 2, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Create flash light
    const light = new THREE.PointLight(this.color, 3, 15);
    light.position.copy(position);
    this.scene.add(light);
    
    // Create particles
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.7,
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
      
      particle.userData = {
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5
      };
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Animate and remove
    let age = 0;
    const maxAge = 0.7;
    
    const updateEffect = (deltaTime) => {
      age += deltaTime;
      
      // Update flash
      const scale = 1 + age * 3;
      flash.scale.set(scale, scale, scale);
      flashMaterial.opacity = 0.7 * (1 - age / maxAge);
      
      // Update light
      light.intensity = 3 * (1 - age / maxAge);
      
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
        
        // Shrink and fade
        const lifeRatio = 1 - (data.lifetime / data.maxLifetime);
        const scale = lifeRatio * 0.5;
        particle.scale.set(scale, scale, scale);
        particle.material.opacity = 0.7 * lifeRatio;
      }
      
      // Remove when done
      if (age >= maxAge) {
        this.scene.remove(flash);
        this.scene.remove(light);
        
        particles.forEach(p => this.scene.remove(p));
        
        return false;
      }
      
      return true;
    };
    
    // Add to scene update system
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateEffect);
    }
  }
  
  /**
   * Remove the power-up from the scene
   */
  remove() {
    this.isActive = false;
    
    if (this.meshGroup && this.scene) {
      this.scene.remove(this.meshGroup);
    }
  }
  
  /**
   * Get a description of this power-up
   * @returns {string} Description of the power-up
   */
  getDescription() {
    let desc = `${this.name}: ${this.description}`;
    
    if (this.duration > 0) {
      desc += ` Lasts ${this.duration} seconds.`;
    }
    
    return desc;
  }
  
  /**
   * Create a timed cleanup animation for permanent/longer effects
   * @param {Object} player - The player
   * @param {number} duration - Duration of the effect
   * @param {Function} onComplete - Callback when effect ends
   */
  createEffectCleanup(player, duration, onComplete) {
    // This is meant to be overridden by specific power-up types
    // For example, to remove particle effects when the boost ends
    
    if (duration <= 0) return;
    
    // Set timeout to call completion callback
    setTimeout(() => {
      if (onComplete) onComplete();
    }, duration * 1000);
  }
}

export default BasePowerUp;