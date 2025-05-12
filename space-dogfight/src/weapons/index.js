import BaseWeapon from './BaseWeapon';
import LaserWeapon from './LaserWeapon';
import MachineGun from './MachineGun';
import WeaponManager from './WeaponManager';
import ProjectileManager from './ProjectileManager';

export {
  BaseWeapon,
  LaserWeapon,
  MachineGun,
  WeaponManager,
  ProjectileManager
};

/**
 * The Weapon System provides a complete framework for creating, managing,
 * and upgrading weapons in the game. This system is designed to support:
 * 
 * - Multiple weapon types with unique behaviors
 * - Weapon upgrades and evolutions
 * - Weapon synergies between different types
 * - Projectile creation and management
 * - Visual and audio feedback for weapons
 * 
 * Usage:
 * 
 * 1. Create a ProjectileManager:
 *    const projectileManager = new ProjectileManager({ scene });
 * 
 * 2. Create a WeaponManager:
 *    const weaponManager = new WeaponManager({ 
 *      scene, 
 *      projectileManager 
 *    });
 * 
 * 3. Create weapons and attach to a ship:
 *    const laser = weaponManager.createWeapon('laser_basic');
 *    weaponManager.attachWeaponsToParent(shipObject, mountPoints);
 * 
 * 4. Update in the game loop:
 *    weaponManager.update(deltaTime);
 *    projectileManager.update(deltaTime);
 * 
 * 5. Control weapons:
 *    // Auto-fire mode
 *    weaponManager.startFiring();
 *    weaponManager.stopFiring();
 *    
 *    // Manual fire
 *    weaponManager.fireOnce();
 * 
 * 6. Handle upgrades:
 *    const availableUpgrades = weaponManager.getAvailableUpgrades();
 *    weaponManager.applyUpgrade(selectedUpgrade);
 */