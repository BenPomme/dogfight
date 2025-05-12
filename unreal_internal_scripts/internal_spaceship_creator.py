"""
Internal Spaceship Creator Script

This script is designed to be run directly within the Unreal Engine Python environment
to create the Space Dogfight game's spaceship blueprints and components.

To use this script:
1. Copy it into Unreal Engine's Content/Python directory
2. Open Unreal Engine's Python console (Window -> Developer Tools -> Python)
3. Run: execfile('internal_spaceship_creator.py')
"""

import unreal

# Get editor utilities
editor_util = unreal.EditorUtilityLibrary
editor_asset_lib = unreal.EditorAssetLibrary
editor_level_lib = unreal.EditorLevelLibrary
system_lib = unreal.SystemLibrary

# Define paths and names
BLUEPRINT_PATH = "/Game/SpaceDogfight/Blueprints"
SPACESHIP_BP_NAME = "BP_Spaceship"
SPACESHIP_FULL_PATH = f"{BLUEPRINT_PATH}/{SPACESHIP_BP_NAME}"

# Log function for better visibility
def log(message):
    unreal.log(f"[SPACESHIP CREATOR] {message}")

def ensure_directory_exists(path):
    """Ensure the specified content directory exists."""
    if not editor_asset_lib.does_directory_exist(path):
        log(f"Creating directory: {path}")
        editor_asset_lib.make_directory(path)
        return True
    log(f"Directory already exists: {path}")
    return True

def create_spaceship_blueprint():
    """Create the spaceship blueprint asset."""
    # First, ensure directory exists
    if not ensure_directory_exists(BLUEPRINT_PATH):
        log("Failed to create blueprint directory")
        return None
        
    # Check if blueprint already exists
    if editor_asset_lib.does_asset_exist(SPACESHIP_FULL_PATH):
        log(f"Blueprint already exists at {SPACESHIP_FULL_PATH}, using existing blueprint")
        return editor_asset_lib.load_asset(SPACESHIP_FULL_PATH)
    
    # Get the pawn factory
    factory = unreal.BlueprintFactory()
    factory.set_editor_property('ParentClass', unreal.Pawn)
    
    # Create the blueprint
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    new_blueprint = asset_tools.create_asset(SPACESHIP_BP_NAME, BLUEPRINT_PATH, None, factory)
    
    if new_blueprint is None:
        log("Failed to create spaceship blueprint")
        return None
        
    log(f"Successfully created blueprint at {SPACESHIP_FULL_PATH}")
    return new_blueprint

def add_components_to_blueprint(blueprint):
    """Add required components to the spaceship blueprint."""
    if blueprint is None:
        log("No blueprint provided, cannot add components")
        return False
        
    # Open the blueprint for edit
    blueprint_obj = editor_asset_lib.load_blueprint_class(SPACESHIP_FULL_PATH)
    if blueprint_obj is None:
        log("Failed to load blueprint class")
        return False
        
    # Get blueprint editor
    try:
        blueprint_editor = unreal.get_editor_subsystem(unreal.BlueprintEditorSubsystem)
        
        # Open blueprint
        blueprint_editor.open_blueprint(blueprint)
        
        # Get root component (create if needed)
        root_comp = None
        root_components = unreal.BlueprintEditorLibrary.get_components_from_blueprint(blueprint)
        for comp in root_components:
            if comp.get_name() == "DefaultSceneRoot":
                root_comp = comp
                break
                
        if root_comp is None:
            # Create scene component as root
            root_comp = blueprint_editor.add_new_component_to_blueprint(
                blueprint,
                unreal.SceneComponent.static_class(),
                "DefaultSceneRoot"
            )
            log("Created DefaultSceneRoot component")
        
        # Add ship mesh
        ship_mesh = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.StaticMeshComponent.static_class(),
            "ShipMesh",
            root_comp
        )
        
        # Set cone mesh for visual representation
        if ship_mesh is not None:
            cone_mesh = unreal.load_asset("/Engine/BasicShapes/Cone")
            if cone_mesh is not None:
                ship_mesh.set_editor_property("StaticMesh", cone_mesh)
                log("Set ship mesh to cone")
            else:
                log("Failed to load cone mesh")
        else:
            log("Failed to create ship mesh component")
        
        # Add collision component
        collision = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.SphereComponent.static_class(),
            "CollisionSphere",
            root_comp
        )
        
        if collision is not None:
            collision.set_editor_property("SphereRadius", 50.0)
            log("Created collision sphere component with 50.0 radius")
        else:
            log("Failed to create collision component")
        
        # Add spring arm for camera
        spring_arm = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.SpringArmComponent.static_class(),
            "CameraSpringArm",
            root_comp
        )
        
        if spring_arm is not None:
            # Configure spring arm
            spring_arm.set_editor_property("TargetArmLength", 400.0)
            spring_arm.set_editor_property("bEnableCameraLag", True)
            spring_arm.set_editor_property("bEnableCameraRotationLag", True)
            spring_arm.set_editor_property("CameraLagSpeed", 5.0)
            spring_arm.set_editor_property("CameraRotationLagSpeed", 5.0)
            spring_arm.set_editor_property("bUsePawnControlRotation", True)
            
            # Set relative transform
            location = unreal.Vector(0.0, 0.0, 50.0)  # Position above ship
            rotation = unreal.Rotator(-20.0, 0.0, 0.0)  # Angle down slightly
            spring_arm.set_editor_property("RelativeLocation", location)
            spring_arm.set_editor_property("RelativeRotation", rotation)
            
            log("Created and configured camera spring arm")
        else:
            log("Failed to create spring arm component")
        
        # Add camera component to spring arm
        camera = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.CameraComponent.static_class(),
            "FollowCamera",
            spring_arm 
        )
        
        if camera is not None:
            camera.set_editor_property("FieldOfView", 90.0)
            log("Created and configured camera component")
        else:
            log("Failed to create camera component")
        
        # Add movement component
        movement = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.FloatingPawnMovement.static_class(),
            "MovementComponent",
            root_comp
        )
        
        if movement is not None:
            movement.set_editor_property("MaxSpeed", 1000.0)
            movement.set_editor_property("Acceleration", 4000.0)
            movement.set_editor_property("Deceleration", 2000.0)
            movement.set_editor_property("TurningBoost", 8.0)
            movement.set_editor_property("bConstrainToPlane", False)
            log("Created and configured movement component")
        else:
            log("Failed to create movement component")
        
        # Compile and save the blueprint
        blueprint_editor.compile_blueprint(blueprint)
        editor_asset_lib.save_asset(SPACESHIP_FULL_PATH)
        
        log("Successfully added components to spaceship blueprint")
        return True
        
    except Exception as e:
        log(f"Error adding components: {e}")
        return False

def add_blueprint_variables(blueprint):
    """Add variables to the spaceship blueprint."""
    if blueprint is None:
        log("No blueprint provided, cannot add variables")
        return False
    
    try:
        # Open the blueprint for edit
        blueprint_editor = unreal.get_editor_subsystem(unreal.BlueprintEditorSubsystem)
        
        # Define variables to add
        variables = [
            {"name": "Health", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 100.0},
            {"name": "MaxSpeed", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 1000.0},
            {"name": "ThrustForce", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 4000.0},
            {"name": "RollRate", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 100.0},
            {"name": "PitchRate", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 90.0},
            {"name": "YawRate", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 90.0},
            {"name": "LinearDamping", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 0.1},
            {"name": "AngularDamping", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 0.3},
            {"name": "BoostMultiplier", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 2.0},
            {"name": "BrakeForce", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 3000.0},
            {"name": "MinZoomDistance", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 200.0},
            {"name": "MaxZoomDistance", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 800.0},
            {"name": "ZoomSpeed", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 50.0},
            {"name": "CurrentZoomTarget", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 400.0},
            {"name": "BoostCameraShakeIntensity", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 1.0},
            {"name": "DamageCameraShakeIntensity", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 2.0},
            {"name": "CameraShakeDuration", "type": unreal.EdGraphPinType(unreal.PinCategory.float), "default_value": 0.3}
        ]
        
        # Add each variable to the blueprint
        for var in variables:
            try:
                # Check if variable already exists
                if unreal.BlueprintEditorLibrary.does_member_variable_exist(blueprint, var["name"]):
                    log(f"Variable {var['name']} already exists, skipping")
                    continue
                    
                # Add variable
                result = blueprint_editor.add_member_variable(blueprint, var["name"], var["type"], var["default_value"])
                
                if result:
                    log(f"Added variable {var['name']} with value {var['default_value']}")
                else:
                    log(f"Failed to add variable {var['name']}")
            except Exception as var_error:
                log(f"Error adding variable {var['name']}: {var_error}")
        
        # Compile and save the blueprint
        blueprint_editor.compile_blueprint(blueprint)
        editor_asset_lib.save_asset(SPACESHIP_FULL_PATH)
        
        log("Successfully added variables to spaceship blueprint")
        return True
        
    except Exception as e:
        log(f"Error adding blueprint variables: {e}")
        return False

def spawn_test_instance():
    """Spawn a test instance of the spaceship in the level."""
    try:
        # First make sure the blueprint is loaded
        blueprint_class = editor_asset_lib.load_blueprint_class(SPACESHIP_FULL_PATH)
        if blueprint_class is None:
            log("Failed to load spaceship blueprint class")
            return False
            
        # Check if there's already a test instance
        actors = editor_level_lib.get_all_level_actors()
        for actor in actors:
            if actor.get_actor_label() == "TestSpaceship":
                log("Test spaceship already exists, removing it")
                editor_level_lib.destroy_actor(actor)
                break
                
        # Spawn at a specific location
        location = unreal.Vector(0.0, 0.0, 200.0)  # 200 units up
        rotation = unreal.Rotator(0.0, 0.0, 0.0)
        
        # Spawn the actor
        spawn_transform = unreal.Transform(location, rotation, unreal.Vector(1.0, 1.0, 1.0))
        spawned_actor = editor_level_lib.spawn_actor_from_class(blueprint_class, spawn_transform)
        
        if spawned_actor is None:
            log("Failed to spawn test spaceship")
            return False
            
        # Set a recognizable label
        spawned_actor.set_actor_label("TestSpaceship")
        
        log("Successfully spawned test spaceship")
        return True
        
    except Exception as e:
        log(f"Error spawning test instance: {e}")
        return False

def main():
    """Main function to execute all setup steps."""
    log("Starting spaceship setup...")
    
    # Create blueprint
    blueprint = create_spaceship_blueprint()
    if blueprint is None:
        log("Failed to create or get spaceship blueprint, aborting")
        return
        
    # Add components
    if not add_components_to_blueprint(blueprint):
        log("Failed to add components to blueprint, continuing anyway")
        
    # Add variables
    if not add_blueprint_variables(blueprint):
        log("Failed to add variables to blueprint, continuing anyway")
        
    # Spawn test instance
    if not spawn_test_instance():
        log("Failed to spawn test instance, continuing anyway")
        
    log("Spaceship setup completed!")
    log("You can now use the blueprint in the Unreal Editor")
    log("Blueprint path: " + SPACESHIP_FULL_PATH)
    log("Test instance spawned in the current level")

# Execute the main function
if __name__ == "__main__" or True:  # Always execute when run in Unreal
    main()