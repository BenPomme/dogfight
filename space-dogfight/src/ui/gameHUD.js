// Game HUD System for Space Dogfight
// This module handles the game HUD elements and their updates

import { scoreState } from './scoreSystem.js';

// HUD state
const hudState = {
    isVisible: true,
    elements: {},
    animations: {},
    notifications: []
};

// Initialize the HUD
export function initHUD() {
    // Create HUD container if it doesn't exist
    let hudContainer = document.getElementById('hud');
    
    if (!hudContainer) {
        hudContainer = document.createElement('div');
        hudContainer.id = 'hud';
        document.body.appendChild(hudContainer);
    }
    
    // Add HUD elements
    createHealthBar();
    createShieldBar();
    createWeaponDisplay();
    createMinimap();
    createObjectiveIndicator();
    createNotificationArea();
    
    // Add CSS styles
    addHUDStyles();
}

// Show or hide the HUD
export function toggleHUD(visible = null) {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    if (visible === null) {
        // Toggle current state
        hudState.isVisible = !hudState.isVisible;
    } else {
        // Set to specific state
        hudState.isVisible = visible;
    }
    
    hudContainer.style.display = hudState.isVisible ? 'block' : 'none';
}

// Update HUD elements based on game state
export function updateHUD(gameState) {
    if (!gameState || !gameState.player) return;
    
    updateHealthBar(gameState.player.health);
    updateShieldBar(gameState.player.shield);
    updateWeaponDisplay(gameState);
    updateMinimap(gameState);
    updateNotifications();
}

// HUD Element Creation

// Create health bar
function createHealthBar() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    healthBar.innerHTML = `
        <div class="health-label">HULL</div>
        <div class="health-value" style="transform: scaleX(1);"></div>
    `;
    
    hudContainer.appendChild(healthBar);
    hudState.elements.healthBar = healthBar;
}

// Create shield bar
function createShieldBar() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const shieldBar = document.createElement('div');
    shieldBar.className = 'shield-bar';
    shieldBar.innerHTML = `
        <div class="shield-label">SHIELD</div>
        <div class="shield-value" style="transform: scaleX(1);"></div>
    `;
    
    hudContainer.appendChild(shieldBar);
    hudState.elements.shieldBar = shieldBar;
}

// Create weapon display
function createWeaponDisplay() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const weaponsDisplay = document.createElement('div');
    weaponsDisplay.className = 'weapons';
    weaponsDisplay.innerHTML = `
        <div class="weapon primary">
            <div class="weapon-name">LASER</div>
            <div class="weapon-ammo">∞</div>
        </div>
        <div class="weapon secondary">
            <div class="weapon-name">MISSILE</div>
            <div class="weapon-ammo">8</div>
        </div>
    `;
    
    hudContainer.appendChild(weaponsDisplay);
    hudState.elements.weaponsDisplay = weaponsDisplay;
}

// Create minimap
function createMinimap() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const minimap = document.createElement('div');
    minimap.className = 'minimap';
    minimap.innerHTML = `
        <div class="minimap-border"></div>
        <div class="minimap-container">
            <div class="minimap-player"></div>
            <!-- Enemy and objective markers will be added dynamically -->
        </div>
    `;
    
    hudContainer.appendChild(minimap);
    hudState.elements.minimap = minimap;
}

// Create objective indicator
function createObjectiveIndicator() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const objectiveIndicator = document.createElement('div');
    objectiveIndicator.className = 'objective-indicator';
    
    hudContainer.appendChild(objectiveIndicator);
    hudState.elements.objectiveIndicator = objectiveIndicator;
}

// Create notification area
function createNotificationArea() {
    const hudContainer = document.getElementById('hud');
    if (!hudContainer) return;
    
    const notificationArea = document.createElement('div');
    notificationArea.className = 'notification-area';
    
    hudContainer.appendChild(notificationArea);
    hudState.elements.notificationArea = notificationArea;
}

// HUD Element Updates

// Update health bar
function updateHealthBar(health) {
    const healthBar = document.querySelector('.health-bar');
    if (!healthBar) return;
    
    const healthValue = healthBar.querySelector('.health-value');
    if (!healthValue) return;
    
    // Update health bar scale
    const healthPercent = Math.max(0, Math.min(1, health / 100));
    healthValue.style.transform = `scaleX(${healthPercent})`;
    
    // Change color based on health level
    if (healthPercent < 0.2) {
        healthValue.style.background = 'linear-gradient(to right, #f00, #f50)';
    } else if (healthPercent < 0.5) {
        healthValue.style.background = 'linear-gradient(to right, #f50, #fa0)';
    } else {
        healthValue.style.background = 'linear-gradient(to right, #fa0, #0f0)';
    }
    
    // Add pulse animation for low health
    if (healthPercent < 0.2 && !healthBar.classList.contains('pulse')) {
        healthBar.classList.add('pulse');
    } else if (healthPercent >= 0.2 && healthBar.classList.contains('pulse')) {
        healthBar.classList.remove('pulse');
    }
}

// Update shield bar
function updateShieldBar(shield) {
    const shieldBar = document.querySelector('.shield-bar');
    if (!shieldBar) return;
    
    const shieldValue = shieldBar.querySelector('.shield-value');
    if (!shieldValue) return;
    
    // Update shield bar scale
    const shieldPercent = Math.max(0, Math.min(1, shield / 100));
    shieldValue.style.transform = `scaleX(${shieldPercent})`;
    
    // Add recharging animation
    if (shield < 100 && shield > 0) {
        shieldValue.classList.add('recharging');
    } else {
        shieldValue.classList.remove('recharging');
    }
}

// Update weapon display
function updateWeaponDisplay(gameState) {
    const weaponsDisplay = document.querySelector('.weapons');
    if (!weaponsDisplay) return;
    
    // Update missile ammo
    const missileAmmo = weaponsDisplay.querySelector('.weapon.secondary .weapon-ammo');
    if (missileAmmo && gameState.player) {
        missileAmmo.textContent = gameState.player.missileAmmo;
        
        // Highlight if changed
        if (gameState.player.missileAmmo !== parseInt(missileAmmo.dataset.lastValue || '0')) {
            missileAmmo.classList.add('ammo-changed');
            setTimeout(() => {
                missileAmmo.classList.remove('ammo-changed');
            }, 500);
            
            missileAmmo.dataset.lastValue = gameState.player.missileAmmo;
        }
    }
    
    // Weapon cooldown visualization
    const primaryWeapon = weaponsDisplay.querySelector('.weapon.primary');
    if (primaryWeapon && gameState.player) {
        if (gameState.player.weaponCooldown > 0) {
            primaryWeapon.classList.add('cooldown');
        } else {
            primaryWeapon.classList.remove('cooldown');
        }
        
        // Add weapon boost indicator
        if (gameState.player.weaponBoostActive) {
            if (!primaryWeapon.classList.contains('boosted')) {
                primaryWeapon.classList.add('boosted');
            }
        } else {
            primaryWeapon.classList.remove('boosted');
        }
    }
}

// Update minimap with entities
function updateMinimap(gameState) {
    const minimapContainer = document.querySelector('.minimap-container');
    if (!minimapContainer) return;
    
    // Clear previous entities (except player)
    const markers = minimapContainer.querySelectorAll('.minimap-entity');
    markers.forEach(marker => {
        minimapContainer.removeChild(marker);
    });
    
    // Minimap scale factor (world space to minimap pixels)
    const scale = 0.5;
    const maxDistance = 150; // Maximum distance to show on minimap
    
    // Add entities to minimap
    gameState.entities.forEach(entity => {
        if (!entity.isAlive || entity === gameState.player) return;
        
        // Calculate relative position to player
        const relX = entity.position.x - gameState.player.position.x;
        const relZ = entity.position.z - gameState.player.position.z;
        
        // Skip if too far
        const distance = Math.sqrt(relX * relX + relZ * relZ);
        if (distance > maxDistance) return;
        
        // Create marker
        const marker = document.createElement('div');
        marker.className = 'minimap-entity';
        
        // Set marker type based on entity type
        if (entity.isEscort) {
            marker.classList.add('friendly');
        } else if (entity.isTransport) {
            marker.classList.add('transport');
        } else if (entity.fireRate !== undefined) {
            marker.classList.add('enemy');
        } else if (entity.radius > 3) {
            marker.classList.add('asteroid');
        } else if (entity.effect !== undefined) {
            marker.classList.add('powerup');
        } else {
            marker.classList.add('unknown');
        }
        
        // Position marker on minimap
        const mapX = 50 + (relX * scale);
        const mapY = 50 + (relZ * scale);
        
        marker.style.left = `${mapX}%`;
        marker.style.top = `${mapY}%`;
        
        // Add to minimap
        minimapContainer.appendChild(marker);
    });
    
    // Update player marker rotation based on ship heading
    const playerMarker = minimapContainer.querySelector('.minimap-player');
    if (playerMarker && gameState.player) {
        // Convert Y rotation to degrees (Y rotation is yaw/heading)
        const heading = (gameState.player.rotation.y * 180 / Math.PI) % 360;
        playerMarker.style.transform = `rotate(${heading}deg)`;
    }
}

// Update objective indicator
export function updateObjectiveIndicator(target, gameState) {
    const objectiveIndicator = document.querySelector('.objective-indicator');
    if (!objectiveIndicator || !gameState || !gameState.player || !target) return;
    
    // Calculate direction to target
    const relX = target.x - gameState.player.position.x;
    const relY = target.y - gameState.player.position.y;
    const relZ = target.z - gameState.player.position.z;
    
    // Calculate distance to target
    const distance = Math.sqrt(relX * relX + relY * relY + relZ * relZ);
    
    // Display distance
    objectiveIndicator.innerHTML = `
        <div class="indicator-arrow"></div>
        <div class="indicator-distance">${Math.round(distance)}m</div>
    `;
    
    // Calculate angle between player's forward direction and target
    // This depends on player's current rotation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(gameState.player.group.quaternion);
    const toTarget = new THREE.Vector3(relX, relY, relZ).normalize();
    
    // Determine if target is in front or behind
    const dotProduct = forward.dot(toTarget);
    
    if (dotProduct < 0) {
        // Target is behind
        objectiveIndicator.classList.add('behind');
    } else {
        objectiveIndicator.classList.remove('behind');
    }
    
    // Calculate 2D screen position for indicator
    // This is simplified - in a real game, you'd project the 3D position to 2D
    const angle = Math.atan2(relX, relZ) - gameState.player.rotation.y;
    const normalizedAngle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
    
    // Position indicator around the edge of the screen
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4;
    const x = Math.sin(normalizedAngle) * radius;
    const y = -Math.cos(normalizedAngle) * radius;
    
    // Center the indicator in the screen, then offset by the calculated position
    objectiveIndicator.style.left = `calc(50% + ${x}px)`;
    objectiveIndicator.style.top = `calc(50% + ${y}px)`;
    
    // Rotate the arrow to point to the target
    const arrowElement = objectiveIndicator.querySelector('.indicator-arrow');
    if (arrowElement) {
        arrowElement.style.transform = `rotate(${normalizedAngle * 180 / Math.PI}deg)`;
    }
    
    // Show indicator only if we have a target
    objectiveIndicator.style.display = 'flex';
}

// Hide objective indicator
export function hideObjectiveIndicator() {
    const objectiveIndicator = document.querySelector('.objective-indicator');
    if (objectiveIndicator) {
        objectiveIndicator.style.display = 'none';
    }
}

// Add game notification
export function addNotification(message, type = 'info', duration = 5000) {
    // Create notification object
    const notification = {
        message,
        type,
        timestamp: Date.now(),
        duration,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    
    // Add to notifications array
    hudState.notifications.push(notification);
    
    // Display notification
    displayNotification(notification);
    
    // Remove after duration
    setTimeout(() => {
        removeNotification(notification.id);
    }, duration);
    
    return notification.id;
}

// Display notification
function displayNotification(notification) {
    const notificationArea = document.querySelector('.notification-area');
    if (!notificationArea) return;
    
    // Create notification element
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.dataset.id = notification.id;
    
    // Set icon based on type
    let icon = '🔔'; // Default
    switch (notification.type) {
        case 'success': icon = '✓'; break;
        case 'warning': icon = '⚠️'; break;
        case 'danger': icon = '❌'; break;
        case 'objective': icon = '🎯'; break;
        case 'reward': icon = '🏆'; break;
    }
    
    element.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${notification.message}</div>
    `;
    
    // Add to notification area
    notificationArea.appendChild(element);
    
    // Animate in
    setTimeout(() => {
        element.classList.add('active');
    }, 10);
}

// Remove notification
function removeNotification(id) {
    // Remove from array
    hudState.notifications = hudState.notifications.filter(n => n.id !== id);
    
    // Remove from DOM
    const element = document.querySelector(`.notification[data-id="${id}"]`);
    if (element) {
        element.classList.remove('active');
        
        // Remove element after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }
}

// Update notifications
function updateNotifications() {
    // Check for expired notifications
    const currentTime = Date.now();
    
    hudState.notifications.forEach(notification => {
        if (currentTime - notification.timestamp > notification.duration) {
            removeNotification(notification.id);
        }
    });
}

// Add CSS styles
function addHUDStyles() {
    if (document.getElementById('hud-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'hud-styles';
    style.textContent = `
        #hud {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }
        
        /* Health and Shield Bars */
        .health-bar, .shield-bar {
            position: absolute;
            left: 20px;
            width: 250px;
            height: 26px;
            background-color: rgba(0, 10, 20, 0.8);
            border: 2px solid #0cf;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
            overflow: hidden;
            border-radius: 3px;
        }
        
        .health-bar {
            top: 20px;
        }
        
        .shield-bar {
            top: 55px;
        }
        
        .health-label, .shield-label {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 5px #0cf;
            z-index: 2;
        }
        
        .health-value, .shield-value {
            height: 100%;
            width: 100%;
            background: linear-gradient(to right, #0f0, #fa0);
            transform-origin: left;
            position: relative;
            transition: transform 0.3s ease;
        }
        
        .shield-value {
            background: linear-gradient(to right, #0af, #03f);
        }
        
        .health-bar.pulse .health-value {
            animation: health-pulse 1s infinite;
        }
        
        @keyframes health-pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
        }
        
        .shield-value.recharging {
            background: linear-gradient(to right, #0af, #03f);
            background-size: 200% 100%;
            animation: shield-recharge 2s infinite linear;
        }
        
        @keyframes shield-recharge {
            0% { background-position: 100% 0; }
            100% { background-position: 0 0; }
        }
        
        /* Weapons Display */
        .weapons {
            position: absolute;
            right: 20px;
            top: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 180px;
        }
        
        .weapon {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 15px;
            background-color: rgba(0, 10, 20, 0.8);
            border: 2px solid #0cf;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
            border-radius: 3px;
            transition: all 0.2s ease;
        }
        
        .weapon.cooldown {
            opacity: 0.7;
            border-color: #088;
        }
        
        .weapon.boosted {
            border-color: #f00;
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
            animation: weapon-boosted 1s infinite;
        }
        
        @keyframes weapon-boosted {
            0% { border-color: #f00; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
            50% { border-color: #f60; box-shadow: 0 0 15px rgba(255, 102, 0, 0.7); }
            100% { border-color: #f00; box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
        }
        
        .weapon-name {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            text-shadow: 0 0 5px #0cf;
        }
        
        .weapon-ammo {
            font-family: monospace;
            font-size: 16px;
            font-weight: bold;
            color: #ff3;
            text-shadow: 0 0 5px #ff3;
            transition: all 0.2s ease;
        }
        
        .weapon-ammo.ammo-changed {
            transform: scale(1.2);
            color: #f60;
        }
        
        /* Minimap */
        .minimap {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 150px;
            height: 150px;
        }
        
        .minimap-border {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 2px solid #0cf;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.5) inset, 0 0 10px rgba(0, 204, 255, 0.5);
            pointer-events: none;
        }
        
        .minimap-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 10, 20, 0.7);
            border-radius: 50%;
            overflow: hidden;
        }
        
        .minimap-player {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #0f0;
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            clip-path: polygon(0% 50%, 50% 0%, 100% 50%, 50% 100%);
        }
        
        .minimap-entity {
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
        }
        
        .minimap-entity.enemy {
            background-color: #f00;
            box-shadow: 0 0 5px #f00;
        }
        
        .minimap-entity.friendly {
            background-color: #0f0;
            box-shadow: 0 0 5px #0f0;
        }
        
        .minimap-entity.transport {
            background-color: #ff0;
            box-shadow: 0 0 5px #ff0;
            width: 8px;
            height: 8px;
        }
        
        .minimap-entity.asteroid {
            background-color: #aaa;
            box-shadow: 0 0 3px #aaa;
        }
        
        .minimap-entity.powerup {
            background-color: #f0f;
            box-shadow: 0 0 5px #f0f;
            animation: powerup-pulse 1s infinite;
        }
        
        @keyframes powerup-pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.5); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
        
        /* Objective Indicator */
        .objective-indicator {
            position: absolute;
            display: flex;
            flex-direction: column;
            align-items: center;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 5;
        }
        
        .indicator-arrow {
            width: 20px;
            height: 20px;
            background-color: #ff0;
            clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
            margin-bottom: 5px;
        }
        
        .objective-indicator.behind .indicator-arrow {
            background-color: #f00;
            transform: rotate(180deg) !important;
        }
        
        .indicator-distance {
            font-size: 12px;
            color: #ff0;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 2px 6px;
            border-radius: 10px;
            white-space: nowrap;
        }
        
        .objective-indicator.behind .indicator-distance {
            color: #f00;
        }
        
        /* Notification Area */
        .notification-area {
            position: absolute;
            bottom: 180px;
            right: 20px;
            width: 300px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }
        
        .notification {
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: rgba(0, 10, 20, 0.8);
            border-left: 4px solid #0cf;
            padding: 10px;
            border-radius: 3px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        .notification.active {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification-info {
            border-left-color: #0cf;
        }
        
        .notification-success {
            border-left-color: #0f0;
        }
        
        .notification-warning {
            border-left-color: #ff0;
        }
        
        .notification-danger {
            border-left-color: #f00;
        }
        
        .notification-objective {
            border-left-color: #f0f;
        }
        
        .notification-reward {
            border-left-color: #ff0;
            background-color: rgba(40, 30, 0, 0.8);
        }
        
        .notification-icon {
            font-size: 20px;
            min-width: 24px;
            text-align: center;
        }
        
        .notification-message {
            font-size: 14px;
            color: #fff;
            flex-grow: 1;
        }
    `;
    
    document.head.appendChild(style);
}

// Export HUD state for external access
export { hudState };