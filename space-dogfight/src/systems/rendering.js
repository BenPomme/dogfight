/**
 * Space Dogfight - Renderer System
 * 
 * This class manages the rendering of the game using Three.js.
 */

import * as THREE from 'three';
import Stats from 'stats.js';

export default class Renderer {
  constructor(canvas, scene) {
    this.scene = scene;
    // If canvas is provided, use it; otherwise, let Three.js create it
    if (canvas) {
      this.instance = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false
      });
    } else {
      this.instance = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
      });
    }
    
    // Configure renderer
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.instance.outputEncoding = THREE.sRGBEncoding;
    this.instance.physicallyCorrectLights = true;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
    this.instance.setClearColor(0x000010); // Dark blue space background
    
    // Post-processing (to be implemented)
    this.postProcessing = {
      enabled: false
    };
    
    // Performance monitor
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    
    // Add stats panel to DOM if in development mode
    if (process.env.NODE_ENV === 'development') {
      document.getElementById('stats').appendChild(this.stats.dom);
    }
    
    // Space environment effects
    this.createStarfield();
  }
  
  /**
   * Create a starfield background
   */
  createStarfield() {
    // Create star particles
    const starCount = 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    // Generate random positions for stars
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Position stars in a large sphere around the center
      const radius = 1000 + Math.random() * 3000;
      const phi = Math.acos(-1 + Math.random() * 2);
      const theta = Math.random() * Math.PI * 2;
      
      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = radius * Math.cos(phi);
      
      // Randomize star sizes
      starSizes[i] = Math.random() * 2 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    
    // Create stars mesh
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
    
    // Add distant nebula (simple colored fog)
    this.scene.fog = new THREE.FogExp2(0x000033, 0.00025);
  }
  
  /**
   * Handle window resize
   */
  onResize() {
    // Update renderer size
    this.instance.setSize(window.innerWidth, window.innerHeight);
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  
  /**
   * Get the current aspect ratio
   */
  getAspect() {
    return window.innerWidth / window.innerHeight;
  }
  
  /**
   * Create a muzzle flash effect at the specified position
   */
  createMuzzleFlash(position, color = 0xff8844, duration = 0.1) {
    // Create point light for muzzle flash
    const light = new THREE.PointLight(color, 2, 10);
    light.position.copy(position);
    this.scene.add(light);
    
    // Remove after duration
    setTimeout(() => {
      this.scene.remove(light);
    }, duration * 1000);
  }
  
  /**
   * Create an explosion effect at the specified position
   */
  createExplosion(position, scale = 1, color = 0xff5500) {
    // Create particle system for explosion
    const particleCount = 50 * scale;
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      color: color,
      size: 2,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    
    // Create particles
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start at explosion center
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      // Random velocity direction
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 20 * scale,
        (Math.random() - 0.5) * 20 * scale,
        (Math.random() - 0.5) * 20 * scale
      );
      velocities.push(velocity);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Create particle system
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Create explosion light
    const light = new THREE.PointLight(color, 5 * scale, 20 * scale);
    light.position.copy(position);
    this.scene.add(light);
    
    // Animate explosion
    const duration = 1.5;
    let time = 0;
    
    const explosionInterval = setInterval(() => {
      time += 1 / 60; // Approximately 60fps
      
      // Update particle positions
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Move particles outward
        positions[i3] += velocities[i].x * (1 - time / duration);
        positions[i3 + 1] += velocities[i].y * (1 - time / duration);
        positions[i3 + 2] += velocities[i].z * (1 - time / duration);
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Fade out particles and light
      const fadeProgress = time / duration;
      particles.material.opacity = 1 - fadeProgress;
      light.intensity = 5 * scale * (1 - fadeProgress);
      
      // Remove when animation is complete
      if (time >= duration) {
        clearInterval(explosionInterval);
        this.scene.remove(particles);
        this.scene.remove(light);
      }
    }, 1000 / 60);
  }
  
  /**
   * Create a laser projectile
   */
  createLaser(origin, direction, color = 0xff0000, speed = 500, range = 1000) {
    // Create laser geometry (cylinder pointing in the direction)
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    geometry.rotateX(Math.PI / 2); // Align with Z axis
    
    // Create laser material with glow
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    // Create laser mesh
    const laser = new THREE.Mesh(geometry, material);
    laser.position.copy(origin);
    
    // Set direction
    laser.lookAt(origin.clone().add(direction));
    
    // Add to scene
    this.scene.add(laser);
    
    // Create point light for glow effect
    const light = new THREE.PointLight(color, 1, 5);
    light.position.copy(origin);
    this.scene.add(light);
    
    // Setup physics properties
    const laserObject = {
      mesh: laser,
      light: light,
      velocity: direction.clone().normalize().multiplyScalar(speed),
      distance: 0,
      maxDistance: range,
      update: (deltaTime) => {
        // Move laser
        const movement = laserObject.velocity.clone().multiplyScalar(deltaTime);
        laser.position.add(movement);
        light.position.copy(laser.position);
        
        // Increase traveled distance
        laserObject.distance += movement.length();
        
        // Remove if range exceeded
        if (laserObject.distance >= laserObject.maxDistance) {
          return true; // Return true to remove
        }
        
        return false; // Keep updating
      },
      remove: () => {
        this.scene.remove(laser);
        this.scene.remove(light);
      }
    };
    
    return laserObject;
  }
  
  /**
   * Create a missile projectile
   */
  createMissile(origin, direction, color = 0xff8800, speed = 200) {
    // Create missile geometry
    const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 8);
    bodyGeometry.rotateX(Math.PI / 2); // Align with Z axis
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Create missile group
    const missile = new THREE.Group();
    missile.add(body);
    missile.position.copy(origin);
    
    // Set direction
    missile.lookAt(origin.clone().add(direction));
    
    // Add engine glow
    const engineLight = new THREE.PointLight(color, 1, 3);
    engineLight.position.set(0, 0, 0.6); // Position at rear of missile
    missile.add(engineLight);
    
    // Add to scene
    this.scene.add(missile);
    
    // Setup physics properties
    const missileObject = {
      mesh: missile,
      velocity: direction.clone().normalize().multiplyScalar(speed),
      acceleration: 20, // Missiles accelerate over time
      maxSpeed: speed * 2,
      target: null,
      update: (deltaTime) => {
        // Increase speed
        const accelerationVector = missileObject.velocity.clone().normalize().multiplyScalar(missileObject.acceleration * deltaTime);
        missileObject.velocity.add(accelerationVector);
        
        // Limit to max speed
        const currentSpeed = missileObject.velocity.length();
        if (currentSpeed > missileObject.maxSpeed) {
          missileObject.velocity.normalize().multiplyScalar(missileObject.maxSpeed);
        }
        
        // Track target if set
        if (missileObject.target && missileObject.target.position) {
          // Calculate direction to target
          const toTarget = missileObject.target.position.clone().sub(missile.position).normalize();
          
          // Gradually steer towards target
          const steeringStrength = 0.1;
          const steeringForce = toTarget.multiplyScalar(steeringStrength);
          
          // Apply steering
          missileObject.velocity.lerp(missileObject.velocity.clone().add(steeringForce).normalize().multiplyScalar(currentSpeed), 0.1);
          
          // Update missile orientation
          missile.lookAt(missile.position.clone().add(missileObject.velocity));
        }
        
        // Move missile
        missile.position.add(missileObject.velocity.clone().multiplyScalar(deltaTime));
        
        // Create engine trail effect
        if (Math.random() > 0.5) {
          this.createSmokeParticle(
            missile.localToWorld(new THREE.Vector3(0, 0, 0.6)),
            color,
            0.5
          );
        }
        
        return false; // Keep updating
      },
      remove: () => {
        this.scene.remove(missile);
        this.createExplosion(missile.position, 0.5, color);
      }
    };
    
    return missileObject;
  }
  
  /**
   * Create a smoke particle for trails
   */
  createSmokeParticle(position, color = 0xaaaaaa, size = 1) {
    // Create particle
    const geometry = new THREE.SphereGeometry(size * 0.2, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);
    this.scene.add(particle);
    
    // Animate fade out
    const duration = 0.5;
    let time = 0;
    
    const interval = setInterval(() => {
      time += 1 / 60;
      
      // Expand and fade
      const progress = time / duration;
      particle.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
      particle.material.opacity = 0.4 * (1 - progress);
      
      // Remove when animation complete
      if (time >= duration) {
        clearInterval(interval);
        this.scene.remove(particle);
      }
    }, 1000 / 60);
  }
  
  /**
   * Render the scene
   */
  render(scene, camera) {
    this.stats.begin();
    
    // Update starfield
    if (this.stars) {
      this.stars.rotation.y += 0.0001;
    }
    
    // Render the scene
    this.instance.render(scene, camera);
    
    this.stats.end();
  }
}