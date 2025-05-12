import * as THREE from 'three';
import BaseWeapon from './BaseWeapon';

/**
 * LaserWeapon class - Basic energy weapon that fires laser beams
 * Fast firing rate, moderate damage, high accuracy
 */
class LaserWeapon extends BaseWeapon {
  /**
   * Create a new laser weapon
   * @param {Object} config - Weapon configuration options
   */
  constructor(config = {}) {
    // Set laser-specific defaults before calling parent constructor
    const laserConfig = {
      id: 'laser_basic',
      name: 'Basic Laser',
      category: 'energy',
      damage: 15,
      fireRate: 5, // 5 shots per second
      range: 70,
      energyCost: 2,
      accuracy: 0.98,
      color: 0xff3333, // Red color for basic laser
      description: 'Standard rapid-fire energy weapon with good accuracy and range.',
      projectileSpeed: 80,
      ...config // Override defaults with provided config
    };
    
    // Evolution paths for laser weapons
    laserConfig.evolutionPaths = [
      {
        id: 'twin_laser',
        name: 'Twin Laser',
        requiredLevel: 2,
        description: 'Fires two beams in parallel, increasing damage output.'
      },
      {
        id: 'focused_laser',
        name: 'Focused Laser',
        requiredLevel: 2,
        description: 'Concentrates beam energy for higher damage but slower rate of fire.'
      }
    ];
    
    // Potential synergies with other weapons
    laserConfig.synergies = [
      {
        weaponType: 'plasma_cannon',
        name: 'Plasma Overload',
        description: 'Laser hits on enemies make them take 50% more damage from plasma weapons for 3 seconds.'
      },
      {
        category: 'ballistic',
        name: 'Thermal Weakening',
        description: 'Laser hits create weak points that ballistic weapons can exploit for 25% increased critical chance.'
      }
    ];
    
    // Call parent constructor with laser configuration
    super(laserConfig);
  }
  
  /**
   * Create the visual mesh for this weapon
   * @returns {THREE.Object3D} The weapon mesh
   */
  createWeaponMesh() {
    // Create a simple mesh for the laser weapon
    const geometry = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 8);
    geometry.rotateX(Math.PI / 2); // Rotate to point forward
    
    const material = new THREE.MeshPhongMaterial({
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      shininess: 100
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add a point light to make it glow
    const light = new THREE.PointLight(this.color, 0.5, 2);
    light.position.set(0, 0, -0.5);
    mesh.add(light);
    
    return mesh;
  }
  
  /**
   * Create laser projectiles
   * @returns {Array} Array of projectile objects
   */
  createProjectiles() {
    if (!this.parentObject) return [];
    
    const projectiles = [];
    
    // Create a projectile from each mount point
    this.mountPoints.forEach(mountPoint => {
      // Get world position and direction of the mount point
      const position = new THREE.Vector3();
      mountPoint.getWorldPosition(position);
      
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(mountPoint.getWorldQuaternion(new THREE.Quaternion()));
      
      // Add some randomness based on accuracy
      if (this.accuracy < 1) {
        const spread = (1 - this.accuracy) * 0.1;
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
      }
      
      // Create laser beam geometry
      const geometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
      geometry.rotateX(Math.PI / 2); // Align with forward direction
      
      // Create material with glow effect
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      // Add to scene
      if (this.parentObject.scene) {
        this.parentObject.scene.add(mesh);
      }
      
      // Create laser light
      const light = new THREE.PointLight(this.color, 1, 5);
      light.position.copy(position);
      if (this.parentObject.scene) {
        this.parentObject.scene.add(light);
      }
      
      // Create projectile object with physics properties
      const projectile = {
        mesh: mesh,
        light: light,
        position: position.clone(),
        velocity: direction.clone().multiplyScalar(this.projectileSpeed),
        damage: this.damage,
        lifetime: 0,
        maxLifetime: this.range / this.projectileSpeed, // Time to reach max range
        fromPlayer: this.parentObject.isPlayer === true, // Determine if from player
        
        // Update method will be called by projectile manager
        update: function(deltaTime) {
          // Update position
          this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
          
          // Update mesh and light
          this.mesh.position.copy(this.position);
          this.light.position.copy(this.position);
          
          // Update lifetime
          this.lifetime += deltaTime;
          
          // Fade out as it reaches max lifetime
          const remainingLifeRatio = 1 - (this.lifetime / this.maxLifetime);
          this.mesh.material.opacity = 0.7 * remainingLifeRatio;
          this.light.intensity = remainingLifeRatio;
          
          // Return true if projectile is still active, false if it should be destroyed
          return this.lifetime < this.maxLifetime;
        },
        
        // Destroy method will be called when projectile hits something or expires
        destroy: function() {
          if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
          }
          if (this.light.parent) {
            this.light.parent.remove(this.light);
          }
        }
      };
      
      projectiles.push(projectile);
    });
    
    return projectiles;
  }
  
  /**
   * Apply visual/audio effects when firing
   */
  applyFiringEffects() {
    // Add muzzle flash effect to each mount point
    this.mountPoints.forEach(mountPoint => {
      // Make the weapon glow briefly
      this.mountedMeshes.forEach(mesh => {
        if (mesh.material) {
          const originalEmissive = mesh.material.emissive.clone();
          mesh.material.emissive.set(this.color);
          
          // Reset after a short time
          setTimeout(() => {
            if (mesh.material) {
              mesh.material.emissive.copy(originalEmissive);
            }
          }, 50);
        }
      });
      
      // Add small screen shake effect
      if (this.parentObject.cameraShake) {
        this.parentObject.cameraShake(0.1);
      }
    });
  }
  
  /**
   * Upgrade the weapon to the next level
   * @returns {boolean} Success of upgrade
   */
  upgrade() {
    if (super.upgrade()) {
      // Apply laser-specific upgrades
      switch (this.level) {
        case 2:
          this.fireRate *= 1.2; // Faster firing at level 2
          this.cooldownTime = 1 / this.fireRate;
          break;
        case 3:
          this.damage *= 1.3; // More damage at level 3
          break;
        case 4:
          this.accuracy = Math.min(1, this.accuracy + 0.05); // Better accuracy at level 4
          break;
        case 5:
          this.damage *= 1.4; // Significant damage boost at max level
          this.fireRate *= 1.2; // Better fire rate at max level
          this.cooldownTime = 1 / this.fireRate;
          this.color = 0xff0066; // Visual upgrade at max level - more intense color
          break;
      }
      return true;
    }
    return false;
  }
}

export default LaserWeapon;