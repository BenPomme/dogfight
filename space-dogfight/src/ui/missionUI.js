// Mission UI System
// This module handles mission UI rendering and interaction

import { missionState, MISSIONS, startMission, DIFFICULTY_LEVELS } from '../systems/missionSystem.js';

// UI elements
let missionPanel, missionTitle, missionTimer, objectivesContainer;
let missionSelectBtn;

// Initialize mission UI
export function initMissionUI() {
    createMissionPanel();
    createMissionSelectButton();
    
    // Add CSS styles
    addMissionStyles();
}

// Create mission panel on HUD
function createMissionPanel() {
    // Check if panel already exists
    if (document.getElementById('mission-panel')) return;
    
    // Create mission panel
    missionPanel = document.createElement('div');
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
    
    // Store references
    missionTitle = missionHeader.querySelector('.mission-title');
    missionTimer = missionHeader.querySelector('.mission-timer');
    
    // Add objectives container
    objectivesContainer = document.createElement('div');
    objectivesContainer.className = 'mission-objectives';
    objectivesContainer.innerHTML = '<div class="objectives-title">Objectives:</div>';
    missionPanel.appendChild(objectivesContainer);
    
    // Add to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(missionPanel);
    }
}

// Create mission selection button
function createMissionSelectButton() {
    missionSelectBtn = document.createElement('button');
    missionSelectBtn.id = 'mission-select-btn';
    missionSelectBtn.className = 'mission-select-btn';
    missionSelectBtn.textContent = 'Missions';
    
    // Add button to HUD
    const hud = document.getElementById('hud');
    if (hud) {
        hud.appendChild(missionSelectBtn);
    }
    
    // Add button event listener
    missionSelectBtn.addEventListener('click', showMissionSelectionPanel);
}

// Update mission UI
export function updateMissionUI() {
    if (!missionPanel) return;
    
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
        
        // Clear existing objectives
        while (objectivesContainer.childNodes.length > 1) {
            objectivesContainer.removeChild(objectivesContainer.lastChild);
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
        
        // Clear objectives
        while (objectivesContainer.childNodes.length > 1) {
            objectivesContainer.removeChild(objectivesContainer.lastChild);
        }
    }
}

// Show mission selection panel
export function showMissionSelectionPanel(gameState) {
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

// Show mission briefing dialog
export function showMissionBriefing(mission, gameState) {
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

// Show mission complete notification
export function showMissionComplete(message, rewards, gameState) {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.mission-complete, .mission-failed');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'mission-complete';
    
    // Build rewards HTML if provided
    let rewardsHTML = '';
    if (rewards) {
        rewardsHTML = `
            <div class="reward-section">
                <h3>Rewards:</h3>
                ${rewards.score ? `<p>Score: +${rewards.score}</p>` : ''}
                ${rewards.powerUps && rewards.powerUps.length ? 
                    `<p>Power-Ups: ${rewards.powerUps.join(', ')}</p>` : 
                    ''}
            </div>
        `;
    }
    
    notification.innerHTML = `
        <h2>Mission Complete!</h2>
        <p>${message}</p>
        ${rewardsHTML}
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
        setTimeout(() => showMissionSelectionPanel(gameState), 500);
    });
    
    // Show fireworks or celebration effects (optional)
    playCelebrationEffects();
}

// Show mission failed notification
export function showMissionFailed(reason, gameState) {
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
        setTimeout(() => showMissionSelectionPanel(gameState), 100);
    });
}

// Show objective complete notification
export function showObjectiveComplete(objective) {
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

// Add CSS styles for mission UI
function addMissionStyles() {
    // Check if styles already exist
    if (document.getElementById('mission-ui-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'mission-ui-styles';
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
            position: relative;
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
}

// Show score popup at a specific position
export function showScorePopup(score, position) {
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

// Format time in MM:SS format
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}