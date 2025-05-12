/**
 * Space Dogfight - Camera System
 * 
 * This class handles the game camera, implementing a smooth-following third-person camera.
 */

import * as THREE from 'three';

export default class Camera {
  constructor(aspect = 1) {
    // Camera configuration
    this.fov = 75;
    this.near = 0.1;
    this.far = 10000;
    this.distance = 15;
    this.height = 5;
    this.smoothing = 0.1;
    this.lookAhead = 2;
    
    // Create perspective camera
    this.instance = new THREE.PerspectiveCamera(this.fov, aspect, this.near, this.far);
    this.instance.position.set(0, this.height, this.distance);
    
    // Target to follow
    this.target = null;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    
    // Camera offset (in target's local space)
    this.offset = new THREE.Vector3(0, this.height, this.distance);
    
    // Setup zoom
    this.minZoom = 5;
    this.maxZoom = 30;
    this.zoomLevel = this.distance;
    this.zoomSpeed = 2;
  }
  
  /**
   * Set the target for the camera to follow
   */
  setTarget(target) {
    this.target = target;
    
    if (target) {
      // Initialize target position and rotation
      this.targetPosition.copy(target.position);
      if (target.rotation) {
        this.targetRotation.copy(target.rotation);
      }
    }
  }
  
  /**
   * Handle window resize
   */
  onResize(aspect) {
    this.instance.aspect = aspect;
    this.instance.updateProjectionMatrix();
  }
  
  /**
   * Adjust camera zoom
   */
  zoom(delta) {
    this.zoomLevel += delta * this.zoomSpeed;
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxLevel, this.zoomLevel));
    
    // Update offset distance
    this.offset.z = this.zoomLevel;
  }
  
  /**
   * Apply camera shake effect
   */
  shake(intensity = 0.5, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsedTime = 0;
    this.isShaking = true;
  }
  
  /**
   * Update camera shake
   */
  updateShake(deltaTime) {
    if (!this.isShaking) return;
    
    this.shakeElapsedTime += deltaTime;
    
    if (this.shakeElapsedTime >= this.shakeDuration) {
      this.isShaking = false;
      return;
    }
    
    // Calculate shake amount based on remaining time
    const remainingTime = this.shakeDuration - this.shakeElapsedTime;
    const intensity = this.shakeIntensity * (remainingTime / this.shakeDuration);
    
    // Apply random offset to camera position
    this.instance.position.x += (Math.random() - 0.5) * intensity;
    this.instance.position.y += (Math.random() - 0.5) * intensity;
    this.instance.position.z += (Math.random() - 0.5) * intensity;
  }
  
  /**
   * Update camera position and rotation
   */
  update(deltaTime) {
    if (!this.target) return;
    
    // Get target position and rotation
    const targetPosition = this.target.position || this.target.getWorldPosition(new THREE.Vector3());
    let targetRotation = this.target.rotation;
    
    // Update target info
    this.targetPosition.copy(targetPosition);
    if (targetRotation) {
      this.targetRotation.copy(targetRotation);
    }
    
    // Calculate look-ahead position based on target rotation
    const lookAheadVector = new THREE.Vector3(0, 0, -this.lookAhead);
    lookAheadVector.applyEuler(this.targetRotation);
    const lookAtPosition = this.targetPosition.clone().add(lookAheadVector);
    
    // Calculate ideal camera position in world space
    // This positions the camera behind and slightly above the target
    const idealOffset = this.offset.clone();
    idealOffset.applyEuler(this.targetRotation);
    const idealPosition = this.targetPosition.clone().add(idealOffset);
    
    // Apply smoothing to camera position
    this.instance.position.lerp(idealPosition, this.smoothing);
    
    // Make camera look at the look-ahead position
    this.instance.lookAt(lookAtPosition);
    
    // Update camera shake
    this.updateShake(deltaTime);
  }
  
  /**
   * Get the camera's forward direction
   */
  getForwardDirection() {
    const direction = new THREE.Vector3();
    this.instance.getWorldDirection(direction);
    return direction;
  }
  
  /**
   * Get the camera's right direction
   */
  getRightDirection() {
    const forward = this.getForwardDirection();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
  }
  
  /**
   * Get the camera's up direction
   */
  getUpDirection() {
    const forward = this.getForwardDirection();
    const right = this.getRightDirection();
    const up = new THREE.Vector3();
    up.crossVectors(right, forward).normalize();
    return up;
  }
}