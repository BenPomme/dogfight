import LaserWeapon from './LaserWeapon';
import MachineGun from './MachineGun';

/**
 * WeaponManager class - Handles all weapon-related functionality
 * Manages creation, upgrades, evolutions, and synergies
 */
class WeaponManager {
  /**
   * Create a new WeaponManager
   * @param {Object} config - Configuration options
   * @param {Object} config.scene - The THREE.js scene
   * @param {Object} config.projectileManager - Manager for creating and updating projectiles
   */
  constructor(config = {}) {
    this.scene = config.scene || null;
    this.projectileManager = config.projectileManager || null;
    
    // Maintain a registry of all available weapon types
    this.weaponTypes = {
      'laser_basic': LaserWeapon,
      'machine_gun_basic': MachineGun,
      // Additional weapon types will be added here
    };
    
    // Track all active weapons
    this.activeWeapons = [];
    
    // Track all available upgrades
    this.availableUpgrades = [];
    
    // Track detected synergies
    this.activeSynergies = [];
  }
  
  /**
   * Create a new weapon of the specified type
   * @param {string} weaponType - Type of weapon to create
   * @param {Object} config - Configuration for the weapon
   * @returns {BaseWeapon} The created weapon
   */
  createWeapon(weaponType, config = {}) {
    // Get the weapon class
    const WeaponClass = this.weaponTypes[weaponType];
    
    if (!WeaponClass) {
      console.error(`Unknown weapon type: ${weaponType}`);
      return null;
    }
    
    // Create the weapon
    const weapon = new WeaponClass(config);
    
    // Add to active weapons
    this.activeWeapons.push(weapon);
    
    return weapon;
  }
  
  /**
   * Attach all active weapons to a parent object (usually a ship)
   * @param {Object} parentObject - The object to attach weapons to
   * @param {Array} mountPoints - Array of mount points on the parent object
   */
  attachWeaponsToParent(parentObject, mountPoints) {
    if (!parentObject || !mountPoints || mountPoints.length === 0) {
      return;
    }
    
    // Set the scene reference on the parent for projectile creation
    parentObject.scene = this.scene;
    
    // Distribute mount points among active weapons
    // For simplicity, we'll just assign each weapon to all mount points for now
    // In a more advanced system, you could distribute specific mount points to specific weapons
    this.activeWeapons.forEach(weapon => {
      weapon.parentObject = parentObject;
      weapon.mountPoints = mountPoints;
      weapon.attachToParent();
    });
  }
  
  /**
   * Update all active weapons
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Update each active weapon
    this.activeWeapons.forEach(weapon => {
      weapon.update(deltaTime);
    });
    
    // Update active synergies
    this.updateSynergies(deltaTime);
  }
  
  /**
   * Begin firing all weapons or a specific weapon
   * @param {string} [weaponId] - Optional ID of weapon to fire, if null fires all
   */
  startFiring(weaponId = null) {
    this.activeWeapons.forEach(weapon => {
      if (!weaponId || weapon.id === weaponId) {
        weapon.startFiring();
      }
    });
  }
  
  /**
   * Stop firing all weapons or a specific weapon
   * @param {string} [weaponId] - Optional ID of weapon to stop, if null stops all
   */
  stopFiring(weaponId = null) {
    this.activeWeapons.forEach(weapon => {
      if (!weaponId || weapon.id === weaponId) {
        weapon.stopFiring();
      }
    });
  }
  
  /**
   * Fire all weapons once (single shot)
   * @param {string} [weaponId] - Optional ID of weapon to fire, if null fires all
   * @returns {Array} All projectiles created by this firing
   */
  fireOnce(weaponId = null) {
    let projectiles = [];
    
    this.activeWeapons.forEach(weapon => {
      if (!weaponId || weapon.id === weaponId) {
        const weaponProjectiles = weapon.fire();
        if (weaponProjectiles.length > 0) {
          projectiles = projectiles.concat(weaponProjectiles);
          
          // If we have a projectile manager, register the projectiles with it
          if (this.projectileManager) {
            this.projectileManager.addProjectiles(weaponProjectiles);
          }
        }
      }
    });
    
    return projectiles;
  }
  
  /**
   * Get all active weapons
   * @returns {Array} Array of active weapons
   */
  getActiveWeapons() {
    return this.activeWeapons;
  }
  
  /**
   * Get a specific weapon by ID
   * @param {string} weaponId - ID of the weapon to find
   * @returns {BaseWeapon|null} The weapon or null if not found
   */
  getWeaponById(weaponId) {
    return this.activeWeapons.find(weapon => weapon.id === weaponId) || null;
  }
  
  /**
   * Get all weapons of a specific category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of weapons in the category
   */
  getWeaponsByCategory(category) {
    return this.activeWeapons.filter(weapon => weapon.category === category);
  }
  
  /**
   * Upgrade a specific weapon
   * @param {string} weaponId - ID of the weapon to upgrade
   * @returns {boolean} Success of the upgrade
   */
  upgradeWeapon(weaponId) {
    const weapon = this.getWeaponById(weaponId);
    if (weapon) {
      const success = weapon.upgrade();
      if (success) {
        // After upgrading, check for new synergies
        this.detectSynergies();
        return true;
      }
    }
    return false;
  }
  
  /**
   * Evolve a weapon along a specific path
   * @param {string} weaponId - ID of the weapon to evolve
   * @param {string} evolutionId - ID of the evolution path
   * @returns {BaseWeapon|null} The evolved weapon or null if evolution failed
   */
  evolveWeapon(weaponId, evolutionId) {
    const weapon = this.getWeaponById(weaponId);
    if (!weapon) return null;
    
    // Get the evolved weapon
    const evolvedWeapon = weapon.evolve(evolutionId);
    if (!evolvedWeapon) return null;
    
    // Replace the old weapon with the evolved one
    const index = this.activeWeapons.indexOf(weapon);
    if (index !== -1) {
      // Remove the old weapon
      weapon.dispose();
      this.activeWeapons.splice(index, 1);
      
      // Add the new evolved weapon
      this.activeWeapons.push(evolvedWeapon);
      
      // Re-attach to parent if applicable
      if (weapon.parentObject && weapon.mountPoints) {
        evolvedWeapon.parentObject = weapon.parentObject;
        evolvedWeapon.mountPoints = weapon.mountPoints;
        evolvedWeapon.attachToParent();
      }
      
      // Check for new synergies after evolution
      this.detectSynergies();
      
      return evolvedWeapon;
    }
    
    return null;
  }
  
  /**
   * Apply a modifier to a specific weapon
   * @param {string} weaponId - ID of the weapon to modify
   * @param {Object} modifier - Modifier to apply
   */
  applyModifier(weaponId, modifier) {
    const weapon = this.getWeaponById(weaponId);
    if (weapon) {
      weapon.applyModifier(modifier);
      // Check for new synergies after modification
      this.detectSynergies();
    }
  }
  
  /**
   * Detect potential synergies between active weapons
   */
  detectSynergies() {
    // Clear existing synergies
    this.activeSynergies = [];
    
    // Check all weapon pairs for synergies
    for (let i = 0; i < this.activeWeapons.length; i++) {
      for (let j = i + 1; j < this.activeWeapons.length; j++) {
        const weaponA = this.activeWeapons[i];
        const weaponB = this.activeWeapons[j];
        
        // Check if weaponA synergizes with weaponB
        const synergyAB = weaponA.checkSynergy(weaponB);
        if (synergyAB) {
          this.activeSynergies.push({
            sourceWeapon: weaponA,
            targetWeapon: weaponB,
            synergy: synergyAB,
            active: true,
            timeRemaining: null // Permanent synergy
          });
        }
        
        // Check if weaponB synergizes with weaponA
        const synergyBA = weaponB.checkSynergy(weaponA);
        if (synergyBA) {
          this.activeSynergies.push({
            sourceWeapon: weaponB,
            targetWeapon: weaponA,
            synergy: synergyBA,
            active: true,
            timeRemaining: null // Permanent synergy
          });
        }
      }
    }
    
    return this.activeSynergies;
  }
  
  /**
   * Update active synergies
   * @param {number} deltaTime - Time since last update in seconds
   */
  updateSynergies(deltaTime) {
    // Update time-limited synergies
    for (let i = this.activeSynergies.length - 1; i >= 0; i--) {
      const synergy = this.activeSynergies[i];
      
      // Skip permanent synergies
      if (synergy.timeRemaining === null) continue;
      
      // Update time remaining
      synergy.timeRemaining -= deltaTime;
      
      // Remove expired synergies
      if (synergy.timeRemaining <= 0) {
        synergy.active = false;
        this.activeSynergies.splice(i, 1);
      }
    }
  }
  
  /**
   * Add a temporary synergy effect
   * @param {BaseWeapon} sourceWeapon - Weapon causing the synergy
   * @param {BaseWeapon} targetWeapon - Weapon receiving the synergy benefit
   * @param {Object} synergyEffect - Details of the synergy effect
   * @param {number} duration - How long the synergy lasts in seconds
   */
  addTemporarySynergy(sourceWeapon, targetWeapon, synergyEffect, duration) {
    this.activeSynergies.push({
      sourceWeapon,
      targetWeapon,
      synergy: synergyEffect,
      active: true,
      timeRemaining: duration
    });
  }
  
  /**
   * Get all active synergies
   * @returns {Array} Array of active synergies
   */
  getActiveSynergies() {
    return this.activeSynergies;
  }
  
  /**
   * Generate a list of available weapon upgrades
   * @returns {Array} Available upgrades
   */
  getAvailableUpgrades() {
    this.availableUpgrades = [];
    
    // Check for standard level upgrades
    this.activeWeapons.forEach(weapon => {
      if (weapon.level < weapon.maxLevel) {
        this.availableUpgrades.push({
          type: 'upgrade',
          weaponId: weapon.id,
          name: `Upgrade ${weapon.name} to Level ${weapon.level + 1}`,
          description: `Improve stats for ${weapon.name}`
        });
      }
    });
    
    // Check for available evolutions
    this.activeWeapons.forEach(weapon => {
      weapon.evolutionPaths.forEach(path => {
        if (weapon.level >= path.requiredLevel) {
          this.availableUpgrades.push({
            type: 'evolution',
            weaponId: weapon.id,
            evolutionId: path.id,
            name: `Evolve to ${path.name}`,
            description: path.description
          });
        }
      });
    });
    
    // Add new weapon options (always available)
    // In a full game, this would be gated by progression or requirements
    Object.keys(this.weaponTypes).forEach(weaponType => {
      // Skip weapons the player already has
      if (this.activeWeapons.some(w => w.id === weaponType)) return;
      
      // Create a temporary instance to get its name and description
      const tempWeapon = new this.weaponTypes[weaponType]();
      
      this.availableUpgrades.push({
        type: 'new_weapon',
        weaponType,
        name: `New Weapon: ${tempWeapon.name}`,
        description: tempWeapon.description
      });
      
      // Clean up the temporary weapon
      tempWeapon.dispose();
    });
    
    return this.availableUpgrades;
  }
  
  /**
   * Apply a selected upgrade
   * @param {Object} upgrade - The upgrade to apply
   * @returns {boolean} Success of the upgrade
   */
  applyUpgrade(upgrade) {
    switch (upgrade.type) {
      case 'upgrade':
        return this.upgradeWeapon(upgrade.weaponId);
        
      case 'evolution':
        return !!this.evolveWeapon(upgrade.weaponId, upgrade.evolutionId);
        
      case 'new_weapon':
        const newWeapon = this.createWeapon(upgrade.weaponType);
        return !!newWeapon;
        
      default:
        console.error(`Unknown upgrade type: ${upgrade.type}`);
        return false;
    }
  }
  
  /**
   * Dispose of all weapons and clean up resources
   */
  dispose() {
    this.activeWeapons.forEach(weapon => {
      weapon.dispose();
    });
    this.activeWeapons = [];
    this.activeSynergies = [];
  }
}

export default WeaponManager;