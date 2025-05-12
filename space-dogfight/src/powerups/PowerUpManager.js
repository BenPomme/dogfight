import * as THREE from 'three';
import BasePowerUp from './BasePowerUp';
import HealthPowerUp from './HealthPowerUp';
import WeaponUpgradePowerUp from './WeaponUpgradePowerUp';

/**
 * PowerUpManager - Handles spawning, updating, and managing all power-ups
 */
class PowerUpManager {
  /**
   * Create a new PowerUpManager
   * @param {Object} config - Manager configuration
   * @param {THREE.Scene} config.scene - Game scene
   * @param {Object} config.player - Player ship
   * @param {number} config.arenaRadius - Arena boundary radius
   */
  constructor(config = {}) {
    this.scene = config.scene || null;
    this.player = config.player || null;
    this.arenaRadius = config.arenaRadius || 150;
    
    // Track all active power-ups
    this.powerUps = [];
    
    // Register available power-up types
    this.powerUpTypes = {
      'health': HealthPowerUp,
      'weapon_upgrade': WeaponUpgradePowerUp,
      // Add more power-up types here as they're implemented
    };
    
    // Spawn control
    this.spawnTimer = 0;
    this.spawnRate = config.spawnRate || 15; // Seconds between natural spawns
    this.maxPowerUps = config.maxPowerUps || 5; // Maximum number of power-ups in the arena
    
    // Effect tracking
    this.activeEffects = [];
    
    // Callbacks
    this.onPowerUpCollected = null;
    this.onEffectExpired = null;
  }
  
  /**
   * Update all power-ups
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Skip if no scene or player
    if (!this.scene || !this.player) return;
    
    // Update spawn timer
    this.updateSpawnTimer(deltaTime);
    
    // Update existing power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      
      // Update power-up
      const isActive = powerUp.update(deltaTime);
      
      // Remove if no longer active
      if (!isActive) {
        this.powerUps.splice(i, 1);
        continue;
      }
      
      // Check for player collision
      if (this.checkPlayerCollision(powerUp)) {
        // Player collected the power-up
        this.collectPowerUp(powerUp);
        this.powerUps.splice(i, 1);
      }
    }
    
    // Update active effects
    this.updateActiveEffects(deltaTime);
  }
  
  /**
   * Update the spawn timer for natural power-up spawns
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateSpawnTimer(deltaTime) {
    // Skip if at max power-ups
    if (this.powerUps.length >= this.maxPowerUps) return;
    
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Check if it's time to spawn a power-up
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnTimer = 0;
      this.spawnRandomPowerUp();
    }
  }
  
  /**
   * Check if player has collided with a power-up
   * @param {BasePowerUp} powerUp - The power-up to check
   * @returns {boolean} Whether a collision occurred
   */
  checkPlayerCollision(powerUp) {
    // Skip if power-up was already collected
    if (!powerUp.isActive || powerUp.isCollected) return false;
    
    // Calculate distance between player and power-up
    const distance = this.player.position.distanceTo(powerUp.position);
    
    // Check if within collection radius
    const collectionRadius = this.player.radius + powerUp.radius;
    return distance < collectionRadius;
  }
  
  /**
   * Handle power-up collection
   * @param {BasePowerUp} powerUp - The power-up being collected
   */
  collectPowerUp(powerUp) {
    // Get effect data from power-up
    const effectData = powerUp.collect(this.player);
    
    if (!effectData) return;
    
    // Apply effect to player
    this.applyEffect(effectData);
    
    // Call collection callback
    if (this.onPowerUpCollected) {
      this.onPowerUpCollected(effectData);
    }
  }
  
  /**
   * Apply power-up effect to the player
   * @param {Object} effectData - Data describing the effect
   */
  applyEffect(effectData) {
    // Handle different effect types
    switch (effectData.type) {
      case 'health':
        // Directly increase player health
        if (this.player.health !== undefined) {
          this.player.health = Math.min(
            this.player.maxHealth,
            this.player.health + effectData.value
          );
        }
        break;
        
      case 'shield':
        // Restore shield
        if (this.player.shield !== undefined) {
          this.player.shield = Math.min(
            this.player.maxShield,
            this.player.shield + effectData.value
          );
        }
        break;
        
      case 'weapon_upgrade':
        // Handle weapon upgrades
        this.applyWeaponUpgrade(effectData);
        break;
        
      case 'speed_boost':
        // Increase player speed temporarily
        if (this.player.speed !== undefined) {
          // Store original speed if not already stored
          if (this.player.originalSpeed === undefined) {
            this.player.originalSpeed = this.player.speed;
          }
          
          // Apply speed boost
          this.player.speed = this.player.originalSpeed * (1 + effectData.value / 100);
          
          // Add to active effects if temporary
          if (effectData.duration > 0) {
            this.addActiveEffect({
              ...effectData,
              startTime: Date.now(),
              onExpire: () => {
                this.player.speed = this.player.originalSpeed;
              }
            });
          }
        }
        break;
        
      case 'damage_boost':
        // Increase player damage temporarily
        if (this.player.weaponManager) {
          // Add global damage modifier to all weapons
          const weapons = this.player.weaponManager.getActiveWeapons();
          
          weapons.forEach(weapon => {
            const modifier = {
              id: `damage_boost_${Date.now()}`,
              damage: 1 + (effectData.value / 100),
              description: `Damage Boost +${effectData.value}%`
            };
            
            weapon.applyModifier(modifier);
            
            // Track the modifier for removal later
            effectData.modifierId = modifier.id;
            effectData.affectedWeapons = weapons;
          });
          
          // Add to active effects if temporary
          if (effectData.duration > 0) {
            this.addActiveEffect({
              ...effectData,
              startTime: Date.now(),
              onExpire: () => {
                // Remove modifier from all affected weapons
                effectData.affectedWeapons.forEach(weapon => {
                  weapon.removeModifier(effectData.modifierId);
                });
              }
            });
          }
        }
        break;
    }
  }
  
  /**
   * Apply weapon upgrade effect
   * @param {Object} effectData - Weapon upgrade data
   */
  applyWeaponUpgrade(effectData) {
    if (!this.player.weaponManager) return;
    
    const weaponManager = this.player.weaponManager;
    let targetWeapons = [];
    
    // Determine which weapons to upgrade
    if (effectData.targetWeaponId) {
      // Upgrade specific weapon
      const weapon = weaponManager.getWeaponById(effectData.targetWeaponId);
      if (weapon) {
        targetWeapons = [weapon];
      }
    } else {
      // Upgrade all weapons
      targetWeapons = weaponManager.getActiveWeapons();
    }
    
    // Apply upgrades based on type
    switch (effectData.upgradeType) {
      case 'level':
        // Increase weapon level
        targetWeapons.forEach(weapon => {
          weaponManager.upgradeWeapon(weapon.id);
        });
        break;
        
      case 'damage':
      case 'rate':
      case 'range':
        // Apply stat modifier
        targetWeapons.forEach(weapon => {
          const modifier = {
            id: `${effectData.upgradeType}_boost_${Date.now()}`,
            description: `${effectData.upgradeType.charAt(0).toUpperCase() + effectData.upgradeType.slice(1)} Boost +${effectData.value}%`
          };
          
          // Set the appropriate modifier property
          modifier[effectData.upgradeType] = effectData.modifier;
          
          weapon.applyModifier(modifier);
          
          // If permanent (no duration), no need to track for removal
          if (effectData.duration <= 0) return;
          
          // Track modifiers for removal if temporary
          if (!effectData.modifiers) {
            effectData.modifiers = [];
          }
          
          effectData.modifiers.push({
            weaponId: weapon.id,
            modifierId: modifier.id
          });
        });
        
        // Add to active effects if temporary
        if (effectData.duration > 0) {
          this.addActiveEffect({
            ...effectData,
            startTime: Date.now(),
            onExpire: () => {
              // Remove all tracked modifiers
              if (effectData.modifiers) {
                effectData.modifiers.forEach(mod => {
                  const weapon = weaponManager.getWeaponById(mod.weaponId);
                  if (weapon) {
                    weapon.removeModifier(mod.modifierId);
                  }
                });
              }
            }
          });
        }
        break;
    }
    
    // Re-detect synergies after modification
    weaponManager.detectSynergies();
  }
  
  /**
   * Add an effect to the active effects list
   * @param {Object} effect - The effect to track
   */
  addActiveEffect(effect) {
    this.activeEffects.push(effect);
  }
  
  /**
   * Update active temporary effects
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateActiveEffects(deltaTime) {
    const now = Date.now();
    
    // Check for expired effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      
      // Calculate remaining time
      const elapsedMs = now - effect.startTime;
      const remainingMs = (effect.duration * 1000) - elapsedMs;
      
      // Update remaining time
      effect.remainingTime = remainingMs / 1000;
      
      // Check if expired
      if (remainingMs <= 0) {
        // Call expire callback
        if (effect.onExpire) {
          effect.onExpire();
        }
        
        // Call global callback
        if (this.onEffectExpired) {
          this.onEffectExpired(effect);
        }
        
        // Remove from active effects
        this.activeEffects.splice(i, 1);
      }
    }
  }
  
  /**
   * Spawn a random power-up
   * @returns {BasePowerUp} The spawned power-up
   */
  spawnRandomPowerUp() {
    // Choose a random power-up type
    const types = Object.keys(this.powerUpTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Generate random position within arena
    const position = this.getRandomSpawnPosition();
    
    // Create the power-up
    return this.spawnPowerUp(randomType, position);
  }
  
  /**
   * Spawn a specific power-up
   * @param {string} type - Type of power-up to spawn
   * @param {THREE.Vector3} position - Position to spawn at
   * @param {Object} config - Additional configuration
   * @returns {BasePowerUp} The spawned power-up
   */
  spawnPowerUp(type, position, config = {}) {
    // Get power-up class
    const PowerUpClass = this.powerUpTypes[type];
    if (!PowerUpClass) {
      console.error(`Unknown power-up type: ${type}`);
      return null;
    }
    
    // Create the power-up
    const powerUpConfig = {
      ...config,
      type,
      position,
      scene: this.scene
    };
    
    // Add level scaling to value
    if (this.player && this.player.level && !config.value) {
      powerUpConfig.value = this.getScaledValue(type, this.player.level);
    }
    
    const powerUp = new PowerUpClass(powerUpConfig);
    
    // Add to active power-ups
    this.powerUps.push(powerUp);
    
    return powerUp;
  }
  
  /**
   * Get a scaled value based on player level
   * @param {string} type - Type of power-up
   * @param {number} level - Player level
   * @returns {number} Scaled value
   */
  getScaledValue(type, level) {
    // Base values for each power-up type
    const baseValues = {
      'health': 25,
      'shield': 25,
      'weapon_upgrade': 1,
      'speed_boost': 30,
      'damage_boost': 25
    };
    
    // Default value if type not found
    const baseValue = baseValues[type] || 10;
    
    // Scale by level (diminishing returns at higher levels)
    const scaleFactor = 1 + Math.log10(level) * 0.5;
    
    return Math.round(baseValue * scaleFactor);
  }
  
  /**
   * Generate a random position within the arena
   * @returns {THREE.Vector3} Random position
   */
  getRandomSpawnPosition() {
    // Calculate random angle and distance from center
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.arenaRadius * 0.8;
    
    // Convert to Cartesian coordinates
    const position = new THREE.Vector3(
      Math.cos(angle) * distance,
      0, // Fix Y to 0 for 2D mode
      Math.sin(angle) * distance
    );
    
    return position;
  }
  
  /**
   * Spawn a power-up at a specific position (e.g., from defeated enemy)
   * @param {Object} dropData - Information about the drop
   * @returns {BasePowerUp} The spawned power-up
   */
  spawnDrop(dropData) {
    return this.spawnPowerUp(
      dropData.type,
      dropData.position,
      { value: dropData.value }
    );
  }
  
  /**
   * Get all active power-ups
   * @returns {Array} Array of active power-ups
   */
  getPowerUps() {
    return this.powerUps;
  }
  
  /**
   * Get all active effects
   * @returns {Array} Array of active effects
   */
  getActiveEffects() {
    return this.activeEffects;
  }
  
  /**
   * Clean up all power-ups
   */
  cleanup() {
    // Remove all power-ups
    this.powerUps.forEach(powerUp => {
      powerUp.remove();
    });
    
    this.powerUps = [];
    
    // Clear active effects (without triggering expiration callbacks)
    this.activeEffects = [];
  }
}

export default PowerUpManager;