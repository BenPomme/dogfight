/**
 * Space Dogfight - Time System
 * 
 * This class handles time management and delta time calculation for the game.
 */

export default class Time {
  constructor() {
    // Current time
    this.current = 0;
    // Previous frame time
    this.previous = 0;
    // Time elapsed since last frame (in seconds)
    this.delta = 0;
    // Total elapsed time since game start (in seconds)
    this.elapsed = 0;
    // Game time scale (for slow motion or speed up effects)
    this.timeScale = 1;
    // FPS calculation
    this.fpsUpdateInterval = 1.0; // How often to update FPS (in seconds)
    this.fpsElapsed = 0;
    this.fpsFrameCount = 0;
    this.fps = 0;
  }

  /**
   * Start the time measurement
   */
  start() {
    this.current = this.now();
    this.previous = this.current;
    this.delta = 0;
    this.elapsed = 0;
    this.fpsElapsed = 0;
    this.fpsFrameCount = 0;
    this.fps = 0;
  }

  /**
   * Update time values
   */
  update() {
    // Get current time
    this.current = this.now();
    
    // Calculate delta time in seconds
    this.delta = (this.current - this.previous) / 1000;
    
    // Apply time scale
    this.delta *= this.timeScale;
    
    // Clamp delta time to avoid large jumps
    this.delta = Math.min(this.delta, 0.1);
    
    // Update elapsed time
    this.elapsed += this.delta;
    
    // Update previous time
    this.previous = this.current;
    
    // Update FPS counter
    this.fpsFrameCount++;
    this.fpsElapsed += this.delta;
    
    if (this.fpsElapsed >= this.fpsUpdateInterval) {
      this.fps = Math.round(this.fpsFrameCount / this.fpsElapsed);
      this.fpsFrameCount = 0;
      this.fpsElapsed = 0;
    }
  }

  /**
   * Get current time in milliseconds
   */
  now() {
    return performance.now();
  }

  /**
   * Set the time scale
   * @param {number} scale - The new time scale (1 = normal, 0.5 = half speed, 2 = double speed)
   */
  setTimeScale(scale) {
    this.timeScale = scale;
  }

  /**
   * Get the current FPS
   * @returns {number} - Current frames per second
   */
  getFPS() {
    return this.fps;
  }
}