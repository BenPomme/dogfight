// Environment Effects for Space Dogfight
// This module adds visual effects to enhance the space environment

// Initialize environment effects
export function initEnvironmentEffects(scene) {
    // Create all environment effects
    createNebula(scene);
    createDustParticles(scene);
    createDistantStars(scene);
    createBackgroundPlanets(scene);
    
    // Return controller for updating effects
    return {
        update: (deltaTime, playerPosition) => {
            updateEnvironmentEffects(scene, deltaTime, playerPosition);
        }
    };
}

// Create a colorful nebula
function createNebula(scene) {
    // Create nebula group to hold all elements
    const nebulaGroup = new THREE.Group();
    nebulaGroup.name = "nebula";
    
    // Generate random color theme for nebula
    const nebulaColors = generateNebulaColorTheme();
    
    // Create cloud particles
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Create nebula volumes (several cloud clusters)
    const volumeCount = 3 + Math.floor(Math.random() * 3);
    const volumeCenters = [];
    
    for (let i = 0; i < volumeCount; i++) {
        // Random position for this nebula volume
        const volume = {
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 400
            ),
            radius: 50 + Math.random() * 100,
            density: 0.5 + Math.random() * 0.5,
            colorIndex: Math.floor(Math.random() * nebulaColors.length)
        };
        
        volumeCenters.push(volume);
    }
    
    // Fill particles based on nebula volumes
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Choose a random volume to place this particle in
        const volumeIndex = Math.floor(Math.random() * volumeCenters.length);
        const volume = volumeCenters[volumeIndex];
        
        // Random position within the volume (using gaussian-like distribution)
        const dist = Math.pow(Math.random(), 1/volume.density) * volume.radius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        particlePositions[i3] = volume.position.x + dist * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = volume.position.y + dist * Math.sin(phi) * Math.sin(theta);
        particlePositions[i3 + 2] = volume.position.z + dist * Math.cos(phi);
        
        // Random size based on distance from volume center
        const distanceRatio = dist / volume.radius;
        particleSizes[i] = (1 - Math.pow(distanceRatio, 2)) * (4 + Math.random() * 6);
        
        // Color from the volume's color theme
        const color = nebulaColors[volume.colorIndex];
        const colorVariation = 0.2; // Allow some color variation
        
        particleColors[i3] = color.r * (1 - colorVariation + Math.random() * colorVariation * 2);
        particleColors[i3 + 1] = color.g * (1 - colorVariation + Math.random() * colorVariation * 2);
        particleColors[i3 + 2] = color.b * (1 - colorVariation + Math.random() * colorVariation * 2);
    }
    
    // Create attributes
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    // Custom shader material for nebula particles
    const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform float time;
            
            void main() {
                vColor = color;
                
                // Subtle movement based on time
                vec3 pos = position;
                float waveFactor = sin(time * 0.05 + position.x * 0.01 + position.y * 0.01 + position.z * 0.01) * 2.0;
                pos.x += waveFactor;
                pos.y += waveFactor * 0.5;
                pos.z += waveFactor * 0.7;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                // Create soft, cloudy particles
                float r = length(gl_PointCoord - vec2(0.5, 0.5));
                if (r > 0.5) discard;
                
                // Soft edge
                float alpha = smoothstep(0.5, 0.0, r);
                gl_FragColor = vec4(vColor, alpha * 0.3); // Low opacity for layered effect
            }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    });
    
    // Create particles
    const nebulaParticles = new THREE.Points(particleGeometry, nebulaMaterial);
    nebulaGroup.add(nebulaParticles);
    
    // Add illumination using point lights
    const lightCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < lightCount; i++) {
        const volume = volumeCenters[Math.floor(Math.random() * volumeCenters.length)];
        const color = nebulaColors[volume.colorIndex];
        
        // Create point light
        const intensity = 0.2 + Math.random() * 0.3;
        const nebulaLight = new THREE.PointLight(
            new THREE.Color(color.r, color.g, color.b),
            intensity,
            volume.radius * 2
        );
        
        // Position within the volume
        const dist = Math.random() * volume.radius * 0.7;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        nebulaLight.position.set(
            volume.position.x + dist * Math.sin(phi) * Math.cos(theta),
            volume.position.y + dist * Math.sin(phi) * Math.sin(theta),
            volume.position.z + dist * Math.cos(phi)
        );
        
        nebulaGroup.add(nebulaLight);
    }
    
    // Store data for animation
    nebulaGroup.userData = {
        time: 0,
        volumeCenters: volumeCenters
    };
    
    // Add to scene
    scene.add(nebulaGroup);
}

// Generate a color theme for nebulae
function generateNebulaColorTheme() {
    // Predefined nebula color themes
    const themes = [
        // Purple and blue nebula
        [
            {r: 0.5, g: 0.2, b: 0.8},
            {r: 0.2, g: 0.4, b: 0.9},
            {r: 0.4, g: 0.2, b: 0.6}
        ],
        // Red and orange nebula
        [
            {r: 0.8, g: 0.2, b: 0.2},
            {r: 0.9, g: 0.4, b: 0.1},
            {r: 0.6, g: 0.2, b: 0.3}
        ],
        // Blue and cyan nebula
        [
            {r: 0.1, g: 0.4, b: 0.8},
            {r: 0.2, g: 0.6, b: 0.9},
            {r: 0.1, g: 0.3, b: 0.6}
        ],
        // Green and yellow nebula
        [
            {r: 0.2, g: 0.6, b: 0.3},
            {r: 0.5, g: 0.7, b: 0.1},
            {r: 0.3, g: 0.5, b: 0.2}
        ],
        // Pink and purple nebula
        [
            {r: 0.8, g: 0.3, b: 0.6},
            {r: 0.6, g: 0.1, b: 0.7},
            {r: 0.9, g: 0.4, b: 0.5}
        ]
    ];
    
    // Pick a random theme
    return themes[Math.floor(Math.random() * themes.length)];
}

// Create dust particles that move as player flies through them
function createDustParticles(scene) {
    // Create particle group
    const dustGroup = new THREE.Group();
    dustGroup.name = "spaceDust";
    
    // Define dust field size
    const fieldSize = 300;
    const particleCount = 2000;
    
    // Create geometry
    const dustGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    
    // Fill with random positions within the field
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions[i3] = (Math.random() - 0.5) * fieldSize;
        positions[i3 + 1] = (Math.random() - 0.5) * fieldSize;
        positions[i3 + 2] = (Math.random() - 0.5) * fieldSize;
        
        // Random size
        sizes[i] = 0.1 + Math.random() * 0.5;
        
        // Colors (subtle variations of white/gray)
        const brightness = 0.7 + Math.random() * 0.3;
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
    }
    
    // Set attributes
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create shader material
    const dustMaterial = new THREE.ShaderMaterial({
        uniforms: {
            playerPosition: { value: new THREE.Vector3(0, 0, 0) },
            fieldSize: { value: fieldSize / 2 }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            uniform vec3 playerPosition;
            uniform float fieldSize;
            
            void main() {
                vColor = color;
                
                // Calculate position relative to player
                vec3 pos = position;
                
                // Wrap around if too far from player (create infinite field)
                vec3 relativePos = pos - playerPosition;
                
                // Wrap in X direction
                if (relativePos.x < -fieldSize) {
                    pos.x += fieldSize * 2.0;
                } else if (relativePos.x > fieldSize) {
                    pos.x -= fieldSize * 2.0;
                }
                
                // Wrap in Y direction
                if (relativePos.y < -fieldSize) {
                    pos.y += fieldSize * 2.0;
                } else if (relativePos.y > fieldSize) {
                    pos.y -= fieldSize * 2.0;
                }
                
                // Wrap in Z direction
                if (relativePos.z < -fieldSize) {
                    pos.z += fieldSize * 2.0;
                } else if (relativePos.z > fieldSize) {
                    pos.z -= fieldSize * 2.0;
                }
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (100.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            
            void main() {
                // Softer particles
                float r = length(gl_PointCoord - vec2(0.5, 0.5));
                if (r > 0.5) discard;
                
                float alpha = smoothstep(0.5, 0.0, r) * 0.3;
                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    
    // Create points
    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    dustGroup.add(dustParticles);
    
    // Store field size for update function
    dustGroup.userData = {
        fieldSize: fieldSize / 2
    };
    
    // Add to scene
    scene.add(dustGroup);
}

// Create distant background stars
function createDistantStars(scene) {
    // We'll create very large, colorful stars in the far distance
    const starCount = 50;
    const starGroup = new THREE.Group();
    starGroup.name = "distantStars";
    
    // Define star colors
    const starColors = [
        0xffdddd, // Red giant
        0xddddff, // Blue giant
        0xffffdd, // Yellow 
        0xddffdd, // Green/white
        0xffddff  // Magenta/white
    ];
    
    for (let i = 0; i < starCount; i++) {
        // Create geometry - slightly randomized for variety
        const starType = Math.floor(Math.random() * 3);
        let starGeometry;
        
        switch (starType) {
            case 0: // Sphere
                const size = 2 + Math.random() * 6;
                starGeometry = new THREE.SphereGeometry(size, 16, 16);
                break;
                
            case 1: // Octahedron (diamond shape)
                const octaSize = 3 + Math.random() * 6;
                starGeometry = new THREE.OctahedronGeometry(octaSize);
                break;
                
            case 2: // Icosahedron (more complex)
                const icoSize = 2 + Math.random() * 5;
                starGeometry = new THREE.IcosahedronGeometry(icoSize, 0);
                break;
        }
        
        // Create emissive material
        const colorIndex = Math.floor(Math.random() * starColors.length);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: starColors[colorIndex],
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3
        });
        
        const star = new THREE.Mesh(starGeometry, starMaterial);
        
        // Position at far distance
        const distance = 800 + Math.random() * 200;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        
        star.position.set(
            distance * Math.sin(theta) * Math.cos(phi),
            distance * Math.sin(theta) * Math.sin(phi),
            distance * Math.cos(theta)
        );
        
        // Add glow effect
        const glowSize = starGeometry.parameters.radius * (2 + Math.random());
        const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: starColors[colorIndex],
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        star.add(glowMesh);
        
        // Add light effect
        const starLight = new THREE.PointLight(starColors[colorIndex], 0.2, 200);
        star.add(starLight);
        
        // Animation properties
        star.userData = {
            rotationSpeed: (Math.random() - 0.5) * 0.01,
            pulseSpeed: 0.3 + Math.random() * 0.5,
            pulseAmount: 0.1 + Math.random() * 0.1,
            initialOpacity: starMaterial.opacity,
            time: Math.random() * 10
        };
        
        starGroup.add(star);
    }
    
    // Add to scene
    scene.add(starGroup);
}

// Create distant planets and celestial objects
function createBackgroundPlanets(scene) {
    const planetCount = 2 + Math.floor(Math.random() * 3);
    const planetGroup = new THREE.Group();
    planetGroup.name = "backgroundPlanets";
    
    // Create them one by one
    for (let i = 0; i < planetCount; i++) {
        createRandomPlanet(planetGroup);
    }
    
    // Add to scene
    scene.add(planetGroup);
}

// Create a random planet
function createRandomPlanet(parentGroup) {
    // Choose planet type
    const planetType = Math.floor(Math.random() * 6);
    
    // Base planet size
    const planetSize = 20 + Math.random() * 40;
    
    // Create geometry
    const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
    
    // Create material based on planet type
    let planetMaterial;
    
    switch (planetType) {
        case 0: // Earth-like
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0x2255aa,
                emissive: 0x002244,
                specular: 0x333333,
                shininess: 10
            });
            break;
            
        case 1: // Mars-like
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0xaa5522,
                emissive: 0x441100,
                specular: 0x111111,
                shininess: 5
            });
            break;
            
        case 2: // Gas giant
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0xddbb44,
                emissive: 0x332200,
                specular: 0x555555,
                shininess: 30
            });
            break;
            
        case 3: // Ice planet
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaddff,
                emissive: 0x223344,
                specular: 0xffffff,
                shininess: 70
            });
            break;
            
        case 4: // Molten planet
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0xff3300,
                emissive: 0x661100,
                specular: 0xff8866,
                shininess: 40
            });
            break;
            
        case 5: // Alien planet
            planetMaterial = new THREE.MeshPhongMaterial({
                color: 0x33cc66,
                emissive: 0x114422,
                specular: 0x77ff99,
                shininess: 20
            });
            break;
    }
    
    // Create planet mesh
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    
    // Position far away
    const distance = 500 + Math.random() * 300;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    
    planet.position.set(
        distance * Math.sin(theta) * Math.cos(phi),
        distance * Math.sin(theta) * Math.sin(phi),
        distance * Math.cos(theta)
    );
    
    // Random rotation
    planet.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
    );
    
    // Add atmospheric glow for some planets
    if (Math.random() > 0.5) {
        const atmosphereSize = planetSize * 1.2;
        const atmosphereGeometry = new THREE.SphereGeometry(atmosphereSize, 32, 32);
        
        // Create atmosphere based on planet type
        let atmosphereColor;
        
        switch (planetType) {
            case 0: // Earth-like (blue)
                atmosphereColor = 0x88bbff;
                break;
            case 1: // Mars-like (reddish)
                atmosphereColor = 0xffbb88;
                break;
            case 2: // Gas giant (yellowish)
                atmosphereColor = 0xffffaa;
                break;
            case 3: // Ice planet (pale blue)
                atmosphereColor = 0xaaddff;
                break;
            case 4: // Molten planet (orange)
                atmosphereColor = 0xff9955;
                break;
            case 5: // Alien planet (green)
                atmosphereColor = 0xaaffbb;
                break;
        }
        
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: atmosphereColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);
    }
    
    // Add rings for some planets (like Saturn)
    if (planetType === 2 && Math.random() > 0.5) {
        const ringGeometry = new THREE.RingGeometry(planetSize * 1.5, planetSize * 2.5, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xddccaa,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Align with xy plane
        ring.rotation.z = Math.random() * Math.PI / 4; // Slight tilt
        planet.add(ring);
    }
    
    // Chance to add moons
    const moonCount = Math.floor(Math.random() * 3);
    
    for (let j = 0; j < moonCount; j++) {
        const moonSize = planetSize * (0.1 + Math.random() * 0.2);
        const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
        const moonMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            emissive: 0x222222,
            specular: 0x555555,
            shininess: 10
        });
        
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        
        // Create moon orbit
        const orbitRadius = planetSize * (2 + Math.random());
        const moonGroup = new THREE.Group();
        moon.position.set(orbitRadius, 0, 0);
        moonGroup.add(moon);
        
        // Random orbit angles
        moonGroup.rotation.x = Math.random() * Math.PI;
        moonGroup.rotation.z = Math.random() * Math.PI;
        
        planet.add(moonGroup);
        
        // Store moon data for animation
        moonGroup.userData = {
            rotationSpeed: 0.1 + Math.random() * 0.2
        };
    }
    
    // Store planet data for animation
    planet.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.01
    };
    
    // Add to parent
    parentGroup.add(planet);
    
    return planet;
}

// Update all environment effects
function updateEnvironmentEffects(scene, deltaTime, playerPosition) {
    // Update nebula
    const nebula = scene.getObjectByName("nebula");
    if (nebula) {
        // Update time uniform for animation
        nebula.userData.time += deltaTime;
        
        // Update shader uniforms
        const nebulaPoints = nebula.children.find(child => child instanceof THREE.Points);
        if (nebulaPoints && nebulaPoints.material.uniforms) {
            nebulaPoints.material.uniforms.time.value = nebula.userData.time;
        }
        
        // Animate nebula lights
        nebula.children.filter(child => child instanceof THREE.PointLight).forEach(light => {
            // Subtle pulse effect for intensity
            const pulseSpeed = 0.2 + Math.random() * 0.3;
            const originalIntensity = light.userData.originalIntensity || light.intensity;
            
            if (!light.userData.originalIntensity) {
                light.userData.originalIntensity = light.intensity;
            }
            
            light.intensity = originalIntensity * (0.8 + Math.sin(nebula.userData.time * pulseSpeed) * 0.2);
        });
    }
    
    // Update dust particles
    const spaceDust = scene.getObjectByName("spaceDust");
    if (spaceDust && playerPosition) {
        const dustPoints = spaceDust.children.find(child => child instanceof THREE.Points);
        if (dustPoints && dustPoints.material.uniforms) {
            dustPoints.material.uniforms.playerPosition.value.copy(playerPosition);
        }
    }
    
    // Update distant stars
    const distantStars = scene.getObjectByName("distantStars");
    if (distantStars) {
        distantStars.children.forEach(star => {
            if (star.userData) {
                // Update time
                star.userData.time += deltaTime;
                
                // Rotate star
                star.rotation.x += star.userData.rotationSpeed * deltaTime;
                star.rotation.y += star.userData.rotationSpeed * deltaTime * 0.7;
                
                // Pulse effect
                const pulse = Math.sin(star.userData.time * star.userData.pulseSpeed) * star.userData.pulseAmount;
                const newOpacity = star.userData.initialOpacity * (1 + pulse);
                star.material.opacity = newOpacity;
                
                // Pulse light intensity too
                const starLight = star.children.find(child => child instanceof THREE.PointLight);
                if (starLight) {
                    starLight.intensity = 0.2 * (1 + pulse);
                }
            }
        });
    }
    
    // Update background planets
    const backgroundPlanets = scene.getObjectByName("backgroundPlanets");
    if (backgroundPlanets) {
        backgroundPlanets.children.forEach(planet => {
            if (planet.userData) {
                // Rotate planet
                planet.rotation.y += planet.userData.rotationSpeed * deltaTime;
                
                // Update moons
                planet.children.forEach(child => {
                    if (child instanceof THREE.Group && child.userData && child.userData.rotationSpeed) {
                        child.rotation.y += child.userData.rotationSpeed * deltaTime;
                    }
                });
            }
        });
    }
}

// Export environment-related functions
export {
    createNebula,
    createDustParticles,
    createDistantStars,
    createBackgroundPlanets
};