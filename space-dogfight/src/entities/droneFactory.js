/**
 * Space Dogfight - Drone Factory
 * 
 * This factory class creates and manages drones of different types.
 * It handles drone creation, progression, and squad management.
 */

import AttackDrone from './attackDrone';
import DefenseDrone from './defenseDrone'; 
import ReconDrone from './reconDrone';
import { DroneType } from './drone';

class DroneFactory {
  constructor(options = {}) {
    // Factory configuration
    this.config = {
      maxDrones: options.maxDrones || 3,
      progressionEnabled: options.progressionEnabled !== false, // Default true
      startingLevel: options.startingLevel || 1,
      scene: options.scene || null,
      owner: options.owner || null
    };
    
    // Active drones by type
    this.drones = {
      [DroneType.ATTACK]: null,
      [DroneType.DEFENSE]: null,
      [DroneType.RECON]: null
    };
    
    // Drone progression levels
    this.levels = {
      [DroneType.ATTACK]: this.config.startingLevel,
      [DroneType.DEFENSE]: this.config.startingLevel,
      [DroneType.RECON]: this.config.startingLevel
    };
    
    // Drone spec templates for each level
    this.droneSpecs = {
      [DroneType.ATTACK]: {
        1: { // Basic attack drone
          laserDamage: 10,
          laserRange: 500,
          missileDamage: 50,
          orbitRadius: 100
        },
        2: { // Improved attack drone
          laserDamage: 20,
          laserRange: 700,
          missileDamage: 75,
          laserCooldown: 0.15, // Faster firing rate
          orbitRadius: 120
        },
        3: { // Advanced attack drone
          laserDamage: 30,
          laserRange: 900,
          missileDamage: 100,
          laserCooldown: 0.1, // Even faster firing rate
          missileCooldown: 2.0, // Faster missile cooldown
          orbitRadius: 150
        }
      },
      [DroneType.DEFENSE]: {
        1: { // Basic defense drone
          shieldStrength: 100,
          shieldRange: 30,
          ecmStrength: 75
        },
        2: { // Improved defense drone
          shieldStrength: 150,
          shieldRange: 35,
          ecmStrength: 100,
          energyRechargeRate: 12 // Faster energy recharge
        },
        3: { // Advanced defense drone
          shieldStrength: 200,
          shieldRange: 40,
          ecmStrength: 125,
          energyRechargeRate: 15, // Even faster energy recharge
          shieldCooldown: 3.0 // Reduced shield cooldown
        }
      },
      [DroneType.RECON]: {
        1: { // Basic recon drone
          scanRange: 1000,
          beaconRange: 2000
        },
        2: { // Improved recon drone
          scanRange: 1500,
          beaconRange: 3000,
          scanCooldown: 10.0 // Reduced scan cooldown
        },
        3: { // Advanced recon drone
          scanRange: 2000,
          beaconRange: 4000,
          scanCooldown: 8.0, // Even shorter cooldown
          scanDuration: 3.0 // Faster scanning
        }
      }
    };
  }
  
  /**
   * Create a drone of the specified type
   */
  createDrone(type, options = {}) {
    // Check if we have reached the maximum number of drones
    const activeDroneCount = Object.values(this.drones).filter(Boolean).length;
    if (activeDroneCount >= this.config.maxDrones) {
      console.warn(`Maximum drone count (${this.config.maxDrones}) reached`);
      return null;
    }
    
    // Check if a drone of this type already exists
    if (this.drones[type]) {
      console.warn(`A drone of type ${type} already exists`);
      return this.drones[type];
    }
    
    // Get current level for this drone type
    const level = this.levels[type];
    
    // Get level-specific specs
    const levelSpecs = this.droneSpecs[type][level] || {};
    
    // Merge options with level specs and defaults
    const droneOptions = {
      ...levelSpecs,
      ...options,
      type,
      level,
      scene: options.scene || this.config.scene,
      owner: options.owner || this.config.owner
    };
    
    // Create appropriate drone type
    let drone;
    switch (type) {
      case DroneType.ATTACK:
        drone = new AttackDrone(droneOptions);
        break;
      case DroneType.DEFENSE:
        drone = new DefenseDrone(droneOptions);
        break;
      case DroneType.RECON:
        drone = new ReconDrone(droneOptions);
        break;
      default:
        console.error(`Unknown drone type: ${type}`);
        return null;
    }
    
    // Store the drone
    this.drones[type] = drone;
    
    console.log(`Created ${type} drone at level ${level}`);
    return drone;
  }
  
  /**
   * Get a drone by type (creates if it doesn't exist)
   */
  getDrone(type) {
    if (!this.drones[type]) {
      return this.createDrone(type);
    }
    return this.drones[type];
  }
  
  /**
   * Get all active drones
   */
  getAllDrones() {
    return Object.values(this.drones).filter(Boolean);
  }
  
  /**
   * Remove a drone
   */
  removeDrone(droneOrType) {
    const type = typeof droneOrType === 'string' ? droneOrType : droneOrType.type;
    
    if (this.drones[type]) {
      const drone = this.drones[type];
      
      // Remove from scene if present
      if (drone.group.parent) {
        drone.group.parent.remove(drone.group);
      }
      
      // Dispose any resources
      if (typeof drone.dispose === 'function') {
        drone.dispose();
      }
      
      // Remove reference
      this.drones[type] = null;
      
      console.log(`Removed ${type} drone`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Upgrade a drone to the next level
   */
  upgradeDrone(type) {
    // Check if progression is enabled
    if (!this.config.progressionEnabled) {
      console.warn('Drone progression is disabled');
      return false;
    }
    
    // Check if we have this drone type
    if (!this.drones[type]) {
      console.warn(`No ${type} drone exists to upgrade`);
      return false;
    }
    
    // Check if already at max level
    const currentLevel = this.levels[type];
    const maxLevel = Object.keys(this.droneSpecs[type]).length;
    
    if (currentLevel >= maxLevel) {
      console.warn(`${type} drone already at maximum level (${maxLevel})`);
      return false;
    }
    
    // Increase level
    this.levels[type] = currentLevel + 1;
    console.log(`Upgraded ${type} drone to level ${this.levels[type]}`);
    
    // Remove current drone
    this.removeDrone(type);
    
    // Create new drone at upgraded level
    return this.createDrone(type);
  }
  
  /**
   * Process a command for all drones
   */
  processCommand(command) {
    console.log(`Processing command for all drones:`, command);
    
    // Special handling for "all" commands
    if (command.action === 'drone-all') {
      // Send to all active drones
      let processed = false;
      
      for (const drone of this.getAllDrones()) {
        if (drone.processCommand(command)) {
          processed = true;
        }
      }
      
      return processed;
    } else if (command.action === 'drone-recall') {
      // Recall all drones
      let processed = false;
      
      for (const drone of this.getAllDrones()) {
        if (drone.processCommand(command)) {
          processed = true;
        }
      }
      
      return processed;
    } else {
      // Route command to appropriate drone type
      let targetType = null;
      
      if (command.action === 'drone-attack') {
        targetType = DroneType.ATTACK;
      } else if (command.action === 'drone-shield' || command.action === 'drone-defend') {
        targetType = DroneType.DEFENSE;
      } else if (command.action === 'drone-scan' || command.action === 'drone-beacon') {
        targetType = DroneType.RECON;
      }
      
      if (targetType) {
        // Get or create the drone
        const drone = this.getDrone(targetType);
        if (drone) {
          return drone.processCommand(command);
        }
      }
    }
    
    return false;
  }
  
  /**
   * Update all drones
   */
  update(deltaTime) {
    for (const drone of this.getAllDrones()) {
      drone.update(deltaTime);
    }
  }
}

export default DroneFactory;