import * as THREE from 'three';
import BasePowerUp from './BasePowerUp';

/**
 * HealthPowerUp - Restores player's health
 */
class HealthPowerUp extends BasePowerUp {
  /**
   * Create a new health power-up
   * @param {Object} config - Power-up configuration
   */
  constructor(config = {}) {
    // Set health-specific defaults
    const healthConfig = {
      type: 'health',
      name: 'Health Boost',
      description: 'Restores hull integrity',
      color: 0xff3333, // Red color
      value: config.value || 25, // Health points to restore
      duration: 0, // Instant effect
      isPermanent: false,
      ...config
    };
    
    // Call parent constructor
    super(healthConfig);
  }
  
  /**
   * Create mesh specific to health power-up
   */
  createMesh() {
    // Create a base group
    this.meshGroup = new THREE.Group();
    
    // Create a heart-like shape for health
    const heartShape = new THREE.Shape();
    
    // Draw half of the heart
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.5, -1, -0.5, -1, 0.5);
    heartShape.bezierCurveTo(-1, 1.5, 0, 1.5, 0, 2.5);
    
    // Mirror to complete the heart
    heartShape.bezierCurveTo(0, 1.5, 1, 1.5, 1, 0.5);
    heartShape.bezierCurveTo(1, -0.5, 0, -0.5, 0, 0);
    
    // Create geometry from shape
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    });
    
    // Scale to appropriate size
    heartGeometry.scale(0.7, 0.7, 0.7);
    
    // Center the geometry
    heartGeometry.computeBoundingBox();
    const center = heartGeometry.boundingBox.getCenter(new THREE.Vector3());
    heartGeometry.translate(-center.x, -center.y, -center.z);
    
    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    // Create mesh
    this.mesh = new THREE.Mesh(heartGeometry, material);
    this.meshGroup.add(this.mesh);
    
    // Add glow effect
    const glowLight = new THREE.PointLight(this.color, this.glowIntensity, 10);
    this.meshGroup.add(glowLight);
    this.glowLight = glowLight;
    
    // Add cross symbol inside (medical cross)
    const crossGroup = new THREE.Group();
    
    // Horizontal bar
    const horizontalGeo = new THREE.BoxGeometry(1.2, 0.3, 0.3);
    const horizontalBar = new THREE.Mesh(horizontalGeo, new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffaaaa,
      shininess: 100
    }));
    crossGroup.add(horizontalBar);
    
    // Vertical bar
    const verticalGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    const verticalBar = new THREE.Mesh(verticalGeo, new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffaaaa,
      shininess: 100
    }));
    crossGroup.add(verticalBar);
    
    // Position cross slightly in front of heart
    crossGroup.position.z = 0.4;
    
    this.meshGroup.add(crossGroup);
    this.crossGroup = crossGroup;
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
    
    // Add health-specific animation
    if (this.crossGroup) {
      this.crossGroup.rotation.z += 0.5 * deltaTime;
    }
    
    return true;
  }
  
  /**
   * Apply health restoration effect
   * @param {Object} player - The player
   * @returns {Object} Effect data
   */
  collect(player) {
    const effect = super.collect(player);
    
    // Additional health-specific collection logic
    if (player && player.health !== undefined) {
      // Calculate how much health to actually restore
      const missingHealth = player.maxHealth - player.health;
      const healthRestored = Math.min(missingHealth, this.value);
      
      // Update effect value to actual amount restored
      if (effect) {
        effect.actualValue = healthRestored;
      }
    }
    
    return effect;
  }
  
  /**
   * Play specialized collection effect for health
   */
  playCollectionEffect() {
    super.playCollectionEffect();
    
    // Add health-specific collection effect
    if (!this.scene || !this.meshGroup) return;
    
    const position = this.meshGroup.position.clone();
    
    // Create floating health text
    if (this.scene.createFloatingText) {
      this.scene.createFloatingText({
        position: position,
        text: `+${this.value} HP`,
        color: this.color,
        fontSize: 1,
        duration: 1.5
      });
    }
  }
}

export default HealthPowerUp;