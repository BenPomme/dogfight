// Space Outpost for Mission System
// This module creates outposts and other mission entities

/**
 * Create a space outpost at the specified position
 * @param {Object} gameState - Game state object
 * @param {THREE.Vector3} position - Position to create the outpost
 * @param {Number} size - Size multiplier for the outpost
 */
export function createSpaceOutpost(gameState, position = null, size = 1) {
    // Set default position if none provided
    if (!position) {
        position = new THREE.Vector3(0, 0, -50);
    }
    
    // Create outpost group
    const outpostGroup = new THREE.Group();
    outpostGroup.position.copy(position);
    
    // Create main station module (central hub)
    const coreGeometry = new THREE.CylinderGeometry(5 * size, 5 * size, 3 * size, 16);
    const coreMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x222222,
        shininess: 70
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = Math.PI / 2; // Align with Z axis
    outpostGroup.add(core);
    
    // Create the station ring
    const ringGeometry = new THREE.TorusGeometry(10 * size, 1 * size, 16, 48);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x111111,
        shininess: 50
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    outpostGroup.add(ring);
    
    // Add connecting struts between core and ring
    const strutCount = 4;
    for (let i = 0; i < strutCount; i++) {
        const angle = (i / strutCount) * Math.PI * 2;
        
        const strutGeometry = new THREE.BoxGeometry(0.8 * size, 0.8 * size, 5 * size);
        const strutMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            emissive: 0x111111
        });
        const strut = new THREE.Mesh(strutGeometry, strutMaterial);
        
        // Position strut from core to ring
        const strutDistance = 5 * size;
        strut.position.set(
            Math.cos(angle) * strutDistance,
            Math.sin(angle) * strutDistance,
            0
        );
        
        // Rotate strut to point from core to ring
        strut.lookAt(new THREE.Vector3(
            Math.cos(angle) * (10 * size),
            Math.sin(angle) * (10 * size),
            0
        ));
        
        outpostGroup.add(strut);
    }
    
    // Add docking ports
    const dockingPortCount = 4;
    for (let i = 0; i < dockingPortCount; i++) {
        const angle = (i / dockingPortCount) * Math.PI * 2;
        
        // Port geometry (cylinder)
        const portGeometry = new THREE.CylinderGeometry(1.2 * size, 1.2 * size, 2 * size, 8);
        const portMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            emissive: 0x111111
        });
        const port = new THREE.Mesh(portGeometry, portMaterial);
        
        // Position on the core
        port.position.set(
            Math.cos(angle) * (5 * size),
            Math.sin(angle) * (5 * size),
            0
        );
        
        // Rotate to point outward
        port.rotation.x = Math.PI / 2;
        port.lookAt(new THREE.Vector3(
            Math.cos(angle) * (10 * size),
            Math.sin(angle) * (10 * size),
            0
        ));
        
        outpostGroup.add(port);
        
        // Add port lights
        const portLightGeometry = new THREE.CylinderGeometry(0.3 * size, 0.3 * size, 0.1 * size, 8);
        const portLightMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff
        });
        const portLight = new THREE.Mesh(portLightGeometry, portLightMaterial);
        portLight.position.set(0, 0, 1.1 * size); // Position at end of port
        port.add(portLight);
        
        // Add point light
        const light = new THREE.PointLight(0x00ffff, 0.5, 10 * size);
        light.position.copy(portLight.position);
        port.add(light);
    }
    
    // Add solar panels
    const panelCount = 2;
    for (let i = 0; i < panelCount; i++) {
        const angle = (i / panelCount) * Math.PI * 2;
        
        // Panel arm
        const armGeometry = new THREE.BoxGeometry(0.5 * size, 0.5 * size, 8 * size);
        const armMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666
        });
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        
        // Position arm
        arm.position.set(
            Math.cos(angle) * (3 * size),
            Math.sin(angle) * (3 * size),
            0
        );
        
        // Rotate arm to extend outward
        arm.lookAt(new THREE.Vector3(
            Math.cos(angle) * (20 * size),
            Math.sin(angle) * (20 * size),
            0
        ));
        
        outpostGroup.add(arm);
        
        // Panel geometry
        const panelGeometry = new THREE.BoxGeometry(8 * size, 4 * size, 0.2 * size);
        const panelMaterial = new THREE.MeshPhongMaterial({
            color: 0x2244aa,
            emissive: 0x112244,
            shininess: 100
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        
        // Position at end of arm
        panel.position.set(0, 0, 4.5 * size);
        arm.add(panel);
    }
    
    // Add station lights
    const stationLightCount = 8;
    for (let i = 0; i < stationLightCount; i++) {
        const angle = (i / stationLightCount) * Math.PI * 2;
        
        // Light position on the ring
        const lightPosition = new THREE.Vector3(
            Math.cos(angle) * (10 * size),
            Math.sin(angle) * (10 * size),
            0
        );
        
        // Create point light
        const light = new THREE.PointLight(0xffaa00, 0.5, 15 * size);
        light.position.copy(lightPosition);
        outpostGroup.add(light);
        
        // Add light housing
        const lightHousingGeometry = new THREE.CylinderGeometry(0.3 * size, 0.5 * size, 0.5 * size, 8);
        const lightHousingMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5
        });
        const lightHousing = new THREE.Mesh(lightHousingGeometry, lightHousingMaterial);
        lightHousing.position.copy(lightPosition);
        lightHousing.lookAt(new THREE.Vector3(0, 0, 0)); // Point toward center
        outpostGroup.add(lightHousing);
    }
    
    // Add to scene
    gameState.scene.add(outpostGroup);
    
    // Create outpost object
    const outpost = {
        group: outpostGroup,
        position: outpostGroup.position,
        rotation: outpostGroup.rotation,
        radius: 12 * size,
        health: 100,
        maxHealth: 100,
        isAlive: true,
        
        update: function(deltaTime) {
            // Slow rotation
            this.rotation.z += 0.02 * deltaTime;
            this.group.rotation.z = this.rotation.z;
            
            // Check if destroyed
            if (this.health <= 0 && this.isAlive) {
                this.isAlive = false;
                createExplosion(this.position, 10 * size);
                // Don't remove the model, but show damage
                this.showDestroyedState();
            }
        },
        
        takeDamage: function(amount) {
            this.health = Math.max(0, this.health - amount);
            
            // Update visual state based on health percentage
            const healthPercent = this.health / this.maxHealth;
            this.updateDamageState(healthPercent);
            
            return this.health;
        },
        
        updateDamageState: function(healthPercent) {
            // Visual damage indicators
            if (healthPercent < 0.3) {
                this.showHeavyDamage();
            } else if (healthPercent < 0.6) {
                this.showModerateDamage();
            } else if (healthPercent < 0.9) {
                this.showLightDamage();
            }
        },
        
        showLightDamage: function() {
            // Create smoke effects
            createSmokeEffect(this.position, 0.5);
        },
        
        showModerateDamage: function() {
            // More smoke and sparks
            createSmokeEffect(this.position, 1);
            createSparkEffect(this.position);
            
            // Flicker lights
            if (Math.random() > 0.7) {
                this.group.children.forEach(child => {
                    if (child instanceof THREE.PointLight) {
                        child.intensity = 0.1 + Math.random() * 0.4;
                    }
                });
            }
        },
        
        showHeavyDamage: function() {
            // Heavy smoke, fire, and sparks
            createSmokeEffect(this.position, 2);
            createSparkEffect(this.position);
            createFireEffect(this.position);
            
            // Severe light flickering
            this.group.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = Math.random() > 0.5 ? 0 : 0.3 + Math.random() * 0.2;
                }
            });
        },
        
        showDestroyedState: function() {
            // Turn off all lights
            this.group.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 0;
                }
            });
            
            // Add heavy destruction effects
            createSmokeEffect(this.position, 3, true);
            createFireEffect(this.position, 2);
            
            // TOpple some parts
            this.group.children.forEach(child => {
                if (child instanceof THREE.Mesh && Math.random() > 0.5) {
                    child.rotation.x += (Math.random() - 0.5) * 0.5;
                    child.rotation.y += (Math.random() - 0.5) * 0.5;
                    child.position.x += (Math.random() - 0.5) * 2;
                    child.position.y += (Math.random() - 0.5) * 2;
                }
            });
        }
    };
    
    // Store in game state
    gameState.outpost = outpost;
    gameState.entities.push(outpost);
    
    return outpost;
}

/**
 * Create a convoy of transport ships with fighter escorts
 * @param {Object} gameState - Game state object
 */
export function createConvoy(gameState) {
    // Convoy starting position
    const startPosition = new THREE.Vector3(150, 0, -100);
    
    // Create main transport ships
    const transportCount = 3;
    const transportSpacing = 30;
    const transports = [];
    
    for (let i = 0; i < transportCount; i++) {
        const position = startPosition.clone().add(new THREE.Vector3(
            (i - Math.floor(transportCount / 2)) * transportSpacing,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 20
        ));
        
        // Create transport ship
        const transport = createTransportShip(gameState, position);
        transports.push(transport);
    }
    
    // Create escort fighters
    const escortCount = 6;
    const escorts = [];
    
    for (let i = 0; i < escortCount; i++) {
        let position;
        
        if (i < escortCount / 2) {
            // Front escorts
            position = startPosition.clone().add(new THREE.Vector3(
                (i - Math.floor(escortCount / 4)) * 15,
                (Math.random() - 0.5) * 15,
                -30 + (Math.random() - 0.5) * 10
            ));
        } else {
            // Side escorts
            const side = i % 2 === 0 ? 1 : -1;
            position = startPosition.clone().add(new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 15,
                side * (40 + (Math.random() - 0.5) * 10)
            ));
        }
        
        // Create escort fighter
        const escort = createEscortFighter(gameState, position);
        escorts.push(escort);
    }
    
    // Create convoy entity to manage the group
    const convoy = {
        transports: transports,
        escorts: escorts,
        position: startPosition.clone(),
        direction: new THREE.Vector3(-1, 0, 0), // Moving along negative X axis
        speed: 10,
        isAlive: true,
        
        update: function(deltaTime) {
            // Move along path
            this.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
            
            // Check if all transports destroyed
            const aliveTransports = this.transports.filter(t => t.isAlive);
            if (aliveTransports.length === 0) {
                this.isAlive = false;
            }
        }
    };
    
    // Store in game state
    gameState.convoy = convoy;
    
    return convoy;
}

/**
 * Create a transport ship
 * @param {Object} gameState - Game state object
 * @param {THREE.Vector3} position - Position to create the transport
 */
function createTransportShip(gameState, position) {
    // Create ship group
    const shipGroup = new THREE.Group();
    shipGroup.position.copy(position);
    
    // Create main hull (elongated box)
    const hullGeometry = new THREE.BoxGeometry(20, 6, 8);
    const hullMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        emissive: 0x222222,
        shininess: 50
    });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    shipGroup.add(hull);
    
    // Add cargo containers
    const containerCount = 6;
    const containerSpacing = 3;
    
    for (let i = 0; i < containerCount; i++) {
        const containerGeometry = new THREE.BoxGeometry(3, 3, 4);
        const containerMaterial = new THREE.MeshPhongMaterial({
            color: Math.random() > 0.5 ? 0xaa4422 : 0x224488,
            emissive: 0x111111,
            shininess: 30
        });
        const container = new THREE.Mesh(containerGeometry, containerMaterial);
        
        // Position along hull
        container.position.set(
            -6 + i * containerSpacing,
            1.5,
            0
        );
        
        shipGroup.add(container);
    }
    
    // Add engines
    const engineCount = 2;
    for (let i = 0; i < engineCount; i++) {
        const side = i === 0 ? -1 : 1;
        
        // Engine housing
        const engineGeometry = new THREE.CylinderGeometry(1.5, 1.2, 4, 8);
        engineGeometry.rotateZ(Math.PI / 2); // Align with X axis
        
        const engineMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            emissive: 0x111111
        });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        
        engine.position.set(
            -9, // Back of ship
            -1,
            side * 3 // Left or right
        );
        shipGroup.add(engine);
        
        // Engine glow
        const engineGlowGeometry = new THREE.CylinderGeometry(1, 0.5, 0.5, 8);
        engineGlowGeometry.rotateZ(Math.PI / 2); // Align with X axis
        
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            emissive: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        
        engineGlow.position.set(-11, 0, 0); // At back of engine
        engine.add(engineGlow);
        
        // Add engine light
        const engineLight = new THREE.PointLight(0xff6600, 1, 10);
        engineLight.position.copy(engineGlow.position);
        engine.add(engineLight);
    }
    
    // Add bridge
    const bridgeGeometry = new THREE.BoxGeometry(6, 3, 6);
    const bridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        emissive: 0x222222,
        shininess: 70
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(8, 0, 0); // Front of ship
    shipGroup.add(bridge);
    
    // Add windows
    const windowCount = 4;
    for (let i = 0; i < windowCount; i++) {
        const windowGeometry = new THREE.PlaneGeometry(0.8, 0.5);
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            emissive: 0x88aaff,
            side: THREE.DoubleSide
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        
        window.position.set(
            8, // On bridge
            0.5,
            -2.5 + i * 1.6 // Evenly spaced
        );
        window.rotation.y = Math.PI / 2; // Face forward
        
        shipGroup.add(window);
    }
    
    // Add to scene
    gameState.scene.add(shipGroup);
    
    // Create transport entity
    const transport = {
        group: shipGroup,
        position: shipGroup.position,
        rotation: shipGroup.rotation,
        velocity: new THREE.Vector3(-10, 0, 0), // Moving along negative X axis
        radius: 12,
        health: 150,
        maxHealth: 150,
        isAlive: true,
        isTransport: true,
        
        update: function(deltaTime) {
            // Update position based on velocity
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
            this.group.position.copy(this.position);
            
            // Add slight pitch and roll variation
            this.rotation.z = Math.sin(Date.now() * 0.0005) * 0.03;
            this.rotation.x = Math.sin(Date.now() * 0.0003) * 0.02;
            this.group.rotation.copy(this.rotation);
            
            // Check if destroyed
            if (this.health <= 0 && this.isAlive) {
                this.isAlive = false;
                this.destroy();
            }
            
            // Update damage effects
            if (this.health < this.maxHealth * 0.3) {
                this.showHeavyDamage();
            } else if (this.health < this.maxHealth * 0.6) {
                this.showModerateDamage();
            }
        },
        
        takeDamage: function(amount) {
            this.health = Math.max(0, this.health - amount);
            return this.health;
        },
        
        showModerateDamage: function() {
            // Add smoke effect
            if (Math.random() > 0.95) {
                createSmokeEffect(this.position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 4
                )), 0.5);
            }
        },
        
        showHeavyDamage: function() {
            // Add smoke and fire
            if (Math.random() > 0.9) {
                createSmokeEffect(this.position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 4
                )), 1);
            }
            
            if (Math.random() > 0.95) {
                createFireEffect(this.position.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 6,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 3
                )));
            }
            
            // Flicker engine lights
            this.group.children.forEach(child => {
                if (child instanceof THREE.PointLight) {
                    child.intensity = 0.2 + Math.random() * 0.8;
                }
            });
        },
        
        destroy: function() {
            // Create explosion
            createExplosion(this.position, 10);
            
            // Remove from scene after a delay
            setTimeout(() => {
                gameState.scene.remove(this.group);
            }, 3000);
        }
    };
    
    // Add to game entities
    gameState.entities.push(transport);
    
    return transport;
}

/**
 * Create an escort fighter ship
 * @param {Object} gameState - Game state object
 * @param {THREE.Vector3} position - Position to create the fighter
 */
function createEscortFighter(gameState, position) {
    // Create fighter exactly like enemy fighter but with different behavior
    const enemyType = "FIGHTER"; // Use existing fighter type
    
    // Create fighter using enemy creation function
    const fighter = createEnemy(gameState, position, enemyType);
    
    // Override fighter behavior for escort mission
    fighter.isEscort = true;
    fighter.patrolPoint = position.clone();
    fighter.escortDuty = "patrol"; // patrol, attack, return
    
    // Store original update function
    const originalUpdate = fighter.update;
    
    // Override update function
    fighter.update = function(deltaTime) {
        if (!this.isAlive) return;
        
        // Check for player proximity
        if (gameState.player && gameState.player.isAlive) {
            const distanceToPlayer = this.position.distanceTo(gameState.player.position);
            
            if (distanceToPlayer < 50 && this.escortDuty === "patrol") {
                // Player detected - switch to attack mode
                this.escortDuty = "attack";
            } else if (distanceToPlayer > 100 && this.escortDuty === "attack") {
                // Player too far - return to patrol
                this.escortDuty = "return";
            }
        }
        
        // Escort behavior based on duty
        switch (this.escortDuty) {
            case "patrol":
                // Patrol around assigned point
                patrolBehavior(this, deltaTime);
                break;
                
            case "attack":
                // Attack player - use original enemy behavior
                originalUpdate.call(this, deltaTime);
                break;
                
            case "return":
                // Return to patrol point
                returnToPatrol(this, deltaTime);
                break;
        }
        
        // Update visual effects
        updateVisualEffects(this, deltaTime);
    };
    
    return fighter;
}

/**
 * Patrol behavior for escort fighters
 * @param {Object} escort - Escort fighter object
 * @param {Number} deltaTime - Time delta
 */
function patrolBehavior(escort, deltaTime) {
    const time = Date.now() * 0.001;
    
    // Calculate patrol position (circle around patrol point)
    const radius = 10;
    const patrolPos = escort.patrolPoint.clone().add(new THREE.Vector3(
        Math.cos(time * 0.5) * radius,
        Math.sin(time * 0.3) * radius * 0.5,
        Math.sin(time * 0.5) * radius
    ));
    
    // Calculate direction to patrol position
    const direction = new THREE.Vector3().subVectors(patrolPos, escort.position).normalize();
    
    // Apply movement
    const speed = 15;
    escort.velocity.lerp(direction.multiplyScalar(speed), 0.05);
    escort.position.add(escort.velocity.clone().multiplyScalar(deltaTime));
    
    // Update ship group position
    escort.group.position.copy(escort.position);
    
    // Look in direction of movement
    escort.group.lookAt(escort.position.clone().add(escort.velocity));
}

/**
 * Return to patrol behavior
 * @param {Object} escort - Escort fighter object
 * @param {Number} deltaTime - Time delta
 */
function returnToPatrol(escort, deltaTime) {
    // Calculate direction to patrol point
    const direction = new THREE.Vector3().subVectors(escort.patrolPoint, escort.position).normalize();
    
    // Apply movement
    const speed = 20;
    escort.velocity.lerp(direction.multiplyScalar(speed), 0.05);
    escort.position.add(escort.velocity.clone().multiplyScalar(deltaTime));
    
    // Update ship group position
    escort.group.position.copy(escort.position);
    
    // Look in direction of movement
    escort.group.lookAt(escort.position.clone().add(escort.velocity));
    
    // Check if reached patrol point
    if (escort.position.distanceTo(escort.patrolPoint) < 15) {
        escort.escortDuty = "patrol";
    }
}

/**
 * Update visual effects for ships
 * @param {Object} ship - Ship object
 * @param {Number} deltaTime - Time delta
 */
function updateVisualEffects(ship, deltaTime) {
    // Update engine glow
    ship.group.children.forEach(child => {
        if (child instanceof THREE.PointLight) {
            // Thruster flicker effect
            child.intensity = 0.8 + Math.random() * 0.4;
        }
    });
    
    // Update damage effects if damaged
    if (ship.health < ship.maxHealth * 0.5) {
        if (Math.random() > 0.95) {
            createSmokeEffect(ship.position, 0.3);
        }
    }
}

/**
 * Create smoke effect at position
 * @param {THREE.Vector3} position - Position for smoke
 * @param {Number} size - Size multiplier
 * @param {Boolean} persistent - Whether smoke should persist
 */
function createSmokeEffect(position, size = 1, persistent = false) {
    // Create smoke particle
    const smokeGeometry = new THREE.SphereGeometry(0.5 * size, 8, 8);
    const smokeMaterial = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7
    });
    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    
    // Position with slight randomness
    const pos = position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
    ));
    smoke.position.copy(pos);
    
    // Add to scene
    gameState.scene.add(smoke);
    
    // Define initial velocity
    const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2 + 2, // Upward drift
        (Math.random() - 0.5) * 2
    ).multiplyScalar(0.5);
    
    // Animation duration
    const duration = persistent ? 5 + Math.random() * 3 : 2 + Math.random() * 2;
    const expansionRate = 1 + Math.random() * 0.5;
    
    // Animate smoke
    let elapsed = 0;
    function animateSmoke() {
        elapsed += 0.016; // ~60fps
        
        if (elapsed < duration) {
            // Update position
            smoke.position.add(velocity);
            velocity.multiplyScalar(0.98); // Slow down
            
            // Expand smoke
            smoke.scale.multiplyScalar(1 + 0.02 * expansionRate);
            
            // Fade out
            smokeMaterial.opacity = 0.7 * (1 - (elapsed / duration));
            
            requestAnimationFrame(animateSmoke);
        } else {
            // Remove smoke
            gameState.scene.remove(smoke);
        }
    }
    
    animateSmoke();
}

/**
 * Create spark effect at position
 * @param {THREE.Vector3} position - Position for sparks
 */
function createSparkEffect(position) {
    // Number of sparks
    const sparkCount = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < sparkCount; i++) {
        // Create spark
        const sparkGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const sparkMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            emissive: 0xff9900
        });
        const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
        
        // Position with slight randomness
        const pos = position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        ));
        spark.position.copy(pos);
        
        // Add to scene
        gameState.scene.add(spark);
        
        // Add light for glow
        const sparkLight = new THREE.PointLight(0xff9900, 0.5, 2);
        sparkLight.position.copy(spark.position);
        gameState.scene.add(sparkLight);
        
        // Define initial velocity (burst outward)
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        
        // Spark lifetime
        const duration = 0.5 + Math.random() * 0.5;
        
        // Animate spark
        let elapsed = 0;
        function animateSpark() {
            elapsed += 0.016; // ~60fps
            
            if (elapsed < duration) {
                // Update position
                spark.position.add(velocity.clone().multiplyScalar(0.016));
                sparkLight.position.copy(spark.position);
                
                // Slow down
                velocity.multiplyScalar(0.92);
                
                // Fade out
                sparkLight.intensity = 0.5 * (1 - (elapsed / duration));
                
                requestAnimationFrame(animateSpark);
            } else {
                // Remove spark
                gameState.scene.remove(spark);
                gameState.scene.remove(sparkLight);
            }
        }
        
        animateSpark();
    }
}

/**
 * Create fire effect at position
 * @param {THREE.Vector3} position - Position for fire
 * @param {Number} size - Size multiplier
 */
function createFireEffect(position, size = 1) {
    // Create fire particles
    const particleCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < particleCount; i++) {
        // Create fire particle
        const fireGeometry = new THREE.SphereGeometry(0.3 * size, 8, 8);
        const fireMaterial = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xff6600 : 0xff9900,
            transparent: true,
            opacity: 0.8
        });
        const fire = new THREE.Mesh(fireGeometry, fireMaterial);
        
        // Position with slight randomness
        const pos = position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
        ));
        fire.position.copy(pos);
        
        // Add to scene
        gameState.scene.add(fire);
        
        // Add light for glow
        const fireLight = new THREE.PointLight(0xff6600, 1, 3 * size);
        fireLight.position.copy(fire.position);
        gameState.scene.add(fireLight);
        
        // Define initial velocity (upward drift)
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            2 + Math.random() * 2, // Upward
            (Math.random() - 0.5) * 2
        ).multiplyScalar(0.5 * size);
        
        // Animation duration
        const duration = 0.5 + Math.random() * 0.5;
        
        // Animate fire
        let elapsed = 0;
        function animateFire() {
            elapsed += 0.016; // ~60fps
            
            if (elapsed < duration) {
                // Update position
                fire.position.add(velocity.clone().multiplyScalar(0.016));
                fireLight.position.copy(fire.position);
                
                // Slow down
                velocity.multiplyScalar(0.95);
                
                // Fade out
                fireMaterial.opacity = 0.8 * (1 - (elapsed / duration));
                fireLight.intensity = 1 * (1 - (elapsed / duration));
                
                requestAnimationFrame(animateFire);
            } else {
                // Remove fire
                gameState.scene.remove(fire);
                gameState.scene.remove(fireLight);
            }
        }
        
        animateFire();
    }
}

/**
 * Create explosion effect
 * @param {THREE.Vector3} position - Position for explosion
 * @param {Number} size - Size multiplier
 */
function createExplosion(position, size = 1) {
    // Create core explosion
    const coreGeometry = new THREE.SphereGeometry(size, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.copy(position);
    gameState.scene.add(core);
    
    // Add explosion light
    const light = new THREE.PointLight(0xff6600, 5, size * 10);
    light.position.copy(position);
    gameState.scene.add(light);
    
    // Animate core explosion
    const duration = 1;
    let elapsed = 0;
    function animateCore() {
        elapsed += 0.016; // ~60fps
        
        if (elapsed < duration) {
            // Expand core
            const scale = 1 + (elapsed / duration) * 3;
            core.scale.set(scale, scale, scale);
            
            // Fade out
            coreMaterial.opacity = 0.8 * (1 - (elapsed / duration));
            light.intensity = 5 * (1 - (elapsed / duration));
            
            requestAnimationFrame(animateCore);
        } else {
            // Remove core
            gameState.scene.remove(core);
            gameState.scene.remove(light);
        }
    }
    
    animateCore();
    
    // Create secondary explosions
    const secondaryCount = Math.floor(5 * size);
    
    for (let i = 0; i < secondaryCount; i++) {
        // Delay secondary explosions
        setTimeout(() => {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size * 2,
                (Math.random() - 0.5) * size * 2
            );
            const secondaryPosition = position.clone().add(offset);
            
            // Create secondary explosion
            createFireEffect(secondaryPosition, Math.random() * size * 0.5);
            
            // Create debris
            createDebris(secondaryPosition, Math.random() * size * 0.5);
        }, Math.random() * 500);
    }
    
    // Create smoke after explosion
    setTimeout(() => {
        createSmokeEffect(position, size * 2, true);
    }, 300);
}

/**
 * Create debris effect
 * @param {THREE.Vector3} position - Position for debris
 * @param {Number} size - Size multiplier
 */
function createDebris(position, size = 1) {
    const debrisCount = Math.floor(3 + Math.random() * 5);
    
    for (let i = 0; i < debrisCount; i++) {
        // Create debris
        const geometryTypes = [
            new THREE.BoxGeometry(0.5 * size, 0.5 * size, 0.5 * size),
            new THREE.SphereGeometry(0.3 * size, 4, 4),
            new THREE.TetrahedronGeometry(0.4 * size)
        ];
        
        const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            emissive: 0x333333,
            shininess: 30
        });
        
        const debris = new THREE.Mesh(geometry, material);
        debris.position.copy(position);
        
        // Add to scene
        gameState.scene.add(debris);
        
        // Define initial velocity (burst outward)
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
        ).multiplyScalar(size);
        
        // Define rotation
        const rotation = new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        
        // Animation duration
        const duration = 1 + Math.random() * 2;
        
        // Animate debris
        let elapsed = 0;
        function animateDebris() {
            elapsed += 0.016; // ~60fps
            
            if (elapsed < duration) {
                // Update position
                debris.position.add(velocity.clone().multiplyScalar(0.016));
                
                // Update rotation
                debris.rotation.x += rotation.x * 0.016;
                debris.rotation.y += rotation.y * 0.016;
                debris.rotation.z += rotation.z * 0.016;
                
                // Slow down
                velocity.multiplyScalar(0.98);
                rotation.multiplyScalar(0.98);
                
                // Apply gravity
                velocity.y -= 0.1 * size * 0.016;
                
                requestAnimationFrame(animateDebris);
            } else {
                // Remove debris
                gameState.scene.remove(debris);
            }
        }
        
        animateDebris();
    }
}

// Assume createEnemy function already exists in gameState
function createEnemy(gameState, position, type) {
    // This is a placeholder that would call the enemy creation function
    // from the enemy system. In a real implementation, you would import
    // and use that function.
    
    // For now, return a stub enemy object
    return {
        group: new THREE.Group(),
        position: position.clone(),
        rotation: new THREE.Euler(),
        velocity: new THREE.Vector3(),
        health: 50,
        maxHealth: 50,
        isAlive: true,
        
        update: function(deltaTime) {
            // Basic update logic
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
            this.group.position.copy(this.position);
        }
    };
}