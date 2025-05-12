// Score System for Space Dogfight
// This module handles score tracking, display, and high scores

// Score state
const scoreState = {
    currentScore: 0,
    highScore: 0,
    combo: 0,
    comboMultiplier: 1.0,
    comboTimer: 0,
    comboMaxTime: 5, // Seconds before combo resets
    sessionScores: [],
    scoreBreakdown: {
        enemies: 0,
        asteroids: 0,
        missions: 0,
        objectives: 0,
        powerups: 0
    },
    scoreValues: {
        // Enemy types
        FIGHTER: 100,
        BOMBER: 250,
        ELITE: 500,
        // Object types
        ASTEROID_SMALL: 10,
        ASTEROID_MEDIUM: 25,
        ASTEROID_LARGE: 50,
        TRANSPORT: 300,
        // Other
        MISSION_COMPLETE: 1000,
        OBJECTIVE_COMPLETE: 100,
        POWERUP_COLLECT: 25
    }
};

// Initialize score system
export function initScoreSystem() {
    // Load high score from localStorage if available
    try {
        const savedHighScore = localStorage.getItem('dogfight_highscore');
        if (savedHighScore) {
            scoreState.highScore = parseInt(savedHighScore);
        }
        
        // Load session scores
        const savedSessionScores = localStorage.getItem('dogfight_session_scores');
        if (savedSessionScores) {
            scoreState.sessionScores = JSON.parse(savedSessionScores);
        }
    } catch (e) {
        console.warn('Failed to load scores from localStorage:', e);
    }
    
    // Create score UI
    createScoreUI();
}

// Reset score for a new game
export function resetScore() {
    scoreState.currentScore = 0;
    scoreState.combo = 0;
    scoreState.comboMultiplier = 1.0;
    scoreState.comboTimer = 0;
    
    // Reset score breakdown
    for (const key in scoreState.scoreBreakdown) {
        scoreState.scoreBreakdown[key] = 0;
    }
    
    // Update UI
    updateScoreUI();
}

// Add points to score
export function addScore(points, type = 'general') {
    // Apply combo multiplier
    const finalPoints = Math.round(points * scoreState.comboMultiplier);
    
    // Add to current score
    scoreState.currentScore += finalPoints;
    
    // Increment appropriate breakdown category
    if (type in scoreState.scoreBreakdown) {
        scoreState.scoreBreakdown[type] += finalPoints;
    }
    
    // Increase combo
    scoreState.combo++;
    
    // Update combo multiplier
    scoreState.comboMultiplier = Math.min(4.0, 1.0 + (scoreState.combo * 0.1));
    
    // Reset combo timer
    scoreState.comboTimer = scoreState.comboMaxTime;
    
    // Show score popup
    showScorePopup(finalPoints, scoreState.combo);
    
    // Update high score if needed
    if (scoreState.currentScore > scoreState.highScore) {
        scoreState.highScore = scoreState.currentScore;
        
        // Save to localStorage
        try {
            localStorage.setItem('dogfight_highscore', scoreState.highScore.toString());
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }
    
    // Update UI
    updateScoreUI();
    
    return finalPoints;
}

// Add score specifically for destroying an enemy
export function addEnemyScore(enemyType) {
    const points = scoreState.scoreValues[enemyType] || 100;
    return addScore(points, 'enemies');
}

// Add score for destroying an asteroid
export function addAsteroidScore(size) {
    let points = 10; // Default
    
    // Determine points based on size
    if (size <= 2) {
        points = scoreState.scoreValues.ASTEROID_SMALL;
    } else if (size <= 4) {
        points = scoreState.scoreValues.ASTEROID_MEDIUM;
    } else {
        points = scoreState.scoreValues.ASTEROID_LARGE;
    }
    
    return addScore(points, 'asteroids');
}

// Add score for completing a mission
export function addMissionScore(missionType, difficultyMultiplier = 1.0) {
    const points = scoreState.scoreValues.MISSION_COMPLETE * difficultyMultiplier;
    return addScore(points, 'missions');
}

// Add score for completing an objective
export function addObjectiveScore() {
    return addScore(scoreState.scoreValues.OBJECTIVE_COMPLETE, 'objectives');
}

// Add score for collecting a powerup
export function addPowerupScore() {
    return addScore(scoreState.scoreValues.POWERUP_COLLECT, 'powerups');
}

// Update score system (call from game loop)
export function updateScoreSystem(deltaTime) {
    // Update combo timer
    if (scoreState.comboTimer > 0) {
        scoreState.comboTimer -= deltaTime;
        
        // Reset combo if timer expires
        if (scoreState.comboTimer <= 0) {
            scoreState.combo = 0;
            scoreState.comboMultiplier = 1.0;
            
            // Update UI to show combo reset
            updateComboUI();
        }
    }
}

// End current game and add score to history
export function endGame() {
    // Create score entry
    const scoreEntry = {
        score: scoreState.currentScore,
        date: new Date().toISOString(),
        breakdown: { ...scoreState.scoreBreakdown }
    };
    
    // Add to session scores
    scoreState.sessionScores.push(scoreEntry);
    
    // Keep only top 10 scores
    scoreState.sessionScores.sort((a, b) => b.score - a.score);
    scoreState.sessionScores = scoreState.sessionScores.slice(0, 10);
    
    // Save to localStorage
    try {
        localStorage.setItem('dogfight_session_scores', JSON.stringify(scoreState.sessionScores));
    } catch (e) {
        console.warn('Failed to save session scores:', e);
    }
    
    // Show game over screen with score
    showGameOverScreen();
}

// UI Functions

// Create score UI elements
function createScoreUI() {
    // Check if UI already exists
    if (document.getElementById('score-display')) return;
    
    // Create score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score-display';
    scoreDisplay.className = 'score-display';
    
    // Add score content
    scoreDisplay.innerHTML = `
        <div class="current-score">0</div>
        <div class="combo-counter hidden">
            <span class="combo-number">x1</span>
            <div class="combo-bar">
                <div class="combo-fill"></div>
            </div>
        </div>
        <div class="high-score">BEST: 0</div>
    `;
    
    // Add to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(scoreDisplay);
    }
    
    // Add CSS styles
    addScoreStyles();
}

// Update the score UI
function updateScoreUI() {
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    
    // Update current score
    const currentScoreElement = scoreDisplay.querySelector('.current-score');
    if (currentScoreElement) {
        currentScoreElement.textContent = scoreState.currentScore.toLocaleString();
    }
    
    // Update high score
    const highScoreElement = scoreDisplay.querySelector('.high-score');
    if (highScoreElement) {
        highScoreElement.textContent = `BEST: ${scoreState.highScore.toLocaleString()}`;
    }
    
    // Update combo display
    updateComboUI();
}

// Update the combo UI
function updateComboUI() {
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    
    const comboCounter = scoreDisplay.querySelector('.combo-counter');
    const comboNumber = scoreDisplay.querySelector('.combo-number');
    const comboFill = scoreDisplay.querySelector('.combo-fill');
    
    if (comboCounter && comboNumber && comboFill) {
        if (scoreState.combo > 1) {
            // Show combo counter
            comboCounter.classList.remove('hidden');
            
            // Update combo number
            comboNumber.textContent = `x${scoreState.comboMultiplier.toFixed(1)}`;
            
            // Update combo timer bar
            const fillPercent = (scoreState.comboTimer / scoreState.comboMaxTime) * 100;
            comboFill.style.width = `${fillPercent}%`;
            
            // Color based on multiplier
            if (scoreState.comboMultiplier >= 3.0) {
                comboNumber.style.color = '#ff0000';
                comboFill.style.background = 'linear-gradient(to right, #ff0000, #ff6600)';
            } else if (scoreState.comboMultiplier >= 2.0) {
                comboNumber.style.color = '#ff9900';
                comboFill.style.background = 'linear-gradient(to right, #ff9900, #ffcc00)';
            } else {
                comboNumber.style.color = '#ffff00';
                comboFill.style.background = 'linear-gradient(to right, #ffff00, #ffee00)';
            }
        } else {
            // Hide combo counter
            comboCounter.classList.add('hidden');
        }
    }
}

// Show score popup
function showScorePopup(points, combo) {
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    
    // Set content based on combo
    if (combo > 1) {
        popup.innerHTML = `
            <div class="score-points">+${points}</div>
            <div class="score-combo">x${combo} COMBO!</div>
        `;
    } else {
        popup.innerHTML = `<div class="score-points">+${points}</div>`;
    }
    
    // Style based on points
    if (points >= 500) {
        popup.classList.add('score-huge');
    } else if (points >= 200) {
        popup.classList.add('score-large');
    }
    
    // Add to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(popup);
    }
    
    // Position popup (random position above the player)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Position toward the center top of the screen
    popup.style.left = `${viewportWidth / 2 + (Math.random() - 0.5) * 200}px`;
    popup.style.top = `${viewportHeight / 3 + (Math.random() - 0.5) * 100}px`;
    
    // Remove after animation
    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 1500);
}

// Show game over screen with score
function showGameOverScreen() {
    // Remove existing screen if there is one
    const existingScreen = document.querySelector('.game-over-screen');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    // Create screen element
    const screen = document.createElement('div');
    screen.className = 'game-over-screen';
    
    // Build score breakdown HTML
    let breakdownHTML = '';
    for (const [category, value] of Object.entries(scoreState.scoreBreakdown)) {
        if (value > 0) {
            breakdownHTML += `
                <div class="score-category">
                    <div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                    <div class="category-value">${value.toLocaleString()}</div>
                </div>
            `;
        }
    }
    
    // Add content
    screen.innerHTML = `
        <div class="game-over-content">
            <h1>MISSION COMPLETE</h1>
            <div class="final-score-display">
                <div class="final-score-label">FINAL SCORE</div>
                <div class="final-score-value">${scoreState.currentScore.toLocaleString()}</div>
            </div>
            
            <div class="score-breakdown">
                <h2>Score Breakdown</h2>
                ${breakdownHTML}
            </div>
            
            <div class="high-scores-section">
                <h2>Top Scores</h2>
                <div class="high-scores-list">
                    ${generateHighScoreList()}
                </div>
            </div>
            
            <div class="game-over-buttons">
                <button class="game-over-button restart-button">Restart Mission</button>
                <button class="game-over-button menu-button">Main Menu</button>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(screen);
    
    // Pause game
    if (typeof gameState !== 'undefined' && gameState) {
        gameState.isPaused = true;
    }
    
    // Add button event listeners
    const restartButton = screen.querySelector('.restart-button');
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            // Remove screen
            screen.remove();
            
            // Restart current mission
            if (typeof restartGame === 'function') {
                restartGame();
            }
        });
    }
    
    const menuButton = screen.querySelector('.menu-button');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            // Remove screen
            screen.remove();
            
            // Go to main menu
            if (typeof showMainMenu === 'function') {
                showMainMenu();
            }
        });
    }
}

// Generate HTML for high score list
function generateHighScoreList() {
    if (scoreState.sessionScores.length === 0) {
        return '<div class="no-scores">No scores recorded yet</div>';
    }
    
    let html = '';
    scoreState.sessionScores.forEach((score, index) => {
        // Format date
        const date = new Date(score.date);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        html += `
            <div class="high-score-entry ${index === 0 ? 'top-score' : ''}">
                <div class="entry-rank">${index + 1}</div>
                <div class="entry-score">${score.score.toLocaleString()}</div>
                <div class="entry-date">${formattedDate}</div>
            </div>
        `;
    });
    
    return html;
}

// Show leaderboard screen
export function showLeaderboardScreen() {
    // Remove existing screen if there is one
    const existingScreen = document.querySelector('.leaderboard-screen');
    if (existingScreen) {
        existingScreen.remove();
        return;
    }
    
    // Create screen element
    const screen = document.createElement('div');
    screen.className = 'leaderboard-screen';
    
    // Add content
    screen.innerHTML = `
        <div class="leaderboard-content">
            <h1>LEADERBOARD</h1>
            
            <div class="leaderboard-section">
                <h2>Session Best Scores</h2>
                <div class="leaderboard-list">
                    ${generateHighScoreList()}
                </div>
            </div>
            
            <div class="all-time-high">
                <h2>All-Time High Score</h2>
                <div class="all-time-score">${scoreState.highScore.toLocaleString()}</div>
            </div>
            
            <button class="leaderboard-close">Close</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(screen);
    
    // Pause game
    if (typeof gameState !== 'undefined' && gameState) {
        gameState.isPaused = true;
    }
    
    // Add close button event listener
    const closeButton = screen.querySelector('.leaderboard-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            screen.remove();
            
            // Unpause game if it was running
            if (typeof gameState !== 'undefined' && gameState) {
                gameState.isPaused = false;
            }
        });
    }
}

// Add CSS styles for score system
function addScoreStyles() {
    // Check if styles already exist
    if (document.getElementById('score-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'score-styles';
    style.textContent = `
        .score-display {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Orbitron', sans-serif;
            color: #0cf;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
            z-index: 20;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .current-score {
            font-size: 36px;
            font-weight: bold;
        }
        
        .combo-counter {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            width: 150px;
        }
        
        .combo-counter.hidden {
            display: none;
        }
        
        .combo-number {
            font-size: 20px;
            font-weight: bold;
            color: #ff0;
        }
        
        .combo-bar {
            width: 100%;
            height: 6px;
            background-color: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .combo-fill {
            height: 100%;
            width: 100%;
            background: linear-gradient(to right, #ff0, #ff0);
            transition: width 0.1s linear;
        }
        
        .high-score {
            font-size: 14px;
            color: #0af;
        }
        
        .score-popup {
            position: absolute;
            font-family: 'Orbitron', sans-serif;
            color: #ff0;
            text-shadow: 0 0 8px rgba(255, 255, 0, 0.7);
            text-align: center;
            pointer-events: none;
            z-index: 30;
            animation: score-float 1.5s forwards ease-out;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .score-points {
            font-size: 24px;
            font-weight: bold;
        }
        
        .score-combo {
            font-size: 16px;
            color: #f60;
            text-shadow: 0 0 8px rgba(255, 102, 0, 0.7);
            margin-top: 2px;
        }
        
        .score-large .score-points {
            font-size: 32px;
            color: #f90;
            text-shadow: 0 0 12px rgba(255, 153, 0, 0.8);
        }
        
        .score-huge .score-points {
            font-size: 40px;
            color: #f00;
            text-shadow: 0 0 15px rgba(255, 0, 0, 0.9);
        }
        
        @keyframes score-float {
            0% { opacity: 0; transform: translateY(10px) scale(0.8); }
            10% { opacity: 1; transform: translateY(0) scale(1.1); }
            20% { transform: translateY(0) scale(1); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
        }
        
        .game-over-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 20, 0.9);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        }
        
        .game-over-content {
            width: 80%;
            max-width: 800px;
            background-color: rgba(0, 20, 40, 0.9);
            border: 3px solid #0cf;
            box-shadow: 0 0 30px rgba(0, 204, 255, 0.5);
            padding: 30px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .game-over-screen h1 {
            font-size: 40px;
            font-weight: bold;
            color: #0cf;
            text-align: center;
            margin: 0;
            text-shadow: 0 0 15px rgba(0, 204, 255, 0.7);
        }
        
        .game-over-screen h2 {
            font-size: 24px;
            color: #0af;
            margin: 10px 0;
            text-align: center;
            text-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
        }
        
        .final-score-display {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 20px 0;
        }
        
        .final-score-label {
            font-size: 18px;
            color: #0cf;
        }
        
        .final-score-value {
            font-size: 48px;
            font-weight: bold;
            color: #ff0;
            text-shadow: 0 0 20px rgba(255, 255, 0, 0.7);
        }
        
        .score-breakdown {
            border-top: 1px solid rgba(0, 204, 255, 0.5);
            padding-top: 10px;
        }
        
        .score-category {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            padding: 5px 20px;
        }
        
        .score-category:nth-child(odd) {
            background-color: rgba(0, 50, 100, 0.3);
        }
        
        .category-name {
            color: #0cf;
        }
        
        .category-value {
            color: #ff0;
            font-weight: bold;
        }
        
        .high-scores-section {
            margin-top: 10px;
            border-top: 1px solid rgba(0, 204, 255, 0.5);
            padding-top: 10px;
        }
        
        .high-scores-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .high-score-entry {
            display: grid;
            grid-template-columns: 40px 1fr 1fr;
            padding: 7px 10px;
            font-size: 14px;
            align-items: center;
        }
        
        .high-score-entry:nth-child(odd) {
            background-color: rgba(0, 50, 100, 0.3);
        }
        
        .high-score-entry.top-score {
            background-color: rgba(0, 50, 100, 0.5);
            border-left: 3px solid #ff0;
            font-weight: bold;
        }
        
        .entry-rank {
            color: #0cf;
            text-align: center;
            font-weight: bold;
        }
        
        .entry-score {
            color: #ff0;
            font-weight: bold;
            text-align: left;
        }
        
        .entry-date {
            color: #aaa;
            text-align: right;
            font-size: 12px;
        }
        
        .game-over-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        
        .game-over-button {
            background: linear-gradient(to bottom, rgba(0, 80, 160, 0.8), rgba(0, 40, 80, 0.8));
            border: 2px solid #0cf;
            color: #0cf;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            padding: 10px 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .game-over-button:hover {
            background: linear-gradient(to bottom, rgba(0, 100, 200, 0.8), rgba(0, 60, 120, 0.8));
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(0, 204, 255, 0.5);
        }
        
        .restart-button {
            background: linear-gradient(to bottom, rgba(0, 120, 0, 0.8), rgba(0, 60, 0, 0.8));
            border-color: #0f0;
            color: #0f0;
        }
        
        .restart-button:hover {
            background: linear-gradient(to bottom, rgba(0, 150, 0, 0.8), rgba(0, 80, 0, 0.8));
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .leaderboard-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 20, 0.9);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Orbitron', sans-serif;
            color: #fff;
        }
        
        .leaderboard-content {
            width: 70%;
            max-width: 600px;
            background-color: rgba(0, 20, 40, 0.9);
            border: 3px solid #0cf;
            box-shadow: 0 0 30px rgba(0, 204, 255, 0.5);
            padding: 30px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .leaderboard-screen h1 {
            font-size: 36px;
            font-weight: bold;
            color: #0cf;
            text-align: center;
            margin: 0;
            text-shadow: 0 0 15px rgba(0, 204, 255, 0.7);
        }
        
        .all-time-high {
            text-align: center;
            margin-top: 20px;
        }
        
        .all-time-score {
            font-size: 36px;
            font-weight: bold;
            color: #ff0;
            text-shadow: 0 0 15px rgba(255, 255, 0, 0.7);
        }
        
        .leaderboard-close {
            align-self: center;
            margin-top: 20px;
            background: linear-gradient(to bottom, rgba(100, 0, 0, 0.8), rgba(60, 0, 0, 0.8));
            border: 2px solid #f66;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            padding: 10px 30px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .leaderboard-close:hover {
            background: linear-gradient(to bottom, rgba(130, 0, 0, 0.8), rgba(80, 0, 0, 0.8));
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255, 102, 102, 0.5);
        }
        
        .no-scores {
            text-align: center;
            color: #aaa;
            font-style: italic;
            padding: 20px;
        }
    `;
    
    document.head.appendChild(style);
}

// Export score state for external access
export { scoreState };