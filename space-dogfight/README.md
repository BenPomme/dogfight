# Space Dogfight

A browser-based 3D space combat game built with Three.js and JavaScript featuring voice-controlled assistant drones.

## Overview

Space Dogfight is a physics-based spaceship combat game featuring:
- Intuitive WASD + mouse flight controls
- Physics-based movement with inertia and drift
- Multiple weapon systems (lasers, missiles, etc.)
- Voice-controlled assistant drone wingmen
- Various game modes (1v1, free-for-all, vs AI)
- Competitive multiplayer system with rankings

## Technology Stack

- **Three.js** - WebGL-based 3D rendering
- **JavaScript** - Core programming language
- **HTML5/CSS3** - Web interface and HUD elements
- **Node.js** - Backend server (for multiplayer features)
- **WebSockets** - Real-time multiplayer communication
- **WebRTC** - Voice capture and processing
- **OpenAI Voice API** - Voice command recognition

## Game Controls

### Traditional Controls
- **W/A/S/D** - Move forward/left/backward/right
- **Mouse** - Aim ship
- **Left Click** - Fire primary weapon (laser)
- **Right Click** - Fire secondary weapon (missiles)
- **E** - Boost
- **R** - Brake
- **Q/Z** - Roll left/right
- **Mouse Wheel** - Adjust camera zoom
- **Tab** - View scoreboard
- **Esc** - Pause menu

### Voice Commands for Assistant Drones
- **"Drone, attack target"** - Command attack drone to fire on current target
- **"Activate shield"** - Command defense drone to activate shield
- **"Scan area"** - Command recon drone to scan the surrounding area
- **"All drones, attack"** - Command all available drones to attack (higher level)

## Assistant Drone System

### Categories and Levels
The game features an evolving "Wingman" drone system with 3 categories:
- **Attack Drones** - Equipped with gunners and missile systems
- **Defense Drones** - Provide shields and electronic countermeasures
- **Recon Drones** - Scanning capabilities and beacon deployment

### Voice Integration
The game implements voice command recognition:
1. Captures microphone audio via WebRTC
2. Sends audio stream to OpenAI Voice API
3. Receives transcription and intent
4. Maps intent to drone command actions

### Drone AI and Behavior
- Each drone category uses specialized behavior trees
- Drones have multiple states: idle, follow, execute, return
- Actions have priorities and cooldowns
- Visual and audio feedback for voice commands

### Progression System
- **Level 1**: Single attack drone with basic capabilities
- **Level 2**: Adds defense drone with shield capabilities
- **Level 3**: Adds recon drone and enables combo voice commands

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Modern web browser with WebGL support
- Microphone for voice commands
- Internet connection (for OpenAI Voice API)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/space-dogfight.git
   cd space-dogfight
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
space-dogfight/
├── src/                    # Source code
│   ├── core/               # Core game engine components
│   ├── entities/           # Game entities (ships, drones, etc.)
│   ├── systems/            # Game systems
│   ├── ui/                 # User interface
│   ├── voice/              # Voice command processing
│   ├── network/            # Networking
│   └── utils/              # Utility functions
├── assets/                 # Game assets
├── public/                 # Public files
├── server/                 # Server code (multiplayer, voice processing)
├── docs/                   # Documentation
└── tests/                  # Tests
```

## Development Roadmap

See [roadmap.md](docs/roadmap.md) for the detailed development plan.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for the amazing 3D library
- OpenAI for voice recognition API
- All contributors and testers