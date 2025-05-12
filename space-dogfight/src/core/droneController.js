/**
 * Space Dogfight - Drone Controller
 * 
 * This class integrates the drone factory and voice commander
 * to provide a unified interface for the drone system.
 */

import DroneFactory from '../entities/droneFactory';
import VoiceCommander from '../voice/voiceCommander';
import { DroneType } from '../entities/drone';

class DroneController {
  constructor(options = {}) {
    // Configuration
    this.config = {
      voiceEnabled: options.voiceEnabled !== false, // Default true
      maxDrones: options.maxDrones || 3,
      initialDroneTypes: options.initialDroneTypes || [DroneType.ATTACK],
      scene: options.scene || null,
      owner: options.owner || null
    };
    
    // Create drone factory
    this.droneFactory = new DroneFactory({
      maxDrones: this.config.maxDrones,
      scene: this.config.scene,
      owner: this.config.owner
    });
    
    // Create voice commander if enabled
    if (this.config.voiceEnabled) {
      this.voiceCommander = new VoiceCommander({
        onCommand: this.handleVoiceCommand.bind(this),
        onError: this.handleVoiceError.bind(this),
        onListeningStart: this.handleListeningStart.bind(this),
        onListeningEnd: this.handleListeningEnd.bind(this),
        transcriptionElement: options.transcriptionElement || null,
        feedbackElement: options.feedbackElement || null
      });
    }
    
    // UI elements
    this.uiElements = {
      droneStatus: options.droneStatusElement || null,
      voiceButton: options.voiceButtonElement || null
    };
    
    // State
    this.isInitialized = false;
    this.isListening = false;
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Initialize the drone controller
   */
  async initialize() {
    // Initialize drones
    for (const droneType of this.config.initialDroneTypes) {
      this.droneFactory.createDrone(droneType);
    }
    
    // Initialize voice if enabled
    if (this.config.voiceEnabled && this.voiceCommander) {
      const voiceInitialized = await this.voiceCommander.initialize();
      if (!voiceInitialized) {
        console.warn('Voice commander initialization failed');
      }
    }
    
    this.isInitialized = true;
    console.log('Drone controller initialized');
    
    // Update UI
    this.updateDroneStatusUI();
    
    return true;
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Voice activation button
    if (this.uiElements.voiceButton) {
      this.uiElements.voiceButton.addEventListener('click', () => {
        this.toggleVoiceListening();
      });
    }
    
    // Add keyboard shortcut for voice (press V)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'v' || event.key === 'V') {
        this.toggleVoiceListening();
      }
    });
  }
  
  /**
   * Toggle voice listening
   */
  toggleVoiceListening() {
    if (!this.config.voiceEnabled || !this.voiceCommander || !this.isInitialized) {
      console.warn('Voice commander not available');
      return false;
    }
    
    const result = this.voiceCommander.toggleListening();
    
    // Update UI
    if (this.uiElements.voiceButton) {
      this.uiElements.voiceButton.classList.toggle('active', this.isListening);
    }
    
    return result;
  }
  
  /**
   * Handle voice command from voice commander
   */
  handleVoiceCommand(command) {
    console.log('Received voice command:', command);
    
    // Process command with drone factory
    const result = this.droneFactory.processCommand(command);
    
    // Provide feedback
    if (result) {
      console.log('Command executed successfully');
      this.showFeedback(`Executing: ${command.action}`);
    } else {
      console.log('Command execution failed');
      this.showFeedback('Command failed');
    }
    
    // Update UI
    this.updateDroneStatusUI();
    
    return result;
  }
  
  /**
   * Handle voice error
   */
  handleVoiceError(error) {
    console.error('Voice error:', error);
    this.showFeedback('Voice error: ' + error);
  }
  
  /**
   * Handle listening start
   */
  handleListeningStart() {
    this.isListening = true;
    console.log('Voice listening started');
    
    // Update UI
    if (this.uiElements.voiceButton) {
      this.uiElements.voiceButton.classList.add('active');
    }
  }
  
  /**
   * Handle listening end
   */
  handleListeningEnd() {
    this.isListening = false;
    console.log('Voice listening ended');
    
    // Update UI
    if (this.uiElements.voiceButton) {
      this.uiElements.voiceButton.classList.remove('active');
    }
  }
  
  /**
   * Show feedback in the UI
   */
  showFeedback(message) {
    if (this.uiElements.feedbackElement) {
      this.uiElements.feedbackElement.textContent = message;
      
      // Clear message after a delay
      setTimeout(() => {
        this.uiElements.feedbackElement.textContent = '';
      }, 3000);
    }
  }
  
  /**
   * Update drone status in the UI
   */
  updateDroneStatusUI() {
    if (!this.uiElements.droneStatus) return;
    
    // Get all drones
    const allDrones = this.droneFactory.getAllDrones();
    
    // Clear current status
    this.uiElements.droneStatus.innerHTML = '';
    
    // Create status for each drone
    for (const drone of allDrones) {
      const droneElement = document.createElement('div');
      droneElement.className = `drone-status drone-${drone.type}`;
      
      // Drone name and level
      const nameElement = document.createElement('div');
      nameElement.className = 'drone-name';
      nameElement.textContent = `${drone.type.toUpperCase()} Lv${drone.level}`;
      droneElement.appendChild(nameElement);
      
      // Drone state
      const stateElement = document.createElement('div');
      stateElement.className = 'drone-state';
      stateElement.textContent = drone.state;
      droneElement.appendChild(stateElement);
      
      // Energy bar
      if (drone.energy) {
        const energyContainer = document.createElement('div');
        energyContainer.className = 'energy-container';
        
        const energyBar = document.createElement('div');
        energyBar.className = 'energy-bar';
        energyBar.style.width = `${(drone.energy.current / drone.energy.max) * 100}%`;
        
        energyContainer.appendChild(energyBar);
        droneElement.appendChild(energyContainer);
      }
      
      this.uiElements.droneStatus.appendChild(droneElement);
    }
    
    // Add button to create more drones if possible
    if (allDrones.length < this.config.maxDrones) {
      const availableTypes = Object.values(DroneType).filter(
        type => !this.droneFactory.drones[type]
      );
      
      for (const type of availableTypes) {
        const buttonElement = document.createElement('button');
        buttonElement.className = `drone-add-button drone-${type}`;
        buttonElement.textContent = `Add ${type} drone`;
        buttonElement.addEventListener('click', () => {
          this.droneFactory.createDrone(type);
          this.updateDroneStatusUI();
        });
        
        this.uiElements.droneStatus.appendChild(buttonElement);
      }
    }
  }
  
  /**
   * Create a drone of the specified type
   */
  createDrone(type) {
    const drone = this.droneFactory.createDrone(type);
    this.updateDroneStatusUI();
    return drone;
  }
  
  /**
   * Upgrade a drone of the specified type
   */
  upgradeDrone(type) {
    const result = this.droneFactory.upgradeDrone(type);
    this.updateDroneStatusUI();
    return result;
  }
  
  /**
   * Get all active drones
   */
  getAllDrones() {
    return this.droneFactory.getAllDrones();
  }
  
  /**
   * Process a command
   */
  processCommand(command) {
    const result = this.droneFactory.processCommand(command);
    this.updateDroneStatusUI();
    return result;
  }
  
  /**
   * Update all drones
   */
  update(deltaTime) {
    this.droneFactory.update(deltaTime);
  }
}

export default DroneController;