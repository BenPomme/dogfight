import BaseEnemy from './BaseEnemy';
import Interceptor from './Interceptor';
import Destroyer from './Destroyer';
import EnemyManager from './EnemyManager';

export {
  BaseEnemy,
  Interceptor,
  Destroyer,
  EnemyManager
};

/**
 * The Enemy Variety system provides different enemy types with unique behaviors,
 * abilities, and visual designs. Each enemy type is designed to provide a different
 * combat challenge and require different tactics to defeat.
 * 
 * Currently implemented enemy types:
 * 
 * - Interceptor: Fast, agile ships with lighter weapons and burst fire capabilities.
 *   They use their speed to flank and harass the player. Equipped with thrusters
 *   for occasional speed boosts.
 * 
 * - Destroyer: Heavy, durable ships with powerful weapons and shields. They are slow
 *   but can absorb significant damage and return fire with both primary weapons and
 *   missile volleys.
 * 
 * Each enemy type has:
 * - Unique visual design
 * - Special abilities and attacks
 * - Different movement and combat behaviors
 * - Varied stats (health, speed, armor, etc.)
 * - Specific weapon loadouts
 * 
 * Usage:
 * 
 * 1. Create an enemy of a specific type:
 *    const enemy = new Interceptor({
 *      scene: gameScene,
 *      position: new THREE.Vector3(x, y, z),
 *      target: playerShip,
 *      weaponManager: weaponManager,
 *      level: currentWaveLevel
 *    });
 * 
 * 2. Update enemy in the game loop:
 *    enemy.update(deltaTime, obstacles);
 * 
 * 3. Handle enemy destruction:
 *    enemy.takeDamage(damageAmount, damageSource);
 * 
 * 4. Clean up when removing:
 *    enemy.dispose();
 */