# Space Dogfight Test Guide

This guide will help you run and test the game to ensure everything is working correctly.

## Quick Test Sequence

Follow these steps to verify the game is working:

1. Start the development server:
   ```bash
   cd /Users/benjamin.pommeraud/Desktop/DogFight/space-dogfight
   npm start
   ```

2. Access the test pages in your browser:

   - **Basic WebGL Test**: http://localhost:8080/webgl-test.html
   - **Controls Test**: http://localhost:8080/controls-test.html
   - **Basic Game Test**: http://localhost:8080/basic-test.html
   - **Diagnostics Page**: http://localhost:8080/diagnostics.html
   - **Full Game**: http://localhost:8080

## What to Check

### WebGL Test

Verify that:
- The rotating cube appears and animation is smooth
- No WebGL errors in the console
- All three status indicators show success (green)

### Controls Test

Verify that:
- The spaceship appears and responds to input
- WASD controls move the ship
- Mouse controls aiming
- Space/Shift moves up/down
- Clicking fires lasers
- Input display shows active keys and mouse position

### Basic Game Test

Verify that:
- The ship appears on a grid
- Ship movement is smooth and responds to input
- Camera follows the ship correctly
- No errors appear in the console

### Diagnostics Page

Run each test and verify:
- WebGL test passes
- Three.js test passes
- Input test detects all inputs
- DOM elements test passes

### Full Game

Verify that:
- Loading screen appears and then disappears
- Game interface elements appear
- Ship controls work
- Weapon systems function
- No errors in the console

## Troubleshooting

If any tests fail, refer to:
- `TROUBLESHOOTING.md` for common issues and solutions
- `DEBUG_GUIDE.md` for detailed diagnostic steps

## Testing Controls

Here are the controls to test:

- **W/A/S/D**: Move ship forward/left/back/right
- **Space/Shift**: Move up/down
- **Mouse**: Aim ship
- **Left Click**: Fire primary weapon (lasers)
- **Right Click**: Fire secondary weapon (missiles)
- **E**: Boost
- **R**: Brake
- **Q/E**: Roll left/right (in controls-test.html)

## Special Cases to Test

1. **Window Resize**: Resize the browser window and verify the game adapts correctly
2. **Loss of Focus**: Click outside the game window and verify it handles input correctly when focus returns
3. **Rapid Input**: Test rapid button presses and verify the controls respond accurately
4. **Multiple Keys**: Test pressing multiple keys simultaneously (e.g., W+A to move diagonally)

## Reporting Issues

If you encounter issues, check:
1. Browser console for errors (F12 > Console)
2. Game status display for warnings
3. Verify your browser supports WebGL

If the issue persists, take screenshots of any errors and the diagnostic test results.