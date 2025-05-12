"""
Internal Complete Setup Script

This script runs all the internal setup scripts for the Space Dogfight game:
1. Spaceship Blueprint Creation
2. Input Setup
3. Weapon System Setup

To use this script:
1. Copy all internal scripts to your project's Content/Python directory
2. Open Unreal Engine's Python console (Window -> Developer Tools -> Python)
3. Run: execfile('internal_complete_setup.py')
"""

import unreal
import os
import importlib
import sys

# Get the current script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def log(message):
    unreal.log(f"[SETUP] {message}")

def import_and_run_module(module_name, file_path):
    """Import and run a Python module dynamically."""
    try:
        # Add the directory to sys.path if it's not already there
        if SCRIPT_DIR not in sys.path:
            sys.path.append(SCRIPT_DIR)
            
        log(f"Importing module: {module_name}")
        
        # Use importlib to import the module
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if not spec:
            log(f"Could not find module spec for {file_path}")
            return False
            
        module = importlib.util.module_from_spec(spec)
        if not module:
            log(f"Could not create module from spec for {file_path}")
            return False
            
        # Execute the module
        spec.loader.exec_module(module)
        
        # Run the main function
        if hasattr(module, 'main'):
            log(f"Running main() from {module_name}")
            module.main()
            log(f"Completed {module_name}")
            return True
        else:
            log(f"Module {module_name} does not have a main() function")
            return False
            
    except Exception as e:
        log(f"Error loading or running module {module_name}: {e}")
        return False

def main():
    """Main function to run all setup scripts in sequence."""
    log("Starting complete Space Dogfight setup process...")
    
    # Define the scripts to run in order
    scripts = [
        {"name": "internal_spaceship_creator", "file": "internal_spaceship_creator.py"},
        {"name": "internal_input_setup", "file": "internal_input_setup.py"},
        {"name": "internal_weapon_system", "file": "internal_weapon_system.py"}
    ]
    
    # Run each script in sequence
    for script in scripts:
        script_path = os.path.join(SCRIPT_DIR, script["file"])
        log(f"Running script: {script['name']}")
        success = import_and_run_module(script["name"], script_path)
        
        if not success:
            log(f"⚠️ Failed to run script: {script['name']}")
        
    log("✅ Space Dogfight setup process completed!")
    log("Open the BP_Spaceship asset to verify all components were created correctly")
    log("Some manual setup may be required - see README.md for details")

# Execute the main function
if __name__ == "__main__" or True:  # Always execute when run in Unreal
    main()