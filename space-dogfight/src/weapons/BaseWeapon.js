/**
 * BaseWeapon class - Foundation for all weapon types
 * This class provides the core functionality that all weapons share
 */
class BaseWeapon {
  /**
   * Create a new weapon
   * @param {Object} config - Weapon configuration options
   * @param {string} config.id - Unique identifier for this weapon
   * @param {string} config.name - Display name for the weapon
   * @param {string} config.category - Weapon category (ballistic, energy, explosive, special)
   * @param {number} config.level - Current upgrade level of the weapon
   * @param {number} config.damage - Base damage per projectile
   * @param {number} config.fireRate - Shots per second
   * @param {number} config.range - Maximum effective range
   * @param {number} config.energyCost - Energy cost per shot
   * @param {string} config.description - Weapon description text
   * @param {Object} config.projectileConfig - Configuration for projectiles
   * @param {THREE.Object3D} config.parentObject - The parent object (ship) to attach to
   * @param {Array} config.mountPoints - Array of mount point positions
   */
  constructor(config) {
    // Required parameters
    this.id = config.id;
    this.name = config.name;
    this.category = config.category || 'energy'; // Default category
    this.level = config.level || 1;
    
    // Weapon stats
    this.damage = config.damage || 10;
    this.fireRate = config.fireRate || 1; // Shots per second
    this.cooldown = 0; // Current cooldown time
    this.cooldownTime = 1 / this.fireRate; // Time between shots in seconds
    this.range = config.range || 50;
    this.energyCost = config.energyCost || 1;
    this.accuracy = config.accuracy || 0.95; // 0-1, higher is more accurate
    
    // Upgrade and evolution tracking
    this.maxLevel = 5;
    this.evolutionPaths = config.evolutionPaths || [];
    this.synergies = config.synergies || [];
    
    // Visual and descriptive
    this.description = config.description || '';
    this.icon = config.icon || null;
    this.color = config.color || 0xff0000;
    
    // Projectile configuration
    this.projectileConfig = config.projectileConfig || {};
    this.projectileSpeed = config.projectileSpeed || 30;
    
    // Mounting and positioning
    this.parentObject = config.parentObject || null;
    this.mountPoints = config.mountPoints || [];
    this.mountedMeshes = [];
    
    // Effects and modifiers
    this.effects = config.effects || []; // Status effects the weapon can apply
    this.modifiers = config.modifiers || []; // Modifiers applied to the weapon
    
    // State tracking
    this.isActive = true;
    this.isFiring = false;
    this.ammo = config.ammo || Infinity;
    this.currentAmmo = this.ammo;
    this.isUnlimited = this.ammo === Infinity;
    
    // Initialize the weapon
    this.init();
  }
  
  /**
   * Initialize the weapon - setup meshes, etc.
   * Override in subclasses for specific initialization
   */
  init() {
    // Base initialization logic
    this.createWeaponMesh();
  }
  
  /**
   * Create the visual mesh for this weapon
   * Override in subclasses for specific weapon models
   */
  createWeaponMesh() {
    // Base implementation does nothing
    // Specific weapon types will override this
  }
  
  /**
   * Attach weapon to mount points on parent object
   */
  attachToParent() {
    if (!this.parentObject) return;
    
    // Clear any existing mounted meshes
    this.detachFromParent();
    
    // Create and attach new meshes at each mount point
    this.mountPoints.forEach(mountPoint => {
      const weaponMesh = this.createWeaponMesh();
      if (weaponMesh) {
        mountPoint.add(weaponMesh);
        this.mountedMeshes.push(weaponMesh);
      }
    });
  }
  
  /**
   * Detach weapon from parent object
   */
  detachFromParent() {
    this.mountedMeshes.forEach(mesh => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    this.mountedMeshes = [];
  }
  
  /**
   * Update weapon state
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update cooldown
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime;
    }
    
    // Auto-firing logic if weapon is set to continuously fire
    if (this.isFiring && this.cooldown <= 0) {
      this.fire();
    }
  }
  
  /**
   * Start firing the weapon
   */
  startFiring() {
    this.isFiring = true;
    if (this.cooldown <= 0) {
      this.fire();
    }
  }
  
  /**
   * Stop firing the weapon
   */
  stopFiring() {
    this.isFiring = false;
  }
  
  /**
   * Fire the weapon - create projectiles, etc.
   * @returns {Array} Projectiles created by this firing
   */
  fire() {
    // Can't fire if on cooldown or out of ammo
    if (this.cooldown > 0 || (!this.isUnlimited && this.currentAmmo <= 0)) {
      return [];
    }
    
    // Set cooldown
    this.cooldown = this.cooldownTime;
    
    // Use ammo
    if (!this.isUnlimited) {
      this.currentAmmo--;
    }
    
    // Create projectiles
    const projectiles = this.createProjectiles();
    
    // Apply weapon firing effects
    this.applyFiringEffects();
    
    return projectiles;
  }
  
  /**
   * Create projectiles - override in subclasses
   * @returns {Array} Array of projectile objects
   */
  createProjectiles() {
    // Base implementation does nothing
    // Specific weapon types will override this
    return [];
  }
  
  /**
   * Apply visual/audio effects when firing
   */
  applyFiringEffects() {
    // Base effects like muzzle flash or sound
    // Specific weapon types can override or extend this
  }
  
  /**
   * Reload the weapon
   */
  reload() {
    this.currentAmmo = this.ammo;
  }
  
  /**
   * Apply a modifier to the weapon
   * @param {Object} modifier - Modifier to apply
   */
  applyModifier(modifier) {
    this.modifiers.push(modifier);
    
    // Apply stat changes
    if (modifier.damage) this.damage *= modifier.damage;
    if (modifier.fireRate) this.fireRate *= modifier.fireRate;
    if (modifier.range) this.range *= modifier.range;
    if (modifier.energyCost) this.energyCost *= modifier.energyCost;
    if (modifier.accuracy) this.accuracy *= modifier.accuracy;
    
    // Recalculate cooldown time
    this.cooldownTime = 1 / this.fireRate;
  }
  
  /**
   * Remove a modifier from the weapon
   * @param {string} modifierId - ID of modifier to remove
   */
  removeModifier(modifierId) {
    const index = this.modifiers.findIndex(mod => mod.id === modifierId);
    if (index !== -1) {
      const modifier = this.modifiers[index];
      this.modifiers.splice(index, 1);
      
      // Revert stat changes
      if (modifier.damage) this.damage /= modifier.damage;
      if (modifier.fireRate) this.fireRate /= modifier.fireRate;
      if (modifier.range) this.range /= modifier.range;
      if (modifier.energyCost) this.energyCost /= modifier.energyCost;
      if (modifier.accuracy) this.accuracy /= modifier.accuracy;
      
      // Recalculate cooldown time
      this.cooldownTime = 1 / this.fireRate;
    }
  }
  
  /**
   * Upgrade the weapon to the next level
   * @returns {boolean} Success of upgrade
   */
  upgrade() {
    if (this.level < this.maxLevel) {
      this.level++;
      
      // Apply stat improvements
      this.damage *= 1.2;
      this.fireRate *= 1.1;
      
      return true;
    }
    return false;
  }
  
  /**
   * Evolve this weapon into a more advanced version
   * @param {string} evolutionId - ID of the evolution path to take
   * @returns {BaseWeapon|null} The new evolved weapon or null if evolution failed
   */
  evolve(evolutionId) {
    // Find the requested evolution path
    const evolutionPath = this.evolutionPaths.find(path => path.id === evolutionId);
    
    if (!evolutionPath || this.level < evolutionPath.requiredLevel) {
      return null;
    }
    
    // Create the evolved weapon
    // This would typically be implemented in a WeaponFactory or similar
    return null;
  }
  
  /**
   * Check if this weapon can synergize with another
   * @param {BaseWeapon} otherWeapon - The weapon to check synergy with
   * @returns {Object|null} Synergy information or null if no synergy
   */
  checkSynergy(otherWeapon) {
    for (const synergy of this.synergies) {
      if (
        (synergy.weaponType === otherWeapon.id) || 
        (synergy.category === otherWeapon.category)
      ) {
        return synergy;
      }
    }
    return null;
  }
  
  /**
   * Get a description of the weapon including stats
   * @returns {string} Weapon description
   */
  getDescription() {
    return `
      ${this.name} (Level ${this.level})
      Category: ${this.category}
      Damage: ${this.damage.toFixed(1)}
      Fire Rate: ${this.fireRate.toFixed(1)} shots/sec
      Range: ${this.range.toFixed(1)}
      ${this.description}
    `;
  }
  
  /**
   * Dispose of this weapon - clean up resources
   */
  dispose() {
    this.detachFromParent();
    this.isActive = false;
  }
}

export default BaseWeapon;