# How to Run Space Dogfight Internal Scripts

Due to issues with the remote connection, we'll use the Unreal Engine's internal Python console to run the scripts directly. Follow these steps:

## Preparation

1. I've copied the following scripts to `/Users/benjamin.pommeraud/Desktop/DogFight/unreal_internal_scripts/`:
   - `internal_spaceship_creator.py` - Creates the spaceship blueprint and components
   - `internal_input_setup.py` - Sets up input mappings for controls
   - `internal_weapon_system.py` - Creates weapon systems (lasers and missiles)
   - `internal_complete_setup.py` - Runs all the above scripts in sequence

## Steps to Run in Unreal Engine

1. In Unreal Engine, create a Python directory in your project's Content folder:
   - In the Content Browser, right-click on Content
   - Select "New Folder"
   - Name it "Python"

2. Copy the scripts from `/Users/benjamin.pommeraud/Desktop/DogFight/unreal_internal_scripts/` to your project's Content/Python folder:
   - You can drag and drop them from Finder
   - Or use the Import button in the Content Browser

3. Open the Python console in Unreal Engine:
   - Go to Window → Developer Tools → Python
   - This opens the Python console window

4. Run the complete setup script by typing:
   ```python
   execfile('internal_complete_setup.py')
   ```

5. If you prefer to run scripts individually:
   ```python
   execfile('internal_spaceship_creator.py')
   execfile('internal_input_setup.py')
   execfile('internal_weapon_system.py')
   ```

## Verification

After running the scripts:

1. Check your Content Browser for:
   - `/Game/SpaceDogfight/Blueprints/BP_Spaceship`
   - `/Game/SpaceDogfight/Weapons/BP_LaserProjectile`
   - `/Game/SpaceDogfight/Weapons/BP_MissileProjectile`

2. Look for a "TestSpaceship" actor in your level

3. Click Play to test the controls:
   - WASD to move
   - Mouse to aim
   - E for boost
   - R for brake
   - Left/Right mouse buttons for weapons (requires manual blueprint wiring)

## Manual Steps Required

You'll need to manually connect some blueprint nodes:

1. For weapon firing:
   - Open the BP_Spaceship blueprint
   - Add code to spawn projectiles when primary/secondary fire inputs are triggered
   - Connect the weapon mount points to the firing logic

2. Component hierarchy verification:
   - Make sure the camera is properly attached to the spring arm
   - Verify that all components are in the correct hierarchy

## Troubleshooting

If you encounter any issues:
- Check the Output Log for Python errors
- Verify that the Python plugin is enabled
- Make sure all script files are in the Content/Python directory
- Try running the scripts one by one instead of using the complete setup script

The spaceship and weapons should now be set up and ready for further development!