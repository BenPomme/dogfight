/**
 * Space Dogfight - Recon Drone
 * 
 * This class implements the reconnaissance drone type which provides scanning and
 * beacon capabilities to enhance the player's awareness of the battlefield.
 */

import * as THREE from 'three';
import Drone, { DroneState, DroneType } from './drone';

class ReconDrone extends Drone {
  constructor(options = {}) {
    // Set drone type to RECON before calling parent constructor
    options.type = DroneType.RECON;
    options.color = options.color || 0x33ff33; // Green color for recon drones
    
    super(options);
    
    // Recon drone specific properties
    this.systems = {
      scanner: {
        name: 'Area Scanner',
        range: options.scanRange || 1000,
        cooldown: options.scanCooldown || 15.0,
        energyCost: 25,
        duration: options.scanDuration || 5.0, // Seconds
        active: false,
        objects: [] // Holds found objects
      },
      beacon: {
        name: 'Nav Beacon',
        range: options.beaconRange || 2000,
        cooldown: options.beaconCooldown || 30.0,
        energyCost: 15,
        duration: options.beaconDuration || 120.0, // Seconds
        active: false,
        position: new THREE.Vector3()
      }
    };
    
    // Energy system
    this.energy = {
      current: options.energy || 100,
      max: options.maxEnergy || 100,
      rechargeRate: options.energyRechargeRate || 5 // Units per second
    };
    
    // Recon parameters
    this.scanActive = false;
    this.scanTimer = 0;
    this.beaconActive = false;
    this.beaconTimer = 0;
    this.scanRadius = this.systems.scanner.range;
    this.scanTarget = null;
    this.scanDuration = 0;
    this.scanResults = [];
    this.maxScanDuration = options.maxScanDuration || 10.0; // Maximum time to spend scanning
    
    // Movement pattern
    this.orbitSpeed = Math.random() * 0.8 + 0.5; // Faster than other drones
    this.orbitRadius = options.orbitRadius || 150; // Farther from target
    this.orbitHeight = options.orbitHeight || 70;
    this.orbitAngle = Math.random() * Math.PI * 2; // Start at random angle
    
    // Create scanner and beacon systems
    this.createReconSystems();
  }
  
  /**
   * Create scanner and beacon systems
   */
  createReconSystems() {
    // Create scanner mesh
    const scannerGeometry = new THREE.RingGeometry(0.8, 1.0, 16);
    const scannerMaterial = new THREE.MeshPhongMaterial({
      color: 0x33ff33,
      emissive: 0x22aa22,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    this.scannerRing = new THREE.Mesh(scannerGeometry, scannerMaterial);
    this.scannerRing.rotation.x = Math.PI / 2;
    this.mesh.add(this.scannerRing);
    
    // Create scan area visualization (pulse that expands)
    const scanAreaGeometry = new THREE.SphereGeometry(1, 16, 16);
    const scanAreaMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    
    this.scanAreaMesh = new THREE.Mesh(scanAreaGeometry, scanAreaMaterial);
    this.group.add(this.scanAreaMesh);
    
    // Create beacon mesh
    const beaconGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
    const beaconMaterial = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      emissive: 0xaa7700,
      shininess: 100
    });
    
    this.beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
    this.beaconMesh.position.set(0, -0.8, 0);
    this.mesh.add(this.beaconMesh);
    
    // Create beacon marker (indicates placed beacon)
    const markerGeometry = new THREE.SphereGeometry(1, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    
    this.beaconMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.beaconMarker.visible = false;
    
    // Add to scene if provided
    if (options && options.scene) {
      options.scene.add(this.beaconMarker);
    }
  }
  
  /**
   * Create visual effects for the drone
   */
  createEffects() {
    super.createEffects();
    
    // Create scanning ray effect
    const rayGeometry = new THREE.BufferGeometry();
    const rayMaterial = new THREE.LineBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    // Create ray vertices
    const rayVertices = [];
    const rayCount = 8;
    
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      
      // Start at drone
      rayVertices.push(0, 0, 0);
      
      // End at perimeter
      rayVertices.push(x * this.scanRadius, 0, z * this.scanRadius);
    }
    
    rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rayVertices, 3));
    
    this.scanRays = new THREE.LineSegments(rayGeometry, rayMaterial);
    this.scanRays.visible = false;
    this.group.add(this.scanRays);
  }
  
  /**
   * Process a command from the voice system
   */
  processCommand(command) {
    // Call parent method
    super.processCommand(command);
    
    // Process recon drone specific commands
    switch(command.action) {
      case 'drone-scan':
        return this.handleScanCommand(command);
        
      case 'drone-beacon':
        return this.handleBeaconCommand(command);
        
      case 'drone-recall':
        return this.handleRecallCommand(command);
        
      case 'drone-all':
        if (command.params.command === 'scan') {
          return this.handleScanCommand(command);
        } else if (command.params.command === 'beacon') {
          return this.handleBeaconCommand(command);
        }
        break;
    }
    
    return false;
  }
  
  /**
   * Handle scan command
   */
  handleScanCommand(command) {
    // Check cooldown
    if (this.isOnCooldown('scanner')) {
      console.log(`Scanner is on cooldown`);
      return false;
    }
    
    // Check energy
    if (this.energy.current < this.systems.scanner.energyCost) {
      console.log(`Not enough energy for scanner`);
      return false;
    }
    
    // Get scan target (default to area around the drone)
    let scanPosition;
    
    if (command.params.areaId === 'current' || !command.params.areaId) {
      scanPosition = this.position.clone();
    } else if (command.params.areaId === 'target' && this.owner && this.owner.target) {
      scanPosition = this.owner.target.position.clone();
    } else if (command.params.areaId === 'owner' && this.owner) {
      scanPosition = this.owner.position.clone();
    } else {
      scanPosition = this.position.clone();
    }
    
    // Set scan target position
    this.scanTarget = scanPosition;
    
    // Set to execute state
    this.setState(DroneState.EXECUTE);
    this.scanDuration = 0;
    
    // Apply cooldown
    this.startCooldown('scanner', this.systems.scanner.cooldown);
    
    // Reduce energy
    this.energy.current -= this.systems.scanner.energyCost;
    
    // Activate scanner
    this.activateScanner();
    
    return true;
  }
  
  /**
   * Handle beacon command
   */
  handleBeaconCommand(command) {
    // Check cooldown
    if (this.isOnCooldown('beacon')) {
      console.log(`Beacon is on cooldown`);
      return false;
    }
    
    // Check energy
    if (this.energy.current < this.systems.beacon.energyCost) {
      console.log(`Not enough energy for beacon`);
      return false;
    }
    
    // Use current position for beacon
    this.systems.beacon.position.copy(this.position);
    
    // Set to execute state
    this.setState(DroneState.EXECUTE);
    
    // Apply cooldown
    this.startCooldown('beacon', this.systems.beacon.cooldown);
    
    // Reduce energy
    this.energy.current -= this.systems.beacon.energyCost;
    
    // Activate beacon
    this.activateBeacon();
    
    return true;
  }
  
  /**
   * Handle recall command
   */
  handleRecallCommand(command) {
    // Deactivate systems
    this.deactivateScanner();
    
    // Don't deactivate beacons - they stay active
    
    // Return to owner
    this.setState(DroneState.RETURN);
    
    return true;
  }
  
  /**
   * Activate scanner
   */
  activateScanner() {
    this.scanActive = true;
    this.scanTimer = 0;
    this.systems.scanner.active = true;
    this.scanResults = [];
    
    // Show scan area and rays
    this.scanAreaMesh.visible = true;
    this.scanAreaMesh.scale.set(0.1, 0.1, 0.1);
    this.scanAreaMesh.material.opacity = 0.7;
    
    this.scanRays.visible = true;
    
    console.log(`Drone ${this.id} activated scanner`);
  }
  
  /**
   * Deactivate scanner
   */
  deactivateScanner() {
    this.scanActive = false;
    this.systems.scanner.active = false;
    
    // Hide scan area and rays
    this.scanAreaMesh.visible = false;
    this.scanRays.visible = false;
    
    console.log(`Drone ${this.id} deactivated scanner`);
    
    // Report scan results if we have any
    if (this.scanResults.length > 0) {
      console.log(`Scan results: ${this.scanResults.length} objects found`);
      
      // In a full implementation, would send findings to HUD or game system
    }
  }
  
  /**
   * Activate beacon
   */
  activateBeacon() {
    this.beaconActive = true;
    this.beaconTimer = 0;
    this.systems.beacon.active = true;
    
    // Position the beacon marker
    this.beaconMarker.position.copy(this.position);
    this.beaconMarker.visible = true;
    this.beaconMarker.scale.set(1, 1, 1);
    
    console.log(`Drone ${this.id} deployed beacon at position:`, this.position);
    
    // In a full implementation, would register the beacon with the navigation system
    // and add it to the HUD or map
  }
  
  /**
   * Deactivate beacon
   */
  deactivateBeacon() {
    this.beaconActive = false;
    this.systems.beacon.active = false;
    
    // Hide beacon marker
    this.beaconMarker.visible = false;
    
    console.log(`Beacon deployed by drone ${this.id} has expired`);
    
    // In a full implementation, would remove the beacon from the navigation system
  }
  
  /**
   * Update execute state behavior
   */
  updateExecuteState(deltaTime) {
    // Handle scan logic when in execute state
    if (this.scanActive) {
      // Update scan timer
      this.scanTimer += deltaTime;
      this.scanDuration += deltaTime;
      
      // Check if scan duration exceeded
      if (this.scanDuration >= this.maxScanDuration) {
        this.deactivateScanner();
        this.setState(DroneState.RETURN);
        return;
      }
      
      // Check if scan time exceeded
      if (this.scanTimer >= this.systems.scanner.duration) {
        // Complete the scan
        this.completeScan();
        return;
      }
      
      // Position drone above scan target
      if (this.scanTarget) {
        const targetPosition = this.scanTarget.clone();
        targetPosition.y += 100; // Hover above scan area
        
        // Set target position
        this.targetPosition.copy(targetPosition);
        
        // Move towards target position
        this.moveTowards(this.targetPosition, 0.8);
        
        // Look down at scan area
        this.lookAt(this.scanTarget);
        
        // Update scan visuals
        this.updateScanVisuals(deltaTime);
      }
    } else {
      // If beacon was just deployed, return to normal behavior
      this.setState(DroneState.RETURN);
    }
  }
  
  /**
   * Complete the scan and process results
   */
  completeScan() {
    console.log(`Drone ${this.id} completed scan`);
    
    // In a full implementation, would collect objects within scan radius
    // and process the results for display to the player
    
    // Simulate finding objects
    this.scanResults = [
      { type: 'asteroid', position: new THREE.Vector3(
        this.scanTarget.x + (Math.random() - 0.5) * 200,
        this.scanTarget.y + (Math.random() - 0.5) * 200,
        this.scanTarget.z + (Math.random() - 0.5) * 200
      )},
      { type: 'ship', position: new THREE.Vector3(
        this.scanTarget.x + (Math.random() - 0.5) * 300,
        this.scanTarget.y + (Math.random() - 0.5) * 300,
        this.scanTarget.z + (Math.random() - 0.5) * 300
      )},
      { type: 'resource', position: new THREE.Vector3(
        this.scanTarget.x + (Math.random() - 0.5) * 150,
        this.scanTarget.y + (Math.random() - 0.5) * 150,
        this.scanTarget.z + (Math.random() - 0.5) * 150
      )}
    ];
    
    // Deactivate scanner
    this.deactivateScanner();
    
    // Return to owner
    this.setState(DroneState.RETURN);
  }
  
  /**
   * Update scan visuals during scanning
   */
  updateScanVisuals(deltaTime) {
    // Update scan area expansion
    const expansionProgress = this.scanTimer / this.systems.scanner.duration;
    const targetScale = expansionProgress * this.scanRadius / 200;
    
    // Expand the scan area
    this.scanAreaMesh.scale.set(targetScale, targetScale, targetScale);
    
    // Pulse the opacity
    const baseOpacity = 0.5 - expansionProgress * 0.3;
    const pulseFrequency = 5 + expansionProgress * 10;
    const pulseOpacity = baseOpacity + Math.sin(Date.now() * 0.01 * pulseFrequency) * 0.2;
    
    this.scanAreaMesh.material.opacity = pulseOpacity;
    
    // Rotate scan rays
    this.scanRays.rotation.y += deltaTime * 0.5;
    
    // Pulse scan rays
    this.scanRays.material.opacity = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    
    // Rotate scanner ring
    this.scannerRing.rotation.z += deltaTime * 2;
  }
  
  /**
   * Update method from parent
   */
  update(deltaTime) {
    super.update(deltaTime);
    
    // Update beacon if active
    if (this.beaconActive) {
      this.beaconTimer += deltaTime;
      
      // Check if beacon duration expired
      if (this.beaconTimer >= this.systems.beacon.duration) {
        this.deactivateBeacon();
      } else {
        // Pulse beacon marker
        const pulseScale = 1 + Math.sin(Date.now() * 0.002) * 0.2;
        this.beaconMarker.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Pulse opacity
        this.beaconMarker.material.opacity = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
        
        // Rotate beacon marker
        this.beaconMarker.rotation.y += deltaTime * 0.2;
      }
    }
  }
  
  /**
   * Update visual effects
   */
  updateEffects(deltaTime) {
    super.updateEffects(deltaTime);
    
    // Pulse scanner ring based on cooldown
    if (this.isOnCooldown('scanner')) {
      const cooldownPercent = this.getCooldownRemaining('scanner') / this.systems.scanner.cooldown;
      
      // Fade from dim to bright as cooldown progresses
      const intensity = 1 - cooldownPercent;
      this.scannerRing.material.emissive.setRGB(0, intensity * 0.5, 0);
      
      // Rotate slower during cooldown
      this.scannerRing.rotation.z += deltaTime * 0.5;
    } else if (!this.scanActive) {
      // Ready to use - normal glow
      this.scannerRing.material.emissive.setRGB(0, 0.5, 0);
      
      // Normal rotation speed
      this.scannerRing.rotation.z += deltaTime * 1.5;
    }
    
    // Pulse beacon mesh based on cooldown
    if (this.isOnCooldown('beacon')) {
      const cooldownPercent = this.getCooldownRemaining('beacon') / this.systems.beacon.cooldown;
      
      // Fade from dim to bright as cooldown progresses
      const intensity = 1 - cooldownPercent;
      this.beaconMesh.material.emissive.setRGB(intensity * 0.5, intensity * 0.3, 0);
    } else {
      // Ready to use - normal glow
      this.beaconMesh.material.emissive.setRGB(0.5, 0.3, 0);
    }
  }
}

export default ReconDrone;