import * as THREE from 'three';
import BasePowerUp from './BasePowerUp';

/**
 * WeaponUpgradePowerUp - Upgrades player's weapons or provides weapon modifications
 */
class WeaponUpgradePowerUp extends BasePowerUp {
  /**
   * Create a new weapon upgrade power-up
   * @param {Object} config - Power-up configuration
   */
  constructor(config = {}) {
    // Set weapon upgrade defaults
    const weaponConfig = {
      type: 'weapon_upgrade',
      name: 'Weapon Upgrade',
      description: 'Upgrades your weapons',
      color: 0xff9900, // Orange color
      value: 1, // Generic upgrade value
      duration: 0, // Usually permanent
      isPermanent: true,
      upgradeType: config.upgradeType || 'level', // 'level', 'damage', 'rate', 'range'
      ...config
    };
    
    // Generate description based on upgrade type
    if (!config.description) {
      switch (weaponConfig.upgradeType) {
        case 'level':
          weaponConfig.description = 'Increases weapon level';
          break;
        case 'damage':
          weaponConfig.description = `+${weaponConfig.value}% weapon damage`;
          break;
        case 'rate':
          weaponConfig.description = `+${weaponConfig.value}% fire rate`;
          break;
        case 'range':
          weaponConfig.description = `+${weaponConfig.value}% weapon range`;
          break;
      }
    }
    
    // Call parent constructor
    super(weaponConfig);
    
    // Weapon-specific properties
    this.upgradeType = weaponConfig.upgradeType;
    this.targetWeaponId = config.targetWeaponId || null; // Specific weapon to upgrade, null = all
  }
  
  /**
   * Create mesh specific to weapon upgrade
   */
  createMesh() {
    // Create base group
    this.meshGroup = new THREE.Group();
    
    // Create a weapon enhancement icon
    // Base shape is a lightning bolt
    const shapePoints = [
      new THREE.Vector2(0, 1.5),
      new THREE.Vector2(0.5, 0.5),
      new THREE.Vector2(1.0, 0.7),
      new THREE.Vector2(0.3, -0.3),
      new THREE.Vector2(0.7, -1.5),
      new THREE.Vector2(-0.3, -0.5),
      new THREE.Vector2(-0.8, -0.8),
      new THREE.Vector2(-0.2, 0.5),
      new THREE.Vector2(0, 1.5)
    ];
    
    const shape = new THREE.Shape(shapePoints);
    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Create material based on upgrade type
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.4),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.meshGroup.add(this.mesh);
    
    // Add glow effect
    const glowLight = new THREE.PointLight(this.color, this.glowIntensity, 10);
    this.meshGroup.add(glowLight);
    this.glowLight = glowLight;
    
    // Add inner core that indicates upgrade type
    let coreGeometry;
    const coreSize = 0.5;
    
    switch (this.upgradeType) {
      case 'level':
        // Star shape for level upgrade
        coreGeometry = new THREE.OctahedronGeometry(coreSize, 0);
        break;
      case 'damage':
        // Cube for damage upgrade
        coreGeometry = new THREE.BoxGeometry(coreSize, coreSize, coreSize);
        break;
      case 'rate':
        // Sphere for fire rate upgrade
        coreGeometry = new THREE.SphereGeometry(coreSize, 8, 8);
        break;
      case 'range':
        // Torus for range upgrade
        coreGeometry = new THREE.TorusGeometry(coreSize, coreSize / 4, 8, 12);
        break;
      default:
        coreGeometry = new THREE.TetrahedronGeometry(coreSize, 0);
    }
    
    // Core material
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(this.color).multiplyScalar(0.6),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.z = 0.3;
    this.meshGroup.add(core);
    this.core = core;
  }
  
  /**
   * Override update for custom animation
   * @param {number} deltaTime - Time since last update
   * @returns {boolean} Whether power-up is still active
   */
  update(deltaTime) {
    // Call parent update
    const isActive = super.update(deltaTime);
    if (!isActive) return false;
    
    // Add upgrade-specific animation
    if (this.core) {
      // Rotate core
      this.core.rotation.x += deltaTime * 2;
      this.core.rotation.y += deltaTime * 3;
    }
    
    return true;
  }
  
  /**
   * Apply weapon upgrade effect
   * @param {Object} player - The player
   * @returns {Object} Effect data
   */
  collect(player) {
    const effect = super.collect(player);
    
    if (effect) {
      // Add upgrade type to effect data
      effect.upgradeType = this.upgradeType;
      effect.targetWeaponId = this.targetWeaponId;
      
      // Convert value to modifier format if needed
      if (this.upgradeType === 'damage' || this.upgradeType === 'rate' || this.upgradeType === 'range') {
        effect.modifier = 1 + (this.value / 100); // Convert percentage to multiplier
      }
    }
    
    return effect;
  }
  
  /**
   * Play specialized collection effect
   */
  playCollectionEffect() {
    super.playCollectionEffect();
    
    // Add upgrade-specific collection effect
    if (!this.scene || !this.meshGroup) return;
    
    const position = this.meshGroup.position.clone();
    
    // Create specialized particles emanating from center
    const particleCount = 15;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Create particle with elongated shape
      const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      // Random direction outward
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        height,
        Math.sin(angle)
      ).normalize();
      
      // Orient particle along its direction
      particle.lookAt(position.clone().add(direction));
      
      // Random speed
      const speed = 5 + Math.random() * 5;
      const velocity = direction.multiplyScalar(speed);
      
      particle.userData = {
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.5,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 5,
          Math.random() * 5,
          Math.random() * 5
        )
      };
      
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Create floating text based on upgrade type
    let upgradeText = '';
    switch (this.upgradeType) {
      case 'level':
        upgradeText = 'Weapon Level +1';
        break;
      case 'damage':
        upgradeText = `Damage +${this.value}%`;
        break;
      case 'rate':
        upgradeText = `Fire Rate +${this.value}%`;
        break;
      case 'range':
        upgradeText = `Range +${this.value}%`;
        break;
      default:
        upgradeText = 'Weapon Upgraded!';
    }
    
    if (this.scene.createFloatingText) {
      this.scene.createFloatingText({
        position: position.clone().add(new THREE.Vector3(0, 1, 0)),
        text: upgradeText,
        color: this.color,
        fontSize: 0.8,
        duration: 2
      });
    }
    
    // Update particles
    const updateParticles = (deltaTime) => {
      // Update existing particles
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
        
        // Update rotation
        particle.rotation.x += data.rotationSpeed.x * deltaTime;
        particle.rotation.y += data.rotationSpeed.y * deltaTime;
        particle.rotation.z += data.rotationSpeed.z * deltaTime;
        
        // Fade out
        const lifeRatio = 1 - (data.lifetime / data.maxLifetime);
        particle.material.opacity = 0.7 * lifeRatio;
        
        // Slow down
        data.velocity.multiplyScalar(0.95);
      }
      
      // Continue until all particles are gone
      return particles.length > 0;
    };
    
    // Add to scene update system
    if (this.scene.addUpdateCallback) {
      this.scene.addUpdateCallback(updateParticles);
    }
  }
}

export default WeaponUpgradePowerUp;