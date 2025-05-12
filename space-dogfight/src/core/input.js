/**
 * Space Dogfight - Input System
 * 
 * Handles keyboard and mouse input for controlling the spaceship.
 */

export default class Input {
  constructor(canvas) {
    // Store canvas reference for mouse position calculations
    this.canvas = canvas;
    
    // Input state
    this.keys = {};
    this.mousePosition = { x: 0, y: 0 };
    this.mouseButtons = { left: false, right: false, middle: false };
    this.mouseWheelDelta = 0;
    
    // Movement state calculated from input
    this.movement = {
      forward: 0,  // W/S keys (-1 to 1)
      right: 0,    // A/D keys (-1 to 1)
      up: 0,       // Q/Z keys (-1 to 1)
      boost: false, // E key
      brake: false  // R key
    };
    
    // Normalized mouse position (-1 to 1)
    this.aim = { x: 0, y: 0 };
    
    // Setup event listeners
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('wheel', this.onMouseWheel.bind(this));
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Define key mappings
    this.keyMap = {
      'KeyW': 'forward',
      'KeyS': 'backward',
      'KeyA': 'left',
      'KeyD': 'right',
      'KeyQ': 'up',
      'KeyZ': 'down',
      'KeyE': 'boost',
      'KeyR': 'brake',
      'Space': 'fire',
      'Tab': 'scoreboard',
      'Escape': 'pause'
    };
  }
  
  /**
   * Handle key down events
   */
  onKeyDown(event) {
    this.keys[event.code] = true;
  }
  
  /**
   * Handle key up events
   */
  onKeyUp(event) {
    this.keys[event.code] = false;
  }
  
  /**
   * Handle mouse move events
   */
  onMouseMove(event) {
    // Calculate mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Store raw mouse position
    this.mousePosition.x = x;
    this.mousePosition.y = y;
    
    // Calculate normalized position (-1 to 1)
    this.aim.x = (x / this.canvas.clientWidth) * 2 - 1;
    this.aim.y = -((y / this.canvas.clientHeight) * 2 - 1); // Y is inverted in WebGL
  }
  
  /**
   * Handle mouse down events
   */
  onMouseDown(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouseButtons.left = true;
        break;
      case 1: // Middle button
        this.mouseButtons.middle = true;
        break;
      case 2: // Right button
        this.mouseButtons.right = true;
        break;
    }
  }
  
  /**
   * Handle mouse up events
   */
  onMouseUp(event) {
    switch (event.button) {
      case 0: // Left button
        this.mouseButtons.left = false;
        break;
      case 1: // Middle button
        this.mouseButtons.middle = false;
        break;
      case 2: // Right button
        this.mouseButtons.right = false;
        break;
    }
  }
  
  /**
   * Handle mouse wheel events
   */
  onMouseWheel(event) {
    this.mouseWheelDelta = Math.sign(event.deltaY);
    
    // Reset after one frame
    setTimeout(() => {
      this.mouseWheelDelta = 0;
    }, 50);
  }
  
  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(keyCode) {
    return this.keys[keyCode] === true;
  }
  
  /**
   * Update the input state
   * Called every frame to calculate movement vectors
   */
  update() {
    // Calculate movement based on WASD keys
    this.movement.forward = 0;
    if (this.keys['KeyW']) this.movement.forward += 1;
    if (this.keys['KeyS']) this.movement.forward -= 1;
    
    this.movement.right = 0;
    if (this.keys['KeyD']) this.movement.right += 1;
    if (this.keys['KeyA']) this.movement.right -= 1;
    
    this.movement.up = 0;
    if (this.keys['KeyQ']) this.movement.up += 1;
    if (this.keys['KeyZ']) this.movement.up -= 1;
    
    // Boost and brake
    this.movement.boost = this.keys['KeyE'] === true;
    this.movement.brake = this.keys['KeyR'] === true;
  }
  
  /**
   * Get the current movement input vector
   */
  getMovement() {
    return this.movement;
  }
  
  /**
   * Get the current aim direction
   */
  getAim() {
    return this.aim;
  }
  
  /**
   * Get mouse wheel delta
   */
  getMouseWheel() {
    return this.mouseWheelDelta;
  }
  
  /**
   * Check if primary fire button is pressed
   */
  isPrimaryFiring() {
    return this.mouseButtons.left;
  }
  
  /**
   * Check if secondary fire button is pressed
   */
  isSecondaryFiring() {
    return this.mouseButtons.right;
  }
}