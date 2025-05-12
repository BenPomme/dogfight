"""
Internal Input Mapping Setup Script

This script is designed to be run directly within the Unreal Engine Python environment
to create the input mappings for the Space Dogfight game.

To use this script:
1. Copy it into Unreal Engine's Content/Python directory
2. Open Unreal Engine's Python console (Window -> Developer Tools -> Python)
3. Run: execfile('internal_input_setup.py')
"""

import unreal

# Log function for better visibility
def log(message):
    unreal.log(f"[INPUT SETUP] {message}")

def setup_input_mappings():
    """Set up the input mappings for the Space Dogfight game."""
    try:
        # Get the input settings
        input_settings = unreal.get_default_object(unreal.InputSettings)
        if input_settings is None:
            log("Failed to get input settings")
            return False
            
        # Define action mappings
        action_mappings = [
            {"name": "Boost", "key": unreal.Key.E},
            {"name": "Brake", "key": unreal.Key.R},
            {"name": "PrimaryFire", "key": unreal.Key.LEFT_MOUSE_BUTTON},
            {"name": "SecondaryFire", "key": unreal.Key.RIGHT_MOUSE_BUTTON}
        ]
        
        # Define axis mappings
        axis_mappings = [
            {"name": "MoveForward", "key": unreal.Key.W, "scale": 1.0},
            {"name": "MoveForward", "key": unreal.Key.S, "scale": -1.0},
            {"name": "MoveRight", "key": unreal.Key.D, "scale": 1.0},
            {"name": "MoveRight", "key": unreal.Key.A, "scale": -1.0},
            {"name": "MoveUp", "key": unreal.Key.Q, "scale": 1.0},
            {"name": "MoveUp", "key": unreal.Key.Z, "scale": -1.0},
            {"name": "Turn", "key": unreal.Key.MOUSE_X, "scale": 1.0},
            {"name": "LookUp", "key": unreal.Key.MOUSE_Y, "scale": -1.0},
            {"name": "CameraZoom", "key": unreal.Key.MOUSE_WHEEL_AXIS, "scale": 1.0}
        ]
        
        # Clear existing bindings for these actions/axes to avoid duplicates
        existing_action_mappings = input_settings.get_action_mappings()
        for action in action_mappings:
            for existing in existing_action_mappings:
                if existing.action_name == action["name"]:
                    input_settings.remove_action_mapping(existing)
        
        existing_axis_mappings = input_settings.get_axis_mappings()
        for axis in axis_mappings:
            for existing in existing_axis_mappings:
                if existing.axis_name == axis["name"]:
                    input_settings.remove_axis_mapping(existing)
        
        # Add action mappings
        for action in action_mappings:
            mapping = unreal.InputActionKeyMapping(action["name"], action["key"])
            input_settings.add_action_mapping(mapping)
            log(f"Added action mapping: {action['name']} -> {action['key']}")
        
        # Add axis mappings
        for axis in axis_mappings:
            mapping = unreal.InputAxisKeyMapping(
                axis["name"], 
                axis["key"],
                axis["scale"]
            )
            input_settings.add_axis_mapping(mapping)
            log(f"Added axis mapping: {axis['name']} -> {axis['key']} (scale: {axis['scale']})")
        
        # Save the configuration
        editor_subsystem = unreal.get_editor_subsystem(unreal.EditorPreferencesSubsystem)
        editor_subsystem.save_config_file(input_settings)
        
        log("Successfully set up input mappings")
        return True
        
    except Exception as e:
        log(f"Error setting up input mappings: {e}")
        return False

def main():
    """Main function to set up the input control system."""
    log("Starting input control system setup...")
    
    # Set up input mappings
    if not setup_input_mappings():
        log("Failed to set up input mappings, aborting")
        return
        
    log("Input control system setup completed!")
    log("You can now use the input mappings in the game")
    log("To test them, enter Play-in-Editor mode and use the WASD keys for movement, mouse for aim")

# Execute the main function
if __name__ == "__main__" or True:  # Always execute when run in Unreal
    main()