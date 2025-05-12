// Mission System for Space Dogfight
// This module handles mission management, objectives, progression, and rewards

// Mission types and difficulty levels
const MISSION_TYPES = {
    TUTORIAL: 'tutorial',
    DEFEND: 'defend',
    ATTACK: 'attack', 
    COLLECT: 'collect',
    ESCORT: 'escort',
    EXPLORE: 'explore',
    BOSS: 'boss'
};

const DIFFICULTY_LEVELS = {
    EASY: { name: 'Easy', multiplier: 1.0 },
    MEDIUM: { name: 'Medium', multiplier: 1.5 },
    HARD: { name: 'Hard', multiplier: 2.0 },
    EXPERT: { name: 'Expert', multiplier: 3.0 }
};

// Mission state to track progress
const missionState = {
    currentMission: null,
    activeMissions: [],
    completedMissions: [],
    availableMissions: [],
    missionProgress: {},
    globalProgress: {
        level: 1,
        totalScore: 0,
        enemiesDefeated: 0,
        missionsCompleted: 0
    }
};

// Mission definitions
const MISSIONS = [
    {
        id: 'tutorial',
        name: 'Flight Training',
        description: 'Learn the basic controls and flight mechanics of your spacecraft.',
        type: MISSION_TYPES.TUTORIAL,
        difficulty: DIFFICULTY_LEVELS.EASY,
        unlocked: true,
        objectives: [
            { id: 'fly_forward', description: 'Fly forward using W key', completed: false, count: 0, target: 1 },
            { id: 'use_pitch', description: 'Use arrow keys to control pitch', completed: false, count: 0, target: 1 },
            { id: 'use_roll', description: 'Roll the ship using Q and E', completed: false, count: 0, target: 1 },
            { id: 'fire_weapon', description: 'Fire your laser weapons', completed: false, count: 0, target: 5 },
            { id: 'fire_missile', description: 'Fire a missile', completed: false, count: 0, target: 1 }
        ],
        timeLimit: 180, // 3 minutes
        rewards: {
            score: 100,
            unlockMission: 'defend_outpost'
        },
        onStart: function(gameState) {
            // Set up tutorial environment
            showTutorialHints(true);
            spawnTutorialTargets(gameState);
        },
        onUpdate: function(gameState, deltaTime) {
            updateTutorialObjectives(gameState);
        },
        onComplete: function(gameState) {
            showTutorialHints(false);
            showMissionComplete('Tutorial Completed! You now have the basic flight skills needed for combat.');
        }
    },
    {
        id: 'defend_outpost',
        name: 'Defend the Outpost',
        description: 'Protect the orbital outpost from incoming enemy fighters.',
        type: MISSION_TYPES.DEFEND,
        difficulty: DIFFICULTY_LEVELS.EASY,
        unlocked: false,
        objectives: [
            { id: 'defeat_fighters', description: 'Defeat enemy fighters', completed: false, count: 0, target: 10 },
            { id: 'protect_outpost', description: 'Keep outpost health above 50%', completed: false, count: 0, target: 1 }
        ],
        timeLimit: 300, // 5 minutes
        rewards: {
            score: 500,
            powerUps: ['HEALTH', 'SHIELD'],
            unlockMission: ['attack_convoy', 'collect_resources']
        },
        onStart: function(gameState) {
            // Create outpost and enemies
            createSpaceOutpost(gameState);
            startEnemyWaves(gameState, 3, 5); // 3 waves of 5 enemies each
        },
        onUpdate: function(gameState, deltaTime) {
            updateDefendObjectives(gameState);
            
            // Check outpost health
            if (gameState.outpost && gameState.outpost.health <= 0) {
                return failMission('Outpost destroyed! Mission failed.');
            }
        },
        onComplete: function(gameState) {
            showMissionComplete('Outpost successfully defended! The commander sends thanks.');
        }
    },
    {
        id: 'attack_convoy',
        name: 'Attack Enemy Convoy',
        description: 'Destroy an enemy supply convoy to cut off their resources.',
        type: MISSION_TYPES.ATTACK,
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        unlocked: false,
        objectives: [
            { id: 'destroy_escorts', description: 'Eliminate escort fighters', completed: false, count: 0, target: 6 },
            { id: 'destroy_transports', description: 'Destroy transport ships', completed: false, count: 0, target: 3 }
        ],
        timeLimit: 420, // 7 minutes
        rewards: {
            score: 800,
            powerUps: ['WEAPON', 'MISSILES'],
            unlockMission: 'boss_battle'
        },
        onStart: function(gameState) {
            // Create convoy of transport ships with fighter escorts
            createConvoy(gameState);
        },
        onUpdate: function(gameState, deltaTime) {
            updateAttackObjectives(gameState);
        },
        onComplete: function(gameState) {
            showMissionComplete('Convoy destroyed! Enemy supply lines have been disrupted.');
        }
    },
    {
        id: 'collect_resources',
        name: 'Resource Collection',
        description: 'Gather vital resources from the asteroid field while avoiding hazards.',
        type: MISSION_TYPES.COLLECT,
        difficulty: DIFFICULTY_LEVELS.MEDIUM,
        unlocked: false,
        objectives: [
            { id: 'collect_minerals', description: 'Collect mineral deposits', completed: false, count: 0, target: 8 },
            { id: 'avoid_hazards', description: 'Avoid asteroid collisions', completed: false, count: 0, target: 1 }
        ],
        timeLimit: 360, // 6 minutes
        rewards: {
            score: 600,
            powerUps: ['SPEED', 'SHIELD'],
            unlockMission: 'boss_battle'
        },
        onStart: function(gameState) {
            // Create dense asteroid field with resource pickups
            createResourceAsteroidField(gameState);
        },
        onUpdate: function(gameState, deltaTime) {
            updateCollectionObjectives(gameState);
            
            // Fail if player collides with too many asteroids
            if (gameState.asteroidCollisions > 5) {
                return failMission('Too many collisions! Ship critically damaged.');
            }
        },
        onComplete: function(gameState) {
            showMissionComplete('Resources collected successfully! Our research teams can now proceed.');
        }
    },
    {
        id: 'boss_battle',
        name: 'Enemy Flagship',
        description: 'Destroy the enemy command ship to end their operations in this sector.',
        type: MISSION_TYPES.BOSS,
        difficulty: DIFFICULTY_LEVELS.HARD,
        unlocked: false,
        objectives: [
            { id: 'destroy_turrets', description: 'Destroy defense turrets', completed: false, count: 0, target: 4 },
            { id: 'disable_shields', description: 'Disable shield generators', completed: false, count: 0, target: 2 },
            { id: 'destroy_core', description: 'Destroy the flagship core', completed: false, count: 0, target: 1 }
        ],
        timeLimit: 600, // 10 minutes
        rewards: {
            score: 2000,
            powerUps: ['HEALTH', 'SHIELD', 'WEAPON', 'SPEED', 'MISSILES'],
            unlockMission: 'game_complete'
        },
        onStart: function(gameState) {
            // Create flagship with multiple components and phases
            createBossFlagship(gameState);
            // Add dramatic music
            playBossMusic(true);
        },
        onUpdate: function(gameState, deltaTime) {
            updateBossObjectives(gameState);
            
            // Update boss behavior based on health levels
            if (gameState.boss) {
                updateBossBehavior(gameState.boss);
            }
        },
        onComplete: function(gameState) {
            playBossMusic(false);
            playExplosionSequence(gameState.boss.position);
            showMissionComplete('Flagship destroyed! The sector is now secure. Congratulations commander!');
        }
    }
];

// Mission System Functions

// Initialize the mission system
function initMissionSystem() {
    // Reset mission state
    missionState.currentMission = null;
    missionState.activeMissions = [];
    missionState.completedMissions = [];
    missionState.availableMissions = [];
    missionState.missionProgress = {};
    
    // Reset global progress
    missionState.globalProgress = {
        level: 1,
        totalScore: 0,
        enemiesDefeated: 0,
        missionsCompleted: 0
    };
    
    // Add available missions based on unlock status
    MISSIONS.forEach(mission => {
        if (mission.unlocked) {
            missionState.availableMissions.push(mission.id);
        }
    });
    
    // Create mission UI elements
    createMissionUI();
}

// Start a specific mission by ID
function startMission(missionId, gameState) {
    // Find the mission by ID
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission) {
        console.error(`Mission ${missionId} not found!`);
        return false;
    }
    
    // Check if mission is available
    if (!missionState.availableMissions.includes(missionId)) {
        console.warn(`Mission ${missionId} is not available yet!`);
        return false;
    }
    
    // Reset mission objectives
    mission.objectives.forEach(obj => {
        obj.completed = false;
        obj.count = 0;
    });
    
    // Set current mission
    missionState.currentMission = mission;
    
    // Create mission state in progress tracker
    missionState.missionProgress = {
        id: mission.id,
        startTime: Date.now(),
        timeRemaining: mission.timeLimit,
        completed: false,
        failed: false,
        objectives: [...mission.objectives]
    };
    
    // Show mission briefing
    showMissionBriefing(mission);
    
    // Call mission's onStart function
    if (mission.onStart && typeof mission.onStart === 'function') {
        mission.onStart(gameState);
    }
    
    // Update mission UI
    updateMissionUI();
    
    return true;
}

// Update mission progress
function updateMission(gameState, deltaTime) {
    if (!missionState.currentMission || !missionState.missionProgress) return;
    
    // Update time remaining
    if (missionState.missionProgress.timeRemaining > 0) {
        missionState.missionProgress.timeRemaining -= deltaTime;
    } else if (!missionState.missionProgress.completed && !missionState.missionProgress.failed) {
        // Time's up - fail the mission
        failMission('Time expired! Mission failed.');
        return;
    }
    
    // Call mission's onUpdate function
    if (missionState.currentMission.onUpdate && typeof missionState.currentMission.onUpdate === 'function') {
        missionState.currentMission.onUpdate(gameState, deltaTime);
    }
    
    // Check if all objectives are complete
    const allCompleted = missionState.missionProgress.objectives.every(obj => obj.completed);
    if (allCompleted && !missionState.missionProgress.completed && !missionState.missionProgress.failed) {
        completeMission(gameState);
    }
    
    // Update UI
    updateMissionUI();
}

// Mark an objective as complete or increment its counter
function updateObjective(objectiveId, increment = 1, completed = false) {
    if (!missionState.currentMission || !missionState.missionProgress) return;
    
    // Find the objective
    const objective = missionState.missionProgress.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
        console.warn(`Objective ${objectiveId} not found in current mission!`);
        return;
    }
    
    // Update the objective
    if (completed) {
        objective.completed = true;
        objective.count = objective.target;
    } else {
        objective.count += increment;
        if (objective.count >= objective.target) {
            objective.completed = true;
            objective.count = objective.target;
            
            // Notify player
            showObjectiveComplete(objective);
        }
    }
    
    // Update UI
    updateMissionUI();
}

// Complete the current mission
function completeMission(gameState) {
    if (!missionState.currentMission || !missionState.missionProgress.completed) {
        // Mark mission as completed
        missionState.missionProgress.completed = true;
        
        // Add to completed missions
        missionState.completedMissions.push(missionState.currentMission.id);
        
        // Remove from active missions
        const index = missionState.activeMissions.indexOf(missionState.currentMission.id);
        if (index > -1) {
            missionState.activeMissions.splice(index, 1);
        }
        
        // Update global progress
        missionState.globalProgress.missionsCompleted++;
        missionState.globalProgress.totalScore += missionState.currentMission.rewards.score;
        
        // Unlock new missions
        if (missionState.currentMission.rewards.unlockMission) {
            const unlocks = Array.isArray(missionState.currentMission.rewards.unlockMission) 
                ? missionState.currentMission.rewards.unlockMission 
                : [missionState.currentMission.rewards.unlockMission];
                
            unlocks.forEach(missionId => {
                // Find mission
                const mission = MISSIONS.find(m => m.id === missionId);
                if (mission) {
                    mission.unlocked = true;
                    if (!missionState.availableMissions.includes(missionId)) {
                        missionState.availableMissions.push(missionId);
                    }
                }
            });
        }
        
        // Call mission's onComplete function
        if (missionState.currentMission.onComplete && typeof missionState.currentMission.onComplete === 'function') {
            missionState.currentMission.onComplete(gameState);
        }
        
        // Award rewards
        awardMissionRewards(gameState, missionState.currentMission.rewards);
        
        // Notify player
        showMissionComplete(`Mission Completed: ${missionState.currentMission.name}`);
    }
}

// Fail the current mission
function failMission(reason) {
    if (!missionState.currentMission || missionState.missionProgress.failed) return;
    
    // Mark mission as failed
    missionState.missionProgress.failed = true;
    
    // Notify player
    showMissionFailed(reason || 'Mission Failed!');
    
    // Remove from active missions
    const index = missionState.activeMissions.indexOf(missionState.currentMission.id);
    if (index > -1) {
        missionState.activeMissions.splice(index, 1);
    }
}

// Award mission rewards to the player
function awardMissionRewards(gameState, rewards) {
    if (!rewards) return;
    
    // Award score
    if (rewards.score) {
        // Update global score
        missionState.globalProgress.totalScore += rewards.score;
        
        // Show score popup
        showScorePopup(rewards.score);
    }
    
    // Award power-ups
    if (rewards.powerUps && Array.isArray(rewards.powerUps)) {
        rewards.powerUps.forEach(powerUpType => {
            // Create power-up near player
            const playerPos = gameState.player.position.clone();
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            // Spread them out a bit
            playerPos.add(offset);
            
            // Create with longer lifetime
            createPowerUp(powerUpType, playerPos, 60); // 60 second lifetime
        });
    }
}

// Mission UI Functions

// Create the mission UI elements
function createMissionUI() {
    // Check if UI already exists
    if (document.getElementById('mission-panel')) return;
    
    // Create mission panel
    const missionPanel = document.createElement('div');
    missionPanel.id = 'mission-panel';
    missionPanel.className = 'mission-panel';
    
    // Add mission header
    const missionHeader = document.createElement('div');
    missionHeader.className = 'mission-header';
    missionHeader.innerHTML = `
        <div class="mission-title">No Active Mission</div>
        <div class="mission-timer">--:--</div>
    `;
    missionPanel.appendChild(missionHeader);
    
    // Add objectives container
    const objectivesContainer = document.createElement('div');
    objectivesContainer.className = 'mission-objectives';
    objectivesContainer.innerHTML = '<div class="objectives-title">Objectives:</div>';
    missionPanel.appendChild(objectivesContainer);
    
    // Add to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(missionPanel);
    }
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .mission-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 300px;
            background-color: rgba(0, 10, 20, 0.8);
            border: 2px solid #0cf;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
            color: #fff;
            padding: 10px;
            font-family: 'Orbitron', sans-serif;
            display: flex;
            flex-direction: column;
            z-index: 20;
        }
        
        .mission-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #0cf;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        
        .mission-title {
            font-size: 18px;
            font-weight: bold;
            color: #0cf;
        }
        
        .mission-timer {
            font-size: 16px;
            font-weight: bold;
            color: #0cf;
        }
        
        .mission-objectives {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .objectives-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #0cf;
        }
        
        .objective-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            padding: 3px 5px;
        }
        
        .objective-complete {
            color: #0f0;
            text-decoration: line-through;
        }
        
        .objective-incomplete {
            color: #fff;
        }
        
        .objective-progress {
            font-size: 12px;
            color: #0cf;
        }
        
        .mission-briefing {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60%;
            background-color: rgba(0, 20, 40, 0.9);
            border: 2px solid #0cf;
            box-shadow: 0 0 20px rgba(0, 204, 255, 0.7);
            padding: 20px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .mission-complete, .mission-failed {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 20, 40, 0.9);
            border: 3px solid #0cf;
            box-shadow: 0 0 25px rgba(0, 204, 255, 0.8);
            padding: 20px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            z-index: 100;
            text-align: center;
            min-width: 300px;
        }
        
        .mission-complete {
            border-color: #0f0;
            box-shadow: 0 0 25px rgba(0, 255, 0, 0.8);
        }
        
        .mission-failed {
            border-color: #f00;
            box-shadow: 0 0 25px rgba(255, 0, 0, 0.8);
        }
        
        .briefing-title {
            font-size: 24px;
            font-weight: bold;
            color: #0cf;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .briefing-description {
            font-size: 16px;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .briefing-objectives {
            border-top: 1px solid #0cf;
            padding-top: 10px;
        }
        
        .briefing-objective {
            padding: 5px 0;
            display: flex;
            align-items: center;
        }
        
        .briefing-objective:before {
            content: "•";
            color: #0cf;
            margin-right: 10px;
        }
        
        .briefing-button-row {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        
        .briefing-button {
            background: linear-gradient(to right, rgba(0, 30, 60, 0.8), rgba(0, 60, 90, 0.8));
            border: 2px solid #0cf;
            color: #0cf;
            padding: 10px 20px;
            font-size: 16px;
            font-family: 'Orbitron', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .briefing-button:hover {
            background: linear-gradient(to right, rgba(0, 40, 80, 0.8), rgba(0, 80, 120, 0.8));
            transform: scale(1.05);
        }
        
        .objective-notification {
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 20, 40, 0.8);
            border: 2px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            border-radius: 5px;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.6);
            animation: notification-fade 3s forwards;
            z-index: 50;
        }
        
        @keyframes notification-fade {
            0% { opacity: 0; transform: translate(-50%, 20px); }
            20% { opacity: 1; transform: translate(-50%, 0); }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translate(-50%, -20px); }
        }
        
        .score-popup {
            position: absolute;
            font-family: 'Orbitron', sans-serif;
            font-size: 20px;
            font-weight: bold;
            color: #ff0;
            text-shadow: 0 0 10px rgba(255, 255, 0, 0.7);
            z-index: 50;
            animation: score-float 2s forwards;
        }
        
        @keyframes score-float {
            0% { opacity: 0; transform: translateY(0); }
            10% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-50px); }
        }
    `;
    document.head.appendChild(style);
    
    // Create mission selection interface
    createMissionSelectionUI();
}

// Update mission UI to match current mission state
function updateMissionUI() {
    const missionPanel = document.getElementById('mission-panel');
    if (!missionPanel) return;
    
    const missionTitle = missionPanel.querySelector('.mission-title');
    const missionTimer = missionPanel.querySelector('.mission-timer');
    const objectivesContainer = missionPanel.querySelector('.mission-objectives');
    
    // Clear existing objectives
    while (objectivesContainer.childNodes.length > 1) {
        objectivesContainer.removeChild(objectivesContainer.lastChild);
    }
    
    if (missionState.currentMission && missionState.missionProgress) {
        // Update mission title
        missionTitle.textContent = missionState.currentMission.name;
        
        // Update timer
        const minutes = Math.floor(missionState.missionProgress.timeRemaining / 60);
        const seconds = Math.floor(missionState.missionProgress.timeRemaining % 60);
        missionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Timer color based on time remaining
        if (missionState.missionProgress.timeRemaining < 30) {
            missionTimer.style.color = '#f00'; // Red when < 30 seconds
        } else if (missionState.missionProgress.timeRemaining < 60) {
            missionTimer.style.color = '#ff0'; // Yellow when < 60 seconds
        } else {
            missionTimer.style.color = '#0cf'; // Default blue
        }
        
        // Add objectives
        missionState.missionProgress.objectives.forEach(objective => {
            const objectiveElement = document.createElement('div');
            objectiveElement.className = `objective-item ${objective.completed ? 'objective-complete' : 'objective-incomplete'}`;
            
            // Create main text and progress indicator
            let progressText = '';
            if (objective.target > 1) {
                progressText = ` (${objective.count}/${objective.target})`;
            }
            
            objectiveElement.innerHTML = `
                <div class="objective-text">${objective.description}</div>
                <div class="objective-progress">${progressText}</div>
            `;
            
            objectivesContainer.appendChild(objectiveElement);
        });
    } else {
        // No active mission
        missionTitle.textContent = 'No Active Mission';
        missionTimer.textContent = '--:--';
        missionTimer.style.color = '#0cf';
    }
}

// Show mission briefing dialog
function showMissionBriefing(mission) {
    // Remove existing briefing if there is one
    const existingBriefing = document.querySelector('.mission-briefing');
    if (existingBriefing) {
        existingBriefing.remove();
    }
    
    // Create briefing element
    const briefing = document.createElement('div');
    briefing.className = 'mission-briefing';
    
    // Add briefing content
    let objectivesHTML = '';
    mission.objectives.forEach(obj => {
        objectivesHTML += `<div class="briefing-objective">${obj.description}${obj.target > 1 ? ` (0/${obj.target})` : ''}</div>`;
    });
    
    briefing.innerHTML = `
        <div class="briefing-title">${mission.name}</div>
        <div class="briefing-description">${mission.description}</div>
        <div class="briefing-objectives">
            <h3>Objectives:</h3>
            ${objectivesHTML}
        </div>
        <div class="briefing-difficulty">Difficulty: ${mission.difficulty.name}</div>
        <div class="briefing-time">Time Limit: ${formatTime(mission.timeLimit)}</div>
        <div class="briefing-button-row">
            <button class="briefing-button" id="start-mission-btn">Start Mission</button>
            <button class="briefing-button" id="cancel-mission-btn">Cancel</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(briefing);
    
    // Pause game
    if (gameState && !gameState.isPaused) {
        gameState.isPaused = true;
    }
    
    // Add button event listeners
    document.getElementById('start-mission-btn').addEventListener('click', () => {
        briefing.remove();
        if (gameState) {
            gameState.isPaused = false;
        }
    });
    
    document.getElementById('cancel-mission-btn').addEventListener('click', () => {
        briefing.remove();
        missionState.currentMission = null;
        missionState.missionProgress = null;
        updateMissionUI();
        
        if (gameState) {
            gameState.isPaused = false;
        }
    });
}

// Show mission selection UI
function createMissionSelectionUI() {
    // Create mission selection button
    const missionSelectBtn = document.createElement('button');
    missionSelectBtn.id = 'mission-select-btn';
    missionSelectBtn.className = 'mission-select-btn';
    missionSelectBtn.textContent = 'Missions';
    
    // Add button to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(missionSelectBtn);
    }
    
    // Add CSS for button
    const style = document.createElement('style');
    style.textContent = `
        .mission-select-btn {
            position: absolute;
            top: 20px;
            left: 300px;
            background: linear-gradient(to right, rgba(0, 30, 60, 0.8), rgba(0, 60, 90, 0.8));
            border: 2px solid #0cf;
            color: #0cf;
            padding: 8px 15px;
            font-size: 14px;
            font-family: 'Orbitron', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            z-index: 30;
        }
        
        .mission-select-btn:hover {
            background: linear-gradient(to right, rgba(0, 40, 80, 0.8), rgba(0, 80, 120, 0.8));
            transform: scale(1.05);
        }
        
        .mission-selection {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            max-width: 800px;
            background-color: rgba(0, 20, 40, 0.95);
            border: 2px solid #0cf;
            box-shadow: 0 0 20px rgba(0, 204, 255, 0.7);
            padding: 20px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .mission-selection-title {
            font-size: 24px;
            font-weight: bold;
            color: #0cf;
            text-align: center;
            margin-bottom: 15px;
        }
        
        .mission-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 10px;
        }
        
        .mission-card {
            background-color: rgba(0, 30, 60, 0.8);
            border: 2px solid #088;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: all 0.2s;
        }
        
        .mission-card:hover {
            border-color: #0cf;
            box-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
        }
        
        .mission-card.locked {
            opacity: 0.7;
            border-color: #444;
        }
        
        .mission-card.locked:after {
            content: "🔒 LOCKED";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: #f00;
            padding: 5px 10px;
            font-weight: bold;
            font-size: 16px;
        }
        
        .mission-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .mission-card-title {
            font-size: 18px;
            font-weight: bold;
            color: #0cf;
        }
        
        .mission-card-type {
            font-size: 12px;
            background-color: rgba(0, 60, 90, 0.8);
            padding: 2px 8px;
            border-radius: 10px;
            text-transform: uppercase;
        }
        
        .mission-card-description {
            font-size: 14px;
            line-height: 1.4;
            flex-grow: 1;
        }
        
        .mission-card-difficulty {
            font-size: 12px;
            color: #0cf;
        }
        
        .mission-card-button {
            background: linear-gradient(to right, rgba(0, 40, 80, 0.8), rgba(0, 80, 120, 0.8));
            border: 1px solid #0cf;
            color: #0cf;
            padding: 5px 10px;
            font-size: 14px;
            font-family: 'Orbitron', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }
        
        .mission-card-button:hover {
            background: linear-gradient(to right, rgba(0, 60, 100, 0.8), rgba(0, 100, 140, 0.8));
        }
        
        .mission-card.locked .mission-card-button {
            background: rgba(60, 60, 60, 0.5);
            border-color: #444;
            color: #888;
            cursor: not-allowed;
        }
        
        .mission-selection-close {
            align-self: center;
            margin-top: 20px;
            background: linear-gradient(to right, rgba(60, 0, 0, 0.8), rgba(100, 0, 0, 0.8));
            border: 2px solid #f66;
            color: #fff;
            padding: 8px 20px;
            font-size: 16px;
            font-family: 'Orbitron', sans-serif;
            cursor: pointer;
        }
        
        .mission-selection-close:hover {
            background: linear-gradient(to right, rgba(80, 0, 0, 0.8), rgba(120, 0, 0, 0.8));
        }
    `;
    document.head.appendChild(style);
    
    // Add button event listener
    missionSelectBtn.addEventListener('click', showMissionSelectionPanel);
}

// Show mission selection panel
function showMissionSelectionPanel() {
    // Remove existing panel if there is one
    const existingPanel = document.querySelector('.mission-selection');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }
    
    // Create selection panel
    const panel = document.createElement('div');
    panel.className = 'mission-selection';
    
    // Add title
    const title = document.createElement('div');
    title.className = 'mission-selection-title';
    title.textContent = 'Available Missions';
    panel.appendChild(title);
    
    // Create mission list
    const missionList = document.createElement('div');
    missionList.className = 'mission-list';
    
    // Add mission cards
    MISSIONS.forEach(mission => {
        const isAvailable = missionState.availableMissions.includes(mission.id);
        const isCompleted = missionState.completedMissions.includes(mission.id);
        
        const missionCard = document.createElement('div');
        missionCard.className = `mission-card ${!isAvailable ? 'locked' : ''}`;
        
        let statusClass = '';
        let statusLabel = '';
        
        if (isCompleted) {
            statusClass = 'completed';
            statusLabel = '✓ COMPLETED';
        } else if (!isAvailable) {
            statusClass = 'locked';
            statusLabel = '🔒 LOCKED';
        }
        
        missionCard.innerHTML = `
            <div class="mission-card-header">
                <div class="mission-card-title">${mission.name}</div>
                <div class="mission-card-type">${mission.type}</div>
            </div>
            <div class="mission-card-description">${mission.description}</div>
            <div class="mission-card-difficulty">Difficulty: ${mission.difficulty.name}</div>
            <div class="mission-card-time">Time Limit: ${formatTime(mission.timeLimit)}</div>
            <div class="mission-card-status ${statusClass}">${statusLabel}</div>
            <button class="mission-card-button" data-mission-id="${mission.id}" ${!isAvailable ? 'disabled' : ''}>Select Mission</button>
        `;
        
        missionList.appendChild(missionCard);
    });
    
    panel.appendChild(missionList);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'mission-selection-close';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => {
        panel.remove();
        if (gameState) {
            gameState.isPaused = false;
        }
    });
    panel.appendChild(closeButton);
    
    // Add to document
    document.body.appendChild(panel);
    
    // Pause game
    if (gameState && !gameState.isPaused) {
        gameState.isPaused = true;
    }
    
    // Add mission select button event listeners
    const missionButtons = document.querySelectorAll('.mission-card-button:not([disabled])');
    missionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const missionId = button.getAttribute('data-mission-id');
            panel.remove();
            
            // Start the selected mission
            startMission(missionId, gameState);
            
            if (gameState) {
                gameState.isPaused = false;
            }
        });
    });
}

// Show mission complete notification
function showMissionComplete(message) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.mission-complete, .mission-failed');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'mission-complete';
    
    notification.innerHTML = `
        <h2>Mission Complete!</h2>
        <p>${message}</p>
        <div class="reward-section">
            <h3>Rewards:</h3>
            <p>Score: +${missionState.currentMission.rewards.score}</p>
            ${missionState.currentMission.rewards.powerUps ? 
                `<p>Power-Ups: ${missionState.currentMission.rewards.powerUps.join(', ')}</p>` : 
                ''}
        </div>
        <button class="briefing-button" id="continue-btn">Continue</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Pause game
    if (gameState && !gameState.isPaused) {
        gameState.isPaused = true;
    }
    
    // Add continue button event listener
    document.getElementById('continue-btn').addEventListener('click', () => {
        notification.remove();
        if (gameState) {
            gameState.isPaused = false;
        }
        
        // Show mission selection after a short delay
        setTimeout(showMissionSelectionPanel, 500);
    });
    
    // Show fireworks or celebration effects (optional)
    playCelebrationEffects();
}

// Show mission failed notification
function showMissionFailed(reason) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.mission-complete, .mission-failed');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'mission-failed';
    
    notification.innerHTML = `
        <h2>Mission Failed</h2>
        <p>${reason}</p>
        <div class="briefing-button-row">
            <button class="briefing-button" id="retry-btn">Retry Mission</button>
            <button class="briefing-button" id="missions-btn">Mission Select</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Pause game
    if (gameState && !gameState.isPaused) {
        gameState.isPaused = true;
    }
    
    // Add button event listeners
    document.getElementById('retry-btn').addEventListener('click', () => {
        notification.remove();
        
        // Restart the same mission
        if (missionState.currentMission) {
            startMission(missionState.currentMission.id, gameState);
        }
        
        if (gameState) {
            gameState.isPaused = false;
        }
    });
    
    document.getElementById('missions-btn').addEventListener('click', () => {
        notification.remove();
        if (gameState) {
            gameState.isPaused = false;
        }
        
        // Show mission selection
        setTimeout(showMissionSelectionPanel, 100);
    });
}

// Show objective complete notification
function showObjectiveComplete(objective) {
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'objective-notification';
    notification.textContent = `Objective Complete: ${objective.description}`;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Show score popup at a specific position
function showScorePopup(score, position) {
    // Create score popup
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${score}`;
    
    // Position it
    if (position) {
        popup.style.left = `${position.x}px`;
        popup.style.top = `${position.y}px`;
    } else {
        // Default position in center of screen
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
    }
    
    // Add to document
    document.body.appendChild(popup);
    
    // Remove after animation completes
    setTimeout(() => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    }, 2000);
}

// Play celebration effects for mission completion
function playCelebrationEffects() {
    // TODO: Add particle effects, sound, etc.
}

// Tutorial Functions

// Show tutorial hints
function showTutorialHints(show) {
    // Remove existing hints
    const existingHints = document.querySelector('.tutorial-hints');
    if (existingHints) {
        existingHints.remove();
    }
    
    if (!show) return;
    
    // Create hints container
    const hintsContainer = document.createElement('div');
    hintsContainer.className = 'tutorial-hints';
    
    // Add CSS if needed
    if (!document.querySelector('#tutorial-styles')) {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
            .tutorial-hints {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 20, 40, 0.8);
                border: 2px solid #0cf;
                padding: 15px;
                color: #fff;
                font-family: 'Orbitron', sans-serif;
                z-index: 50;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 500px;
            }
            
            .tutorial-title {
                font-size: 18px;
                font-weight: bold;
                color: #0cf;
                margin-bottom: 5px;
                text-align: center;
            }
            
            .tutorial-controls {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 10px;
                align-items: center;
            }
            
            .key {
                display: inline-block;
                background-color: rgba(0, 40, 80, 0.8);
                border: 1px solid #0cf;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
                text-align: center;
                min-width: 30px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add tutorial content
    hintsContainer.innerHTML = `
        <div class="tutorial-title">Flight Controls</div>
        <div class="tutorial-controls">
            <div class="key">W</div>
            <div>Accelerate forward</div>
            
            <div class="key">↑↓</div>
            <div>Pitch up/down</div>
            
            <div class="key">←→</div>
            <div>Turn left/right</div>
            
            <div class="key">Q</div><div>Roll left</div>
            <div class="key">E</div><div>Roll right</div>
            
            <div class="key">Space</div>
            <div>Fire lasers</div>
            
            <div class="key">D</div>
            <div>Fire missiles</div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(hintsContainer);
}

// Spawn tutorial targets
function spawnTutorialTargets(gameState) {
    // Create simple targets for the player to aim at
    const targetPositions = [
        new THREE.Vector3(20, 0, -20),
        new THREE.Vector3(-15, 10, -25),
        new THREE.Vector3(0, -10, -30),
        new THREE.Vector3(30, 5, -10),
        new THREE.Vector3(-20, -5, -15)
    ];
    
    // Clear any existing targets
    const existingTargets = gameState.entities.filter(e => e.isTutorialTarget);
    existingTargets.forEach(target => {
        if (target.mesh) {
            gameState.scene.remove(target.mesh);
        }
        target.isAlive = false;
    });
    
    // Create new targets
    targetPositions.forEach((position, index) => {
        // Create target geometry
        const geometry = new THREE.TorusGeometry(2, 0.5, 8, 24);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00aaff,
            shininess: 100,
            transparent: true,
            opacity: 0.8
        });
        
        const target = new THREE.Mesh(geometry, material);
        target.position.copy(position);
        
        // Rotate to face player
        target.lookAt(0, 0, 0);
        
        gameState.scene.add(target);
        
        // Create target entity
        const targetEntity = {
            mesh: target,
            position: target.position,
            rotation: target.rotation,
            radius: 2,
            health: 20,
            isAlive: true,
            isTutorialTarget: true,
            
            update: function(deltaTime) {
                // Rotate slowly
                this.rotation.z += deltaTime * 0.5;
                this.mesh.rotation.z = this.rotation.z;
                
                // Pulse size
                const pulse = 0.95 + Math.sin(Date.now() * 0.002) * 0.05;
                this.mesh.scale.set(pulse, pulse, pulse);
                
                // Always look at player but maintain z rotation
                if (gameState.player) {
                    const targetRotation = new THREE.Euler();
                    this.mesh.lookAt(gameState.player.position);
                    targetRotation.copy(this.mesh.rotation);
                    targetRotation.z = this.rotation.z;
                    this.mesh.rotation.copy(targetRotation);
                }
            }
        };
        
        gameState.entities.push(targetEntity);
    });
}

// Update tutorial objectives based on player actions
function updateTutorialObjectives(gameState) {
    const objectives = missionState.missionProgress.objectives;
    
    // Check W key press
    if (gameState.keys.w && !objectives[0].completed) {
        updateObjective('fly_forward', 1, true);
    }
    
    // Check arrow keys for pitch
    if ((gameState.keys.arrowUp || gameState.keys.arrowDown) && !objectives[1].completed) {
        updateObjective('use_pitch', 1, true);
    }
    
    // Check Q/E for roll
    if ((gameState.keys.q || gameState.keys.e) && !objectives[2].completed) {
        updateObjective('use_roll', 1, true);
    }
    
    // Check for firing weapons - handled in weapon firing functions
}

// Utility Functions

// Format time in MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Export mission system functions
export {
    initMissionSystem,
    startMission,
    updateMission,
    updateObjective,
    completeMission,
    failMission,
    missionState,
    MISSION_TYPES,
    DIFFICULTY_LEVELS,
    MISSIONS
};