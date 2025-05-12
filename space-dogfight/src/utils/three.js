/**
 * Space Dogfight - Centralized Three.js import
 * 
 * This file centralizes the Three.js import to avoid loading multiple instances
 * of the library, which can cause warnings and possibly bugs.
 */

import * as THREE from 'three';

// Export the THREE object so it can be imported elsewhere
export default THREE;