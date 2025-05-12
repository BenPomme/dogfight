import BasePowerUp from './BasePowerUp';
import HealthPowerUp from './HealthPowerUp';
import WeaponUpgradePowerUp from './WeaponUpgradePowerUp';
import PowerUpManager from './PowerUpManager';

export {
  BasePowerUp,
  HealthPowerUp,
  WeaponUpgradePowerUp,
  PowerUpManager
};

/**
 * The Power-Up System provides collectible items that grant temporary or permanent
 * enhancements to the player. Power-ups are a key component of the roguelite
 * progression, offering in-session upgrades that shape the player's build.
 * 
 * Currently implemented power-up types:
 * 
 * - Health: Restores player hull integrity (health points)
 * - Weapon Upgrade: Enhances weapons through level upgrades or stat modifiers
 * 
 * Each power-up has:
 * - Unique visual design
 * - Specialized collection effects
 * - Different effect types (instant, temporary, permanent)
 * - Varied values that scale with progression
 * 
 * The PowerUpManager handles:
 * - Spawning power-ups at timed intervals
 * - Spawning specific drops from defeated enemies
 * - Detecting collisions with the player
 * - Applying power-up effects to the player
 * - Tracking temporary effects and handling their expiration
 * 
 * Usage:
 * 
 * 1. Create a PowerUpManager:
 *    const powerUpManager = new PowerUpManager({
 *      scene: gameScene,
 *      player: playerShip,
 *      arenaRadius: PHYSICS.arenaRadius
 *    });
 * 
 * 2. Update in the game loop:
 *    powerUpManager.update(deltaTime);
 * 
 * 3. Spawn power-ups:
 *    // Automatic spawning is handled by the manager
 *    // For specific spawns:
 *    powerUpManager.spawnPowerUp('health', position, { value: 30 });
 * 
 * 4. Handle drops from enemies:
 *    enemyManager.onLootDropped = (dropData) => {
 *      powerUpManager.spawnDrop(dropData);
 *    };
 */