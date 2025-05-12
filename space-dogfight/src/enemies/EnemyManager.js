import * as THREE from 'three';
import { BaseEnemy, Interceptor, Destroyer } from './index';

/**
 * EnemyManager - Handles spawning, updating, and managing all enemies
 */
class EnemyManager {
  /**
   * Create a new EnemyManager
   * @param {Object} config - Manager configuration
   * @param {THREE.Scene} config.scene - Game scene
   * @param {Object} config.player - Player ship
   * @param {Object} config.weaponManager - Weapon manager for enemies
   * @param {number} config.arenaRadius - Arena boundary radius
   */
  constructor(config = {}) {
    this.scene = config.scene || null;
    this.player = config.player || null;
    this.weaponManager = config.weaponManager || null;
    this.arenaRadius = config.arenaRadius || 150;
    
    // Track all active enemies
    this.enemies = [];
    
    // Track available enemy types
    this.enemyTypes = {
      'interceptor': Interceptor,
      'destroyer': Destroyer,
    };
    
    // Session tracking
    this.waveNumber = 0;
    this.enemiesDefeated = 0;
    this.difficultyLevel = 1;
    
    // Wave configuration
    this.currentWave = null;
    this.waveDelay = 5; // Seconds between waves
    this.waveTimer = 0;
    this.isWaveActive = false;
    this.waveCompleteCallback = null;
    
    // Spawn control
    this.spawnPoints = [];
    this.spawnDelay = 0;
    
    // Loot/drop callbacks
    this.onEnemyDestroyed = null;
    this.onLootDropped = null;
    
    // Wave definition templates
    this.waveTemplates = {
      interceptorWave: {
        enemyTypes: ['interceptor'],
        count: 5,
        spawnDelay: 1,
        levelMultiplier: 1
      },
      
      destroyerWave: {
        enemyTypes: ['destroyer'],
        count: 2,
        spawnDelay: 2,
        levelMultiplier: 1.2
      },
      
      mixedWave: {
        enemyTypes: ['interceptor', 'destroyer'],
        typeWeights: [0.7, 0.3], // 70% interceptors, 30% destroyers
        count: 7,
        spawnDelay: 1.5,
        levelMultiplier: 1.1
      }
    };
  }
  
  /**
   * Initialize the enemy manager
   */
  init() {
    // Generate spawn points around the arena
    this.generateSpawnPoints();
  }
  
  /**
   * Generate spawn points around the edge of the arena
   */
  generateSpawnPoints() {
    this.spawnPoints = [];
    
    // Create spawn points evenly distributed around the arena perimeter
    const pointCount = 8;
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      const spawnDistance = this.arenaRadius * 0.9; // Just inside the boundary
      
      const position = new THREE.Vector3(
        Math.cos(angle) * spawnDistance,
        0, // Fixed height in 2D mode
        Math.sin(angle) * spawnDistance
      );
      
      this.spawnPoints.push(position);
    }
  }
  
  /**
   * Update all enemies
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Skip if no scene or player
    if (!this.scene || !this.player) return;
    
    // Update active enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Update enemy
      const isActive = enemy.update(deltaTime, [...this.enemies, this.player]);
      
      // Remove if no longer active
      if (!isActive) {
        this.enemies.splice(i, 1);
      }
    }
    
    // Update wave progression
    this.updateWave(deltaTime);
  }
  
  /**
   * Update wave progression
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateWave(deltaTime) {
    // If no active wave, reduce wave timer
    if (!this.isWaveActive) {
      if (this.waveTimer > 0) {
        this.waveTimer -= deltaTime;
        
        // Start next wave when timer expires
        if (this.waveTimer <= 0) {
          this.startNextWave();
        }
      }
      return;
    }
    
    // Check if all enemies in current wave defeated
    if (this.currentWave && this.enemies.length === 0 && this.currentWave.pendingSpawns === 0) {
      this.completeWave();
    }
    
    // Handle enemy spawning for active wave
    if (this.currentWave && this.currentWave.pendingSpawns > 0) {
      // Update spawn timer
      this.currentWave.spawnTimer -= deltaTime;
      
      if (this.currentWave.spawnTimer <= 0) {
        // Spawn next enemy
        this.spawnEnemy();
        this.currentWave.pendingSpawns--;
        
        // Reset spawn timer if more enemies to spawn
        if (this.currentWave.pendingSpawns > 0) {
          this.currentWave.spawnTimer = this.currentWave.spawnDelay;
        }
      }
    }
  }
  
  /**
   * Start a new wave of enemies
   * @param {Object} waveConfig - Wave configuration
   * @param {Function} onComplete - Callback when wave is complete
   */
  startWave(waveConfig, onComplete = null) {
    // Skip if no player
    if (!this.player || !this.player.isAlive) return;
    
    // Configure wave
    this.currentWave = {
      ...waveConfig,
      pendingSpawns: waveConfig.count,
      spawnTimer: 0,
      startTime: Date.now()
    };
    
    this.isWaveActive = true;
    this.waveCompleteCallback = onComplete;
    
    // Log wave start
    console.log(`Starting wave ${this.waveNumber} with ${waveConfig.count} enemies`);
  }
  
  /**
   * Complete the current wave
   */
  completeWave() {
    if (!this.isWaveActive) return;
    
    this.isWaveActive = false;
    this.waveNumber++;
    
    // Increase difficulty every few waves
    if (this.waveNumber % 3 === 0) {
      this.difficultyLevel += 0.5;
    }
    
    // Set timer for next wave
    this.waveTimer = this.waveDelay;
    
    // Call completion callback
    if (this.waveCompleteCallback) {
      this.waveCompleteCallback({
        waveNumber: this.waveNumber - 1,
        enemiesDefeated: this.enemiesDefeated,
        duration: (Date.now() - this.currentWave.startTime) / 1000
      });
    }
    
    console.log(`Wave ${this.waveNumber - 1} complete!`);
    
    // Clear current wave
    this.currentWave = null;
  }
  
  /**
   * Start the next wave based on progression
   */
  startNextWave() {
    // Generate wave configuration based on progression
    const waveConfig = this.generateWaveConfig();
    
    // Start the wave
    this.startWave(waveConfig);
  }
  
  /**
   * Generate a wave configuration based on current progression
   * @returns {Object} Wave configuration
   */
  generateWaveConfig() {
    // Choose wave template based on wave number
    let template;
    
    if (this.waveNumber === 0) {
      // First wave is always interceptors (tutorial)
      template = { ...this.waveTemplates.interceptorWave };
      template.count = 3; // Fewer enemies in first wave
    } else if (this.waveNumber === 1) {
      // Second wave is also interceptors but more
      template = { ...this.waveTemplates.interceptorWave };
    } else if (this.waveNumber === 2) {
      // Third wave introduces destroyers
      template = { ...this.waveTemplates.destroyerWave };
    } else {
      // Later waves mix different types
      template = { ...this.waveTemplates.mixedWave };
      
      // Increase enemy count every few waves
      const extraEnemies = Math.floor((this.waveNumber - 3) / 2);
      template.count += extraEnemies;
      
      // Cap at reasonable maximum
      template.count = Math.min(template.count, 15);
    }
    
    // Apply difficulty scaling
    template.levelMultiplier *= this.difficultyLevel;
    
    return template;
  }
  
  /**
   * Spawn a single enemy
   */
  spawnEnemy() {
    if (!this.currentWave || !this.player || !this.player.isAlive) return;
    
    // Choose enemy type based on wave configuration
    let enemyType;
    
    if (this.currentWave.typeWeights) {
      // Choose based on weights
      const rand = Math.random();
      let cumulativeWeight = 0;
      
      for (let i = 0; i < this.currentWave.enemyTypes.length; i++) {
        cumulativeWeight += this.currentWave.typeWeights[i];
        if (rand < cumulativeWeight) {
          enemyType = this.currentWave.enemyTypes[i];
          break;
        }
      }
      
      // Fallback if weights don't add up to 1
      if (!enemyType) {
        enemyType = this.currentWave.enemyTypes[0];
      }
    } else {
      // Choose randomly from available types
      const typeIndex = Math.floor(Math.random() * this.currentWave.enemyTypes.length);
      enemyType = this.currentWave.enemyTypes[typeIndex];
    }
    
    // Choose a spawn point
    const spawnPointIndex = Math.floor(Math.random() * this.spawnPoints.length);
    const spawnPosition = this.spawnPoints[spawnPointIndex].clone();
    
    // Add random variation to spawn position
    spawnPosition.x += (Math.random() - 0.5) * 10;
    spawnPosition.z += (Math.random() - 0.5) * 10;
    
    // Calculate enemy level based on wave and difficulty
    const enemyLevel = Math.max(1, Math.floor(this.waveNumber * this.currentWave.levelMultiplier));
    
    // Create weapon manager for this enemy if needed
    const enemyWeaponManager = this.createEnemyWeaponManager();
    
    // Create enemy
    const EnemyClass = this.enemyTypes[enemyType];
    if (!EnemyClass) {
      console.error(`Unknown enemy type: ${enemyType}`);
      return;
    }
    
    const enemy = new EnemyClass({
      scene: this.scene,
      position: spawnPosition,
      target: this.player,
      weaponManager: enemyWeaponManager,
      level: enemyLevel,
      weaponConfig: this.getEnemyWeapons(enemyType, enemyLevel),
      onDestroy: (data) => this.handleEnemyDestroyed(data)
    });
    
    // Add to enemies list
    this.enemies.push(enemy);
  }
  
  /**
   * Create a weapon manager for an enemy
   * @returns {Object} Weapon manager instance
   */
  createEnemyWeaponManager() {
    // This would typically create a new instance of WeaponManager
    // For now, we'll return the global weaponManager
    return this.weaponManager;
  }
  
  /**
   * Get appropriate weapons for an enemy based on type and level
   * @param {string} enemyType - Type of enemy
   * @param {number} level - Level of enemy
   * @returns {Array} Array of weapon types
   */
  getEnemyWeapons(enemyType, level) {
    // Basic weapons based on enemy type
    switch (enemyType) {
      case 'interceptor':
        if (level >= 3) {
          return ['laser_basic', 'laser_basic']; // Dual lasers at higher levels
        }
        return ['laser_basic'];
        
      case 'destroyer':
        if (level >= 4) {
          return ['machine_gun_basic', 'machine_gun_basic']; // Dual heavy weapons at higher levels
        } else if (level >= 2) {
          return ['machine_gun_basic'];
        }
        return ['laser_basic'];
        
      default:
        return ['laser_basic'];
    }
  }
  
  /**
   * Handle enemy destruction
   * @param {Object} data - Data about the destroyed enemy
   */
  handleEnemyDestroyed(data) {
    // Track stats
    this.enemiesDefeated++;
    
    // Call external callback if set
    if (this.onEnemyDestroyed) {
      this.onEnemyDestroyed(data);
    }
    
    // Determine if a loot drop should occur
    this.generateLootDrop(data);
  }
  
  /**
   * Generate loot drop from destroyed enemy
   * @param {Object} data - Data about the destroyed enemy
   */
  generateLootDrop(data) {
    if (!this.onLootDropped) return;
    
    // Base drop chance
    let dropChance = 0.3; // 30% base chance
    
    // Adjust based on enemy type and level
    switch (data.type) {
      case 'destroyer':
        dropChance += 0.2; // Destroyers have higher drop chance
        break;
      case 'interceptor':
        dropChance += 0.1; // Interceptors have slightly higher drop chance
        break;
    }
    
    // Level increases drop chance
    dropChance += data.level * 0.05;
    
    // Cap at 80%
    dropChance = Math.min(dropChance, 0.8);
    
    // Roll for drop
    if (Math.random() < dropChance) {
      // Generate drop type
      const dropTypes = ['health', 'shield', 'weapon_upgrade', 'speed_boost', 'damage_boost'];
      const weights = [0.3, 0.3, 0.2, 0.1, 0.1];
      
      let dropType;
      const rand = Math.random();
      let cumulativeWeight = 0;
      
      for (let i = 0; i < dropTypes.length; i++) {
        cumulativeWeight += weights[i];
        if (rand < cumulativeWeight) {
          dropType = dropTypes[i];
          break;
        }
      }
      
      // Create drop data
      const dropData = {
        type: dropType,
        position: data.position.clone(),
        level: data.level,
        value: this.calculateDropValue(dropType, data.level)
      };
      
      // Call loot drop callback
      this.onLootDropped(dropData);
    }
  }
  
  /**
   * Calculate value of a loot drop based on type and level
   * @param {string} type - Type of loot
   * @param {number} level - Level of enemy that dropped it
   * @returns {number} Value of the drop
   */
  calculateDropValue(type, level) {
    const baseValues = {
      'health': 20,
      'shield': 20,
      'weapon_upgrade': 1,
      'speed_boost': 5,
      'damage_boost': 10
    };
    
    // Level multiplier
    const multiplier = 1 + (level - 1) * 0.2;
    
    return Math.round(baseValues[type] * multiplier);
  }
  
  /**
   * Spawn a specific enemy for testing or scripted events
   * @param {string} enemyType - Type of enemy to spawn
   * @param {THREE.Vector3} position - Position to spawn at
   * @param {number} level - Level of enemy
   * @returns {Object} The spawned enemy
   */
  spawnSpecificEnemy(enemyType, position, level = 1) {
    const EnemyClass = this.enemyTypes[enemyType];
    if (!EnemyClass) {
      console.error(`Unknown enemy type: ${enemyType}`);
      return null;
    }
    
    // Create enemy
    const enemy = new EnemyClass({
      scene: this.scene,
      position: position.clone(),
      target: this.player,
      weaponManager: this.weaponManager,
      level: level,
      weaponConfig: this.getEnemyWeapons(enemyType, level),
      onDestroy: (data) => this.handleEnemyDestroyed(data)
    });
    
    // Add to enemies list
    this.enemies.push(enemy);
    
    return enemy;
  }
  
  /**
   * Get all active enemies
   * @returns {Array} Array of active enemies
   */
  getEnemies() {
    return this.enemies;
  }
  
  /**
   * Get current wave status
   * @returns {Object} Wave status information
   */
  getWaveStatus() {
    return {
      waveNumber: this.waveNumber,
      isActive: this.isWaveActive,
      enemiesRemaining: (this.currentWave ? this.currentWave.pendingSpawns : 0) + this.enemies.length,
      totalEnemies: this.currentWave ? this.currentWave.count : 0,
      waveTimer: this.waveTimer,
      enemiesDefeated: this.enemiesDefeated,
      difficultyLevel: this.difficultyLevel
    };
  }
  
  /**
   * Clean up all enemies and resources
   */
  cleanup() {
    // Dispose of all enemies
    this.enemies.forEach(enemy => {
      enemy.dispose();
    });
    
    this.enemies = [];
    this.currentWave = null;
    this.isWaveActive = false;
  }
}

export default EnemyManager;