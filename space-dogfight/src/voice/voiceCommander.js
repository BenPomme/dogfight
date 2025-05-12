/**
 * Space Dogfight - Voice Commander Module
 * 
 * This module handles voice command recognition using WebRTC and OpenAI Voice API.
 * It processes voice commands for the assistant drone system.
 */

class VoiceCommander {
  constructor(options = {}) {
    // Configuration with defaults
    this.config = {
      // WebRTC options
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      
      // OpenAI API endpoint (would be replaced with actual endpoint)
      apiEndpoint: options.apiEndpoint || '/api/voice',
      
      // Command recognition settings
      commandThreshold: options.commandThreshold || 0.7,
      listeningTimeout: options.listeningTimeout || 5000, // ms
      
      // Audio processing settings
      sampleRate: options.sampleRate || 16000,
      
      // UI elements
      transcriptionElement: options.transcriptionElement || null,
      feedbackElement: options.feedbackElement || null,
      
      // Callback functions
      onTranscription: options.onTranscription || null,
      onCommand: options.onCommand || null,
      onError: options.onError || null,
      onListeningStart: options.onListeningStart || null,
      onListeningEnd: options.onListeningEnd || null
    };
    
    // State variables
    this.isInitialized = false;
    this.isListening = false;
    this.mediaStream = null;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.listeningTimeout = null;
    
    // Command mapping
    this.commandMappings = {
      attack: {
        phrases: ['attack', 'fire', 'shoot', 'engage'],
        action: 'drone-attack',
        params: ['targetId']
      },
      defend: {
        phrases: ['shield', 'defend', 'protect', 'cover'],
        action: 'drone-shield',
        params: ['state']
      },
      recon: {
        phrases: ['scan', 'recon', 'locate', 'find', 'search'],
        action: 'drone-scan',
        params: ['areaId']
      },
      all: {
        phrases: ['all drones', 'everyone', 'all', 'squadron'],
        action: 'drone-all',
        params: ['command']
      },
      recall: {
        phrases: ['return', 'come back', 'recall', 'retreat'],
        action: 'drone-recall',
        params: []
      }
    };
  }
  
  /**
   * Initialize the voice commander
   */
  async initialize() {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audio
      });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      
      // Set up event listeners
      this.mediaRecorder.addEventListener('dataavailable', event => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      this.mediaRecorder.addEventListener('stop', () => {
        this.processAudioData();
      });
      
      this.isInitialized = true;
      console.log('Voice Commander initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Voice Commander:', error);
      if (this.config.onError) {
        this.config.onError('Failed to initialize voice system: ' + error.message);
      }
      return false;
    }
  }
  
  /**
   * Start listening for voice commands
   */
  startListening() {
    if (!this.isInitialized) {
      console.error('Voice Commander not initialized');
      return false;
    }
    
    if (this.isListening) {
      console.warn('Already listening for voice commands');
      return false;
    }
    
    try {
      // Reset audio chunks
      this.audioChunks = [];
      
      // Start recording
      this.mediaRecorder.start();
      this.isListening = true;
      
      // Notify listener start
      if (this.config.onListeningStart) {
        this.config.onListeningStart();
      }
      
      // Update UI if elements exist
      if (this.config.transcriptionElement) {
        this.config.transcriptionElement.textContent = 'Listening...';
      }
      
      // Set timeout to automatically stop listening
      this.listeningTimeout = setTimeout(() => {
        this.stopListening();
      }, this.config.listeningTimeout);
      
      console.log('Started listening for voice commands');
      return true;
    } catch (error) {
      console.error('Error starting voice listening:', error);
      if (this.config.onError) {
        this.config.onError('Failed to start listening: ' + error.message);
      }
      return false;
    }
  }
  
  /**
   * Stop listening for voice commands
   */
  stopListening() {
    if (!this.isListening) {
      console.warn('Not currently listening');
      return false;
    }
    
    try {
      // Clear timeout if it exists
      if (this.listeningTimeout) {
        clearTimeout(this.listeningTimeout);
        this.listeningTimeout = null;
      }
      
      // Stop recording
      this.mediaRecorder.stop();
      this.isListening = false;
      
      // Notify listener end
      if (this.config.onListeningEnd) {
        this.config.onListeningEnd();
      }
      
      console.log('Stopped listening for voice commands');
      return true;
    } catch (error) {
      console.error('Error stopping voice listening:', error);
      if (this.config.onError) {
        this.config.onError('Failed to stop listening: ' + error.message);
      }
      return false;
    }
  }
  
  /**
   * Process recorded audio data
   */
  async processAudioData() {
    try {
      // Create audio blob from chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // For development/testing purposes, we'll simulate API response
      // In production, this would send the audio to OpenAI Voice API
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get random test command for simulation
        const simulatedResponse = this.getSimulatedResponse();
        this.handleRecognitionResult(simulatedResponse);
      } else {
        // Send to actual API endpoint
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        this.handleRecognitionResult(result);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.config.onError) {
        this.config.onError('Failed to process voice command: ' + error.message);
      }
      
      // Update UI for error
      if (this.config.transcriptionElement) {
        this.config.transcriptionElement.textContent = 'Voice recognition error';
      }
    }
  }
  
  /**
   * Handle the voice recognition result
   */
  handleRecognitionResult(result) {
    // Extract transcription
    const transcription = result.transcription || '';
    
    // Update UI with transcription
    if (this.config.transcriptionElement) {
      this.config.transcriptionElement.textContent = transcription;
    }
    
    // Notify transcription callback
    if (this.config.onTranscription) {
      this.config.onTranscription(transcription);
    }
    
    // Parse intent and confidence
    const intent = result.intent || {};
    const confidence = intent.confidence || 0;
    
    console.log(`Transcription: "${transcription}", Intent: ${intent.action}, Confidence: ${confidence}`);
    
    // Check if confidence meets threshold
    if (confidence >= this.config.commandThreshold) {
      // Generate command object
      const command = {
        action: intent.action,
        params: intent.params || {},
        transcription: transcription,
        confidence: confidence
      };
      
      // Notify command callback
      if (this.config.onCommand) {
        this.config.onCommand(command);
      }
      
      // Update UI with recognized command
      if (this.config.feedbackElement) {
        this.config.feedbackElement.textContent = `Command: ${intent.action}`;
      }
      
      console.log('Recognized command:', command);
    } else {
      console.log('Command confidence too low, ignoring');
      
      // Update UI for low confidence
      if (this.config.feedbackElement) {
        this.config.feedbackElement.textContent = 'Command not recognized';
      }
    }
  }
  
  /**
   * Map transcription to command intent (for when not using API)
   */
  mapTranscriptionToIntent(transcription) {
    // Convert to lowercase for matching
    const lowercaseText = transcription.toLowerCase();
    
    // Check each command mapping
    for (const [type, mapping] of Object.entries(this.commandMappings)) {
      // Check if any phrases match
      for (const phrase of mapping.phrases) {
        if (lowercaseText.includes(phrase)) {
          // Basic intent found
          const intent = {
            action: mapping.action,
            confidence: 0.8, // Default confidence
            params: {}
          };
          
          // Try to extract parameters
          // This is a simplified version - in production would use NLP
          if (type === 'attack') {
            // Extract target ID (simplified)
            const targetMatch = lowercaseText.match(/target\s+(\w+)/i);
            if (targetMatch) {
              intent.params.targetId = targetMatch[1];
            } else {
              intent.params.targetId = 'current';
            }
          } else if (type === 'defend') {
            // Extract shield state
            intent.params.state = lowercaseText.includes('off') ? 'off' : 'on';
          } else if (type === 'recon') {
            // Extract area ID (simplified)
            intent.params.areaId = 'current';
          }
          
          return intent;
        }
      }
    }
    
    // No intent matched
    return {
      action: null,
      confidence: 0.1,
      params: {}
    };
  }
  
  /**
   * Get simulated response for testing
   */
  getSimulatedResponse() {
    // Array of test commands
    const testCommands = [
      {
        transcription: "Drone, attack the target",
        intent: {
          action: "drone-attack",
          confidence: 0.92,
          params: {
            targetId: "current"
          }
        }
      },
      {
        transcription: "Activate shield",
        intent: {
          action: "drone-shield",
          confidence: 0.85,
          params: {
            state: "on"
          }
        }
      },
      {
        transcription: "Scan the area",
        intent: {
          action: "drone-scan",
          confidence: 0.88,
          params: {
            areaId: "current"
          }
        }
      },
      {
        transcription: "All drones, attack",
        intent: {
          action: "drone-all",
          confidence: 0.90,
          params: {
            command: "attack"
          }
        }
      },
      {
        transcription: "Return to me",
        intent: {
          action: "drone-recall",
          confidence: 0.83,
          params: {}
        }
      },
      // Add a low confidence example
      {
        transcription: "Hmm not sure what to do",
        intent: {
          action: null,
          confidence: 0.32,
          params: {}
        }
      }
    ];
    
    // Return a random test command
    return testCommands[Math.floor(Math.random() * testCommands.length)];
  }
  
  /**
   * Toggle listening state
   */
  toggleListening() {
    if (this.isListening) {
      return this.stopListening();
    } else {
      return this.startListening();
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    try {
      // Stop listening if active
      if (this.isListening) {
        this.stopListening();
      }
      
      // Stop and release media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      // Close audio context
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      // Reset state
      this.isInitialized = false;
      
      console.log('Voice Commander resources released');
    } catch (error) {
      console.error('Error disposing Voice Commander:', error);
    }
  }
}

export default VoiceCommander;