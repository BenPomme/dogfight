export default class InputManager {
  constructor() {
    // Movement state
    this.movement = {
      forward: 0,
      right: 0,
      up: 0,
      boost: false,
      brake: false
    };
    
    // Aim state (mouse)
    this.aim = {
      x: 0,
      y: 0
    };
    
    // Weapon state
    this.primaryFiring = false;
    this.secondaryFiring = false;
    
    // Key state
    this.keys = new Set();
    
    // Mouse position
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Setup event listeners
    this.setupKeyboardEvents();
    this.setupMouseEvents();
  }
  
  setupKeyboardEvents() {
    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      this.updateMovement();
    });
    
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      this.updateMovement();
    });
  }
  
  setupMouseEvents() {
    window.addEventListener('mousemove', (event) => {
      // Convert mouse position to normalized coordinates (-1 to 1)
      this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -((event.clientY / window.innerHeight) * 2 - 1);
      
      this.updateAim();
    });
    
    window.addEventListener('mousedown', (event) => {
      if (event.button === 0) { // Left click
        this.primaryFiring = true;
      } else if (event.button === 2) { // Right click
        this.secondaryFiring = true;
      }
    });
    
    window.addEventListener('mouseup', (event) => {
      if (event.button === 0) { // Left click
        this.primaryFiring = false;
      } else if (event.button === 2) { // Right click
        this.secondaryFiring = false;
      }
    });
    
    // Prevent context menu on right click
    window.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }
  
  updateMovement() {
    // Forward/Backward
    this.movement.forward = 0;
    if (this.keys.has('KeyW')) this.movement.forward += 1;
    if (this.keys.has('KeyS')) this.movement.forward -= 1;
    
    // Right/Left
    this.movement.right = 0;
    if (this.keys.has('KeyD')) this.movement.right += 1;
    if (this.keys.has('KeyA')) this.movement.right -= 1;
    
    // Up/Down
    this.movement.up = 0;
    if (this.keys.has('Space')) this.movement.up += 1;
    if (this.keys.has('ShiftLeft')) this.movement.up -= 1;
    
    // Boost
    this.movement.boost = this.keys.has('KeyE');
    
    // Brake
    this.movement.brake = this.keys.has('KeyQ');
  }
  
  updateAim() {
    // Update aim values based on mouse position
    this.aim.x = this.mouseX;
    this.aim.y = this.mouseY;
  }
  
  getMovement() {
    return this.movement;
  }
  
  getAim() {
    return this.aim;
  }
  
  isPrimaryFiring() {
    return this.primaryFiring;
  }
  
  isSecondaryFiring() {
    return this.secondaryFiring;
  }
} 