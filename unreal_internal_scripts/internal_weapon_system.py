"""
Internal Weapon System Setup Script

This script is designed to be run directly within the Unreal Engine Python environment
to create the weapon systems for the Space Dogfight game.

To use this script:
1. Copy it into Unreal Engine's Content/Python directory
2. Open Unreal Engine's Python console (Window -> Developer Tools -> Python)
3. Run: execfile('internal_weapon_system.py')
"""

import unreal

# Get editor utilities
editor_util = unreal.EditorUtilityLibrary
editor_asset_lib = unreal.EditorAssetLibrary
editor_level_lib = unreal.EditorLevelLibrary
system_lib = unreal.SystemLibrary

# Define paths and names
BLUEPRINT_PATH = "/Game/SpaceDogfight/Blueprints"
WEAPONS_PATH = "/Game/SpaceDogfight/Weapons"
SPACESHIP_BP_NAME = "BP_Spaceship"
LASER_BP_NAME = "BP_LaserProjectile"
MISSILE_BP_NAME = "BP_MissileProjectile"
SPACESHIP_FULL_PATH = f"{BLUEPRINT_PATH}/{SPACESHIP_BP_NAME}"
LASER_FULL_PATH = f"{WEAPONS_PATH}/{LASER_BP_NAME}"
MISSILE_FULL_PATH = f"{WEAPONS_PATH}/{MISSILE_BP_NAME}"

# Log function for better visibility
def log(message):
    unreal.log(f"[WEAPON SYSTEM] {message}")

def ensure_directory_exists(path):
    """Ensure the specified content directory exists."""
    if not editor_asset_lib.does_directory_exist(path):
        log(f"Creating directory: {path}")
        editor_asset_lib.make_directory(path)
        return True
    log(f"Directory already exists: {path}")
    return True

def create_laser_projectile_blueprint():
    """Create the laser projectile blueprint."""
    # Ensure the directory exists
    if not ensure_directory_exists(WEAPONS_PATH):
        log("Failed to create weapons directory")
        return None
        
    # Check if blueprint already exists
    if editor_asset_lib.does_asset_exist(LASER_FULL_PATH):
        log(f"Laser blueprint already exists at {LASER_FULL_PATH}, using existing blueprint")
        return editor_asset_lib.load_asset(LASER_FULL_PATH)
    
    # Get the actor factory
    factory = unreal.BlueprintFactory()
    factory.set_editor_property('ParentClass', unreal.Actor)
    
    # Create the blueprint
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    new_blueprint = asset_tools.create_asset(LASER_BP_NAME, WEAPONS_PATH, None, factory)
    
    if new_blueprint is None:
        log("Failed to create laser projectile blueprint")
        return None
        
    log(f"Successfully created laser blueprint at {LASER_FULL_PATH}")
    return new_blueprint

def create_missile_projectile_blueprint():
    """Create the missile projectile blueprint."""
    # Ensure the directory exists
    if not ensure_directory_exists(WEAPONS_PATH):
        log("Failed to create weapons directory")
        return None
        
    # Check if blueprint already exists
    if editor_asset_lib.does_asset_exist(MISSILE_FULL_PATH):
        log(f"Missile blueprint already exists at {MISSILE_FULL_PATH}, using existing blueprint")
        return editor_asset_lib.load_asset(MISSILE_FULL_PATH)
    
    # Get the actor factory
    factory = unreal.BlueprintFactory()
    factory.set_editor_property('ParentClass', unreal.Actor)
    
    # Create the blueprint
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    new_blueprint = asset_tools.create_asset(MISSILE_BP_NAME, WEAPONS_PATH, None, factory)
    
    if new_blueprint is None:
        log("Failed to create missile projectile blueprint")
        return None
        
    log(f"Successfully created missile blueprint at {MISSILE_FULL_PATH}")
    return new_blueprint

def setup_laser_components(blueprint):
    """Set up components for the laser projectile."""
    if blueprint is None:
        log("No blueprint provided, cannot add components")
        return False
        
    try:
        # Open the blueprint for edit
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
            log("Created DefaultSceneRoot component for laser")
        
        # Add projectile movement component
        projectile_movement = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.ProjectileMovementComponent.static_class(),
            "ProjectileMovement",
            root_comp
        )
        
        if projectile_movement is not None:
            # Configure projectile movement
            projectile_movement.set_editor_property("InitialSpeed", 8000.0)
            projectile_movement.set_editor_property("MaxSpeed", 8000.0)
            projectile_movement.set_editor_property("bRotationFollowsVelocity", True)
            projectile_movement.set_editor_property("ProjectileGravityScale", 0.0)  # No gravity in space
            log("Created and configured projectile movement component for laser")
        else:
            log("Failed to create projectile movement component for laser")
        
        # Add visual component (cylinder for laser)
        cylinder = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.StaticMeshComponent.static_class(),
            "LaserVisual",
            root_comp
        )
        
        if cylinder is not None:
            # Set cylinder mesh
            cylinder_mesh = unreal.load_asset("/Engine/BasicShapes/Cylinder")
            if cylinder_mesh is not None:
                cylinder.set_editor_property("StaticMesh", cylinder_mesh)
                
                # Scale to look like a laser beam
                scale = unreal.Vector(0.1, 0.1, 1.5)  # Thin, elongated cylinder
                cylinder.set_editor_property("RelativeScale3D", scale)
                
                # Rotate to point forward
                rotation = unreal.Rotator(90.0, 0.0, 0.0)  # Point along X-axis
                cylinder.set_editor_property("RelativeRotation", rotation)
                
                log("Set laser visual to scaled cylinder")
            else:
                log("Failed to load cylinder mesh for laser")
        else:
            log("Failed to create visual component for laser")
        
        # Add collision for hit detection
        collision = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.CapsuleComponent.static_class(),
            "CollisionCapsule",
            root_comp
        )
        
        if collision is not None:
            # Configure collision
            collision.set_editor_property("CapsuleHalfHeight", 75.0)
            collision.set_editor_property("CapsuleRadius", 5.0)
            collision.set_editor_property("CollisionEnabled", unreal.CollisionEnabled.QUERY_ONLY)
            
            # Rotate to match visual
            rotation = unreal.Rotator(90.0, 0.0, 0.0)
            collision.set_editor_property("RelativeRotation", rotation)
            
            log("Created and configured collision component for laser")
        else:
            log("Failed to create collision component for laser")
        
        # Add variables
        try:
            # Damage variable
            damage_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(blueprint, "Damage", damage_type, 20.0)
            log("Added Damage variable to laser")
            
            # Lifetime variable
            lifetime_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(blueprint, "Lifetime", lifetime_type, 2.0)
            log("Added Lifetime variable to laser")
        except Exception as var_error:
            log(f"Error adding variables to laser: {var_error}")
        
        # Compile and save the blueprint
        blueprint_editor.compile_blueprint(blueprint)
        editor_asset_lib.save_asset(LASER_FULL_PATH)
        
        log("Successfully set up laser projectile components")
        return True
        
    except Exception as e:
        log(f"Error setting up laser components: {e}")
        return False

def setup_missile_components(blueprint):
    """Set up components for the missile projectile."""
    if blueprint is None:
        log("No blueprint provided, cannot add components")
        return False
        
    try:
        # Open the blueprint for edit
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
            log("Created DefaultSceneRoot component for missile")
        
        # Add projectile movement component
        projectile_movement = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.ProjectileMovementComponent.static_class(),
            "ProjectileMovement",
            root_comp
        )
        
        if projectile_movement is not None:
            # Configure projectile movement
            projectile_movement.set_editor_property("InitialSpeed", 3000.0)
            projectile_movement.set_editor_property("MaxSpeed", 6000.0)
            projectile_movement.set_editor_property("bRotationFollowsVelocity", True)
            projectile_movement.set_editor_property("ProjectileGravityScale", 0.0)  # No gravity in space
            projectile_movement.set_editor_property("bIsHomingProjectile", True)
            projectile_movement.set_editor_property("HomingAccelerationMagnitude", 8000.0)
            log("Created and configured projectile movement component for missile")
        else:
            log("Failed to create projectile movement component for missile")
        
        # Add visual component
        cone = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.StaticMeshComponent.static_class(),
            "MissileVisual",
            root_comp
        )
        
        if cone is not None:
            # Set cone mesh
            cone_mesh = unreal.load_asset("/Engine/BasicShapes/Cone")
            if cone_mesh is not None:
                cone.set_editor_property("StaticMesh", cone_mesh)
                
                # Scale to look like a missile
                scale = unreal.Vector(0.3, 0.3, 0.6)  # Small missile shape
                cone.set_editor_property("RelativeScale3D", scale)
                
                # Rotate to point forward
                rotation = unreal.Rotator(0.0, 0.0, 0.0)  # Cone already points up by default
                cone.set_editor_property("RelativeRotation", rotation)
                
                log("Set missile visual to scaled cone")
            else:
                log("Failed to load cone mesh for missile")
        else:
            log("Failed to create visual component for missile")
        
        # Add collision for hit detection
        collision = blueprint_editor.add_new_component_to_blueprint(
            blueprint,
            unreal.SphereComponent.static_class(),
            "CollisionSphere",
            root_comp
        )
        
        if collision is not None:
            # Configure collision
            collision.set_editor_property("SphereRadius", 15.0)
            collision.set_editor_property("CollisionEnabled", unreal.CollisionEnabled.QUERY_ONLY)
            log("Created and configured collision component for missile")
        else:
            log("Failed to create collision component for missile")
        
        # Add variables
        try:
            # Damage variable
            damage_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(blueprint, "Damage", damage_type, 50.0)
            log("Added Damage variable to missile")
            
            # Lifetime variable
            lifetime_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(blueprint, "Lifetime", lifetime_type, 5.0)
            log("Added Lifetime variable to missile")
            
            # Explosion radius variable
            radius_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(blueprint, "ExplosionRadius", radius_type, 200.0)
            log("Added ExplosionRadius variable to missile")
            
            # Target actor variable
            actor_type = unreal.EdGraphPinType(unreal.PinCategory.object)
            actor_type.object_type = unreal.Actor.static_class()
            blueprint_editor.add_member_variable(blueprint, "HomingTarget", actor_type, None)
            log("Added HomingTarget variable to missile")
        except Exception as var_error:
            log(f"Error adding variables to missile: {var_error}")
        
        # Compile and save the blueprint
        blueprint_editor.compile_blueprint(blueprint)
        editor_asset_lib.save_asset(MISSILE_FULL_PATH)
        
        log("Successfully set up missile projectile components")
        return True
        
    except Exception as e:
        log(f"Error setting up missile components: {e}")
        return False

def add_weapon_components_to_spaceship():
    """Add weapon components to the spaceship blueprint."""
    try:
        # Load the spaceship blueprint
        spaceship_bp = editor_asset_lib.load_asset(SPACESHIP_FULL_PATH)
        if spaceship_bp is None:
            log(f"Failed to load spaceship blueprint at {SPACESHIP_FULL_PATH}")
            log("Make sure to run the spaceship creator script first")
            return False
            
        # Open the blueprint for edit
        blueprint_editor = unreal.get_editor_subsystem(unreal.BlueprintEditorSubsystem)
        
        # Open blueprint
        blueprint_editor.open_blueprint(spaceship_bp)
        
        # Find the ship mesh component
        ship_mesh = None
        components = unreal.BlueprintEditorLibrary.get_components_from_blueprint(spaceship_bp)
        for comp in components:
            if comp.get_name() == "ShipMesh":
                ship_mesh = comp
                break
                
        if ship_mesh is None:
            log("Could not find ShipMesh component in spaceship blueprint")
            return False
            
        # Add weapon mount points as scene components
        
        # Left weapon mount
        left_mount = blueprint_editor.add_new_component_to_blueprint(
            spaceship_bp,
            unreal.SceneComponent.static_class(),
            "LeftWeaponMount",
            ship_mesh
        )
        
        if left_mount is not None:
            # Position at the left side of the ship
            location = unreal.Vector(-30.0, -30.0, 0.0)
            left_mount.set_editor_property("RelativeLocation", location)
            log("Added left weapon mount point")
        else:
            log("Failed to add left weapon mount point")
            
        # Right weapon mount
        right_mount = blueprint_editor.add_new_component_to_blueprint(
            spaceship_bp,
            unreal.SceneComponent.static_class(),
            "RightWeaponMount",
            ship_mesh
        )
        
        if right_mount is not None:
            # Position at the right side of the ship
            location = unreal.Vector(-30.0, 30.0, 0.0)
            right_mount.set_editor_property("RelativeLocation", location)
            log("Added right weapon mount point")
        else:
            log("Failed to add right weapon mount point")
            
        # Center mount for missiles
        center_mount = blueprint_editor.add_new_component_to_blueprint(
            spaceship_bp,
            unreal.SceneComponent.static_class(),
            "CenterWeaponMount",
            ship_mesh
        )
        
        if center_mount is not None:
            # Position at the bottom center of the ship
            location = unreal.Vector(-30.0, 0.0, -20.0)
            center_mount.set_editor_property("RelativeLocation", location)
            log("Added center weapon mount point")
        else:
            log("Failed to add center weapon mount point")
        
        # Add weapon-related variables to the spaceship
        try:
            # Laser cooldown variable
            cooldown_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(spaceship_bp, "LaserCooldown", cooldown_type, 0.2)
            log("Added LaserCooldown variable to spaceship")
            
            # Missile cooldown variable
            missile_cooldown_type = unreal.EdGraphPinType(unreal.PinCategory.float)
            blueprint_editor.add_member_variable(spaceship_bp, "MissileCooldown", missile_cooldown_type, 2.0)
            log("Added MissileCooldown variable to spaceship")
            
            # Max missile count
            missile_count_type = unreal.EdGraphPinType(unreal.PinCategory.int)
            blueprint_editor.add_member_variable(spaceship_bp, "MaxMissiles", missile_count_type, 8)
            log("Added MaxMissiles variable to spaceship")
            
            # Current missile count
            current_missiles_type = unreal.EdGraphPinType(unreal.PinCategory.int)
            blueprint_editor.add_member_variable(spaceship_bp, "CurrentMissiles", current_missiles_type, 8)
            log("Added CurrentMissiles variable to spaceship")
            
            # Weapon class references
            # Note: We'll store these as soft class references to avoid dependencies
            class_type = unreal.EdGraphPinType(unreal.PinCategory.class)
            blueprint_editor.add_member_variable(spaceship_bp, "LaserProjectileClass", class_type, None)
            blueprint_editor.add_member_variable(spaceship_bp, "MissileProjectileClass", class_type, None)
            log("Added weapon class reference variables to spaceship")
        except Exception as var_error:
            log(f"Error adding weapon variables to spaceship: {var_error}")
        
        # Compile and save the blueprint
        blueprint_editor.compile_blueprint(spaceship_bp)
        editor_asset_lib.save_asset(SPACESHIP_FULL_PATH)
        
        log("Successfully added weapon components to spaceship")
        return True
        
    except Exception as e:
        log(f"Error adding weapon components to spaceship: {e}")
        return False

def main():
    """Main function to set up weapon systems."""
    log("Starting weapon system setup...")
    
    # Create laser projectile blueprint
    laser_bp = create_laser_projectile_blueprint()
    if laser_bp is None:
        log("Failed to create or get laser projectile blueprint, continuing anyway")
    else:
        # Setup laser components
        if not setup_laser_components(laser_bp):
            log("Failed to set up laser components, continuing anyway")
    
    # Create missile projectile blueprint
    missile_bp = create_missile_projectile_blueprint()
    if missile_bp is None:
        log("Failed to create or get missile projectile blueprint, continuing anyway")
    else:
        # Setup missile components
        if not setup_missile_components(missile_bp):
            log("Failed to set up missile components, continuing anyway")
    
    # Add weapon components to spaceship
    if not add_weapon_components_to_spaceship():
        log("Failed to add weapon components to spaceship, continuing anyway")
    
    log("Weapon system setup completed!")
    log("Note: You'll need to manually wire up the weapon firing logic in the spaceship blueprint:")
    log("1. Create Fire functions that spawn projectiles from the weapon mounts")
    log("2. Connect the PrimaryFire and SecondaryFire input events to these functions")
    log("3. Set the LaserProjectileClass and MissileProjectileClass references in the spaceship blueprint")
    
# Execute the main function
if __name__ == "__main__" or True:  # Always execute when run in Unreal
    main()