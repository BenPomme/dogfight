import * as THREE from 'three';
import BaseWeapon from './BaseWeapon';

/**
 * MachineGun class - Basic ballistic weapon that fires rapid bullets
 * Very fast firing rate, lower damage per shot, moderate accuracy
 */
class MachineGun extends BaseWeapon {
  /**
   * Create a new machine gun weapon
   * @param {Object} config - Weapon configuration options
   */
  constructor(config = {}) {
    // Set machine gun specific defaults
    const machineGunConfig = {
      id: 'machine_gun_basic',
      name: 'Machine Gun',
      category: 'ballistic',
      damage: 8,
      fireRate: 10, // 10 shots per second
      range: 50,
      energyCost: 1,
      accuracy: 0.85, // Less accurate than energy weapons
      color: 0xcccccc, // Silver/metallic color
      ammo: 400, // Limited ammo for ballistic weapons
      description: 'Rapid-fire ballistic weapon that deals consistent damage at moderate range.',
      projectileSpeed: 90,
      ...config // Override defaults with provided config
    };
    
    // Evolution paths for machine guns
    machineGunConfig.evolutionPaths = [
      {
        id: 'heavy_machine_gun',
        name: 'Heavy Machine Gun',
        requiredLevel: 2,
        description: 'Larger caliber rounds for higher damage but slower fire rate.'
      },
      {
        id: 'gatling_gun',
        name: 'Gatling Gun',
        requiredLevel: 2,
        description: 'Multiple rotating barrels for extreme fire rate with lower accuracy.'
      }
    ];
    
    // Potential synergies with other weapons
    machineGunConfig.synergies = [
      {
        weaponType: 'laser_basic',
        name: 'Heat Seeker',
        description: 'Machine gun rounds home in on targets that have been hit by lasers within the last 2 seconds.'
      },
      {
        category: 'explosive',
        name: 'Explosive Rounds',
        description: 'Machine gun rounds have a 15% chance to explode on impact, dealing area damage.'
      }
    ];
    
    // Call parent constructor with machine gun configuration
    super(machineGunConfig);
    
    // Machine gun specific properties
    this.shellEjectionRate = 3; // Eject one shell casing for every X shots
    this.shotsUntilEjection = this.shellEjectionRate;
    this.muzzleFlashIntensity = 1.5;
  }
  
  /**
   * Create the visual mesh for this weapon
   * @returns {THREE.Object3D} The weapon mesh
   */
  createWeaponMesh() {
    // Create weapon group
    const weaponGroup = new THREE.Group();
    
    // Main barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    barrelGeometry.rotateZ(Math.PI / 2); // Rotate to align with X axis
    const barrelMaterial = new THREE.MeshPhongMaterial({
      color: this.color,
      shininess: 100
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 0, -0.5);
    weaponGroup.add(barrel);
    
    // Add housing/body
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.7);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    weaponGroup.add(body);
    
    // Muzzle flash light (initially off)
    const muzzleFlash = new THREE.PointLight(0xffdd66, 0, 2);
    muzzleFlash.position.set(0, 0, -1.5);
    muzzleFlash.visible = false;
    weaponGroup.add(muzzleFlash);
    this.muzzleFlash = muzzleFlash;
    
    return weaponGroup;
  }
  
  /**
   * Create bullets/projectiles
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
        const spread = (1 - this.accuracy) * 0.2; // More spread than energy weapons
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
      }
      
      // Create bullet geometry - smaller than laser beams
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      
      // Create material with metallic look
      const material = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        emissive: 0x333333,
        shininess: 100
      });
      
      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.scale.z = 2; // Elongate the bullet slightly
      
      // Add trail effect
      const trailGeometry = new THREE.CylinderGeometry(0.01, 0.03, 0.5, 8);
      trailGeometry.rotateX(Math.PI / 2);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.5
      });
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.z = 0.3; // Position trail behind bullet
      mesh.add(trail);
      
      // Add to scene
      if (this.parentObject.scene) {
        this.parentObject.scene.add(mesh);
      }
      
      // Create projectile object with physics properties
      const projectile = {
        mesh: mesh,
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
          
          // Update mesh
          this.mesh.position.copy(this.position);
          
          // Set orientation to match velocity
          if (this.velocity.lengthSq() > 0) {
            this.mesh.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 0, 1),
              this.velocity.clone().normalize()
            );
          }
          
          // Update lifetime
          this.lifetime += deltaTime;
          
          // Fade out the trail as it reaches max lifetime
          if (this.mesh.children.length > 0) {
            const trail = this.mesh.children[0];
            const remainingLifeRatio = 1 - (this.lifetime / this.maxLifetime);
            trail.material.opacity = 0.5 * remainingLifeRatio;
          }
          
          // Return true if projectile is still active, false if it should be destroyed
          return this.lifetime < this.maxLifetime;
        },
        
        // Destroy method will be called when projectile hits something or expires
        destroy: function() {
          if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
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
    this.mountedMeshes.forEach(weaponGroup => {
      // Find the muzzle flash light in the weapon group
      const muzzleFlash = weaponGroup.children.find(child => child instanceof THREE.PointLight);
      
      if (muzzleFlash) {
        // Make the muzzle flash visible and set intensity
        muzzleFlash.visible = true;
        muzzleFlash.intensity = this.muzzleFlashIntensity * (0.8 + Math.random() * 0.4);
        
        // Reset after a short time
        setTimeout(() => {
          if (muzzleFlash) {
            muzzleFlash.visible = false;
            muzzleFlash.intensity = 0;
          }
        }, 50);
      }
      
      // Create shell ejection effect
      this.shotsUntilEjection--;
      if (this.shotsUntilEjection <= 0) {
        this.ejectShell(weaponGroup);
        this.shotsUntilEjection = this.shellEjectionRate;
      }
    });
    
    // Add small screen shake effect
    if (this.parentObject.cameraShake) {
      this.parentObject.cameraShake(0.05);
    }
  }
  
  /**
   * Eject a shell casing for visual effect
   * @param {THREE.Object3D} weaponGroup - The weapon mesh group
   */
  ejectShell(weaponGroup) {
    if (!this.parentObject || !this.parentObject.scene) return;
    
    // Get weapon position in world space
    const position = new THREE.Vector3();
    weaponGroup.getWorldPosition(position);
    
    // Offset position for shell ejection
    position.y += 0.1;
    position.x += 0.2;
    
    // Create shell casing
    const shellGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6);
    const shellMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00, // Brass color
      shininess: 100
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.position.copy(position);
    
    // Add to scene
    this.parentObject.scene.add(shell);
    
    // Set initial velocity and rotation
    const velocity = new THREE.Vector3(
      0.5 + Math.random() * 1.5, // Right side ejection
      1 + Math.random() * 1.5,   // Upward
      (Math.random() - 0.5) * 0.5 // Slight random Z
    );
    
    const rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
    
    // Create a lifetime for the shell
    const lifetime = 1 + Math.random();
    let age = 0;
    
    // Simple physics update for the shell
    const updateShell = (deltaTime) => {
      // Apply gravity
      velocity.y -= 9.8 * deltaTime;
      
      // Update position
      shell.position.x += velocity.x * deltaTime;
      shell.position.y += velocity.y * deltaTime;
      shell.position.z += velocity.z * deltaTime;
      
      // Update rotation
      shell.rotation.x += rotationSpeed.x * deltaTime;
      shell.rotation.y += rotationSpeed.y * deltaTime;
      shell.rotation.z += rotationSpeed.z * deltaTime;
      
      // Update age
      age += deltaTime;
      
      // Remove if too old or below scene
      if (age >= lifetime || shell.position.y < -10) {
        this.parentObject.scene.remove(shell);
        return false;
      }
      
      return true;
    };
    
    // Add the update function to a list that gets called each frame
    if (this.parentObject.addPhysicsObject) {
      this.parentObject.addPhysicsObject(updateShell);
    }
  }
  
  /**
   * Upgrade the weapon to the next level
   * @returns {boolean} Success of upgrade
   */
  upgrade() {
    if (super.upgrade()) {
      // Apply machine gun specific upgrades
      switch (this.level) {
        case 2:
          this.fireRate *= 1.3; // Faster firing at level 2
          this.cooldownTime = 1 / this.fireRate;
          break;
        case 3:
          this.damage *= 1.2; // More damage at level 3
          this.ammo += 200; // More ammo
          this.currentAmmo = this.ammo;
          break;
        case 4:
          this.accuracy = Math.min(0.95, this.accuracy + 0.08); // Better accuracy at level 4
          this.fireRate *= 1.2;
          this.cooldownTime = 1 / this.fireRate;
          break;
        case 5:
          this.damage *= 1.3; // Significant damage boost at max level
          this.ammo += 300; // Much more ammo
          this.currentAmmo = this.ammo;
          this.muzzleFlashIntensity = 2.0; // More intense muzzle flash
          break;
      }
      return true;
    }
    return false;
  }
}

export default MachineGun;