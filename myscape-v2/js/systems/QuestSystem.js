/**
 * QuestSystem.js - Quest Management System
 * 
 * Manages all quests, quest states, progress tracking, and rewards.
 * Supports multiple quest types: talk_npc, gather, kill, equip, use.
 * Handles quest requirements, stage progression, and reward distribution.
 * 
 * @class QuestSystem
 */

class QuestSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null;
        
        // Quest states
        this.activeQuests = new Map(); // questId -> quest state
        this.completedQuests = new Set(); // Set of completed quest IDs
        this.questProgress = new Map(); // questId -> progress data
        
        // Player quest data
        this.questPoints = 0;
        
        // Quest state enum
        this.QuestState = {
            NOT_STARTED: 'not_started',
            IN_PROGRESS: 'in_progress',
            COMPLETED: 'completed'
        };
        
        // Stage type handlers
        this.stageHandlers = {
            'talk_npc': this.handleTalkNPC.bind(this),
            'gather': this.handleGather.bind(this),
            'kill': this.handleKill.bind(this),
            'equip': this.handleEquip.bind(this),
            'use': this.handleUse.bind(this)
        };
        
        console.log('QuestSystem initialized');
    }
    
    /**
     * Initialize the quest system
     * @param {object} gameConfig - Game configuration object
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        
        // Setup event listeners for quest progress tracking
        this.setupEventListeners();
        
        console.log('QuestSystem ready with', Object.keys(gameConfig.quests).length, 'quests');
    }
    
    /**
     * Setup event listeners for automatic progress tracking
     */
    setupEventListeners() {
        // Listen for NPC interactions
        this.gameEngine.on('npc:talked', (data) => {
            this.onNPCTalked(data.npcId);
        });
        
        // Listen for resource gathering
        this.gameEngine.on('resource:gathered', (data) => {
            this.onResourceGathered(data.resourceId, data.amount);
        });
        
        // Listen for enemy kills
        this.gameEngine.on('enemy:killed', (data) => {
            this.onEnemyKilled(data.enemyType);
        });
        
        // Listen for item equipping
        this.gameEngine.on('equipment:equipped', (data) => {
            this.onItemEquipped(data.itemId);
        });
        
        // Listen for item usage
        this.gameEngine.on('item:used', (data) => {
            this.onItemUsed(data.itemId);
        });
    }
    
    /**
     * Get quest configuration data
     * @param {string} questId - Quest ID
     * @returns {object|null} Quest config
     */
    getQuestConfig(questId) {
        if (!this.gameConfig || !this.gameConfig.quests) {
            console.error('Quest config not loaded');
            return null;
        }
        
        return this.gameConfig.quests[questId] || null;
    }
    
    /**
     * Get quest state
     * @param {string} questId - Quest ID
     * @returns {string} Quest state (not_started, in_progress, completed)
     */
    getQuestState(questId) {
        if (this.completedQuests.has(questId)) {
            return this.QuestState.COMPLETED;
        }
        
        if (this.activeQuests.has(questId)) {
            return this.QuestState.IN_PROGRESS;
        }
        
        return this.QuestState.NOT_STARTED;
    }
    
    /**
     * Check if player can start quest
     * @param {string} questId - Quest ID
     * @returns {object} Result with canStart and reason
     */
    canStartQuest(questId) {
        const questConfig = this.getQuestConfig(questId);
        
        if (!questConfig) {
            return { canStart: false, reason: 'Quest not found' };
        }
        
        // Check if already completed
        if (this.completedQuests.has(questId)) {
            return { canStart: false, reason: 'Quest already completed' };
        }
        
        // Check if already active
        if (this.activeQuests.has(questId)) {
            return { canStart: false, reason: 'Quest already in progress' };
        }
        
        // Check skill requirements
        if (questConfig.requirements) {
            const player = this.gameEngine.player;
            
            for (const [skill, requiredLevel] of Object.entries(questConfig.requirements)) {
                const playerSkill = player.skills[skill];
                const playerLevel = playerSkill ? playerSkill.level : 1;
                
                if (playerLevel < requiredLevel) {
                    return { 
                        canStart: false, 
                        reason: `Requires ${skill} level ${requiredLevel} (you have ${playerLevel})`
                    };
                }
            }
        }
        
        return { canStart: true };
    }
    
    /**
     * Start a quest
     * @param {string} questId - Quest ID to start
     * @returns {object} Result with success status
     */
    startQuest(questId) {
        const canStart = this.canStartQuest(questId);
        
        if (!canStart.canStart) {
            console.warn('Cannot start quest:', canStart.reason);
            return { success: false, reason: canStart.reason };
        }
        
        const questConfig = this.getQuestConfig(questId);
        
        // Initialize quest state
        const questState = {
            questId: questId,
            name: questConfig.name,
            currentStage: 0,
            startedAt: Date.now(),
            progress: {}
        };
        
        // Initialize progress for first stage
        const firstStage = questConfig.stages[0];
        questState.progress[0] = this.initializeStageProgress(firstStage);
        
        this.activeQuests.set(questId, questState);
        
        console.log(`✨ Quest started: ${questConfig.name}`);
        
        // Emit event
        this.gameEngine.emit('quest:started', { questId, questName: questConfig.name });
        
        // Show system message
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.showNotification(`Quest started: ${questConfig.name}`, 'quest');
        }
        
        return { success: true, questState };
    }
    
    /**
     * Initialize stage progress tracking
     * @param {object} stage - Stage configuration
     * @returns {object} Initial progress data
     */
    initializeStageProgress(stage) {
        const progress = {
            type: stage.type,
            completed: false,
            description: stage.description
        };
        
        // Type-specific initialization
        switch (stage.type) {
            case 'gather':
                progress.target = stage.resource;
                progress.required = stage.amount || 1;
                progress.current = 0;
                break;
                
            case 'kill':
                progress.target = stage.enemy;
                progress.required = stage.amount || 1;
                progress.current = 0;
                break;
                
            case 'talk_npc':
                progress.target = stage.target;
                progress.completed = false;
                break;
                
            case 'equip':
                progress.target = stage.item;
                progress.completed = false;
                break;
                
            case 'use':
                progress.target = stage.item;
                progress.completed = false;
                break;
        }
        
        return progress;
    }
    
    /**
     * Update quest progress
     * @param {string} questId - Quest ID
     * @param {object} progressData - Progress update data
     */
    updateQuestProgress(questId, progressData) {
        const questState = this.activeQuests.get(questId);
        if (!questState) return;
        
        const questConfig = this.getQuestConfig(questId);
        const currentStage = questConfig.stages[questState.currentStage];
        const stageProgress = questState.progress[questState.currentStage];
        
        // Update stage progress
        if (stageProgress.type === 'gather' || stageProgress.type === 'kill') {
            stageProgress.current = Math.min(stageProgress.current + (progressData.amount || 1), stageProgress.required);
            
            if (stageProgress.current >= stageProgress.required) {
                stageProgress.completed = true;
            }
        } else {
            stageProgress.completed = progressData.completed || false;
        }
        
        // Check if stage completed
        if (stageProgress.completed) {
            this.advanceQuestStage(questId);
        }
        
        // Emit progress event
        this.gameEngine.emit('quest:progress', { 
            questId, 
            stage: questState.currentStage,
            progress: stageProgress
        });
    }
    
    /**
     * Advance to next quest stage
     * @param {string} questId - Quest ID
     */
    advanceQuestStage(questId) {
        const questState = this.activeQuests.get(questId);
        const questConfig = this.getQuestConfig(questId);
        
        // Move to next stage
        questState.currentStage++;
        
        // Check if quest completed
        if (questState.currentStage >= questConfig.stages.length) {
            this.completeQuest(questId);
            return;
        }
        
        // Initialize next stage progress
        const nextStage = questConfig.stages[questState.currentStage];
        questState.progress[questState.currentStage] = this.initializeStageProgress(nextStage);
        
        console.log(`📋 Quest stage advanced: ${questConfig.name} - Stage ${questState.currentStage + 1}/${questConfig.stages.length}`);
        
        // Show notification
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.showNotification(
                `${questConfig.name}: ${nextStage.description}`,
                'quest'
            );
        }
    }
    
    /**
     * Complete a quest
     * @param {string} questId - Quest ID
     */
    completeQuest(questId) {
        const questState = this.activeQuests.get(questId);
        const questConfig = this.getQuestConfig(questId);
        
        if (!questState || !questConfig) return;
        
        // Mark as completed
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        
        // Grant rewards
        const rewards = this.grantQuestRewards(questId, questConfig.rewards);
        
        console.log(`🎉 Quest completed: ${questConfig.name}`);
        
        // Emit event
        this.gameEngine.emit('quest:completed', { 
            questId, 
            questName: questConfig.name,
            rewards
        });
        
        // Show completion notification
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.showNotification(
                `Quest Complete: ${questConfig.name}!`,
                'quest-complete'
            );
        }
        
        // Show rewards in system messages
        this.showRewardMessages(questConfig.name, rewards);
    }
    
    /**
     * Grant quest rewards to player
     * @param {string} questId - Quest ID
     * @param {object} rewardsConfig - Rewards configuration
     * @returns {object} Granted rewards summary
     */
    grantQuestRewards(questId, rewardsConfig) {
        const rewards = {
            xp: {},
            items: [],
            coins: 0,
            questPoints: 0
        };
        
        const player = this.gameEngine.player;
        
        // Grant XP rewards
        if (rewardsConfig.xp) {
            for (const [skill, xpAmount] of Object.entries(rewardsConfig.xp)) {
                if (this.gameEngine.skillsSystem) {
                    this.gameEngine.skillsSystem.addXP(player, skill, xpAmount);
                    rewards.xp[skill] = xpAmount;
                }
            }
        }
        
        // Grant item rewards
        if (rewardsConfig.items && this.gameEngine.inventorySystem) {
            for (const itemReward of rewardsConfig.items) {
                const result = this.gameEngine.inventorySystem.addItem(
                    itemReward.item,
                    itemReward.amount || 1
                );
                
                if (result.success) {
                    rewards.items.push({
                        itemId: itemReward.item,
                        amount: itemReward.amount || 1
                    });
                }
            }
        }
        
        // Grant coins
        if (rewardsConfig.coins) {
            // TODO: Implement coins system when available
            rewards.coins = rewardsConfig.coins;
        }
        
        // Grant quest points
        if (rewardsConfig.questPoints) {
            this.questPoints += rewardsConfig.questPoints;
            rewards.questPoints = rewardsConfig.questPoints;
        }
        
        return rewards;
    }
    
    /**
     * Show reward messages in chat
     * @param {string} questName - Quest name
     * @param {object} rewards - Granted rewards
     */
    showRewardMessages(questName, rewards) {
        const messages = [];
        
        // XP rewards
        for (const [skill, xp] of Object.entries(rewards.xp)) {
            messages.push(`+${xp} ${skill} XP`);
        }
        
        // Item rewards
        for (const item of rewards.items) {
            const itemData = this.gameConfig.items[item.itemId];
            messages.push(`${itemData.icon} ${item.amount}x ${itemData.name}`);
        }
        
        // Coins
        if (rewards.coins > 0) {
            messages.push(`💰 ${rewards.coins} coins`);
        }
        
        // Quest points
        if (rewards.questPoints > 0) {
            messages.push(`⭐ ${rewards.questPoints} Quest Point${rewards.questPoints > 1 ? 's' : ''}`);
        }
        
        // Add system messages
        messages.forEach(msg => {
            if (window.addSystemMessage) {
                window.addSystemMessage(msg);
            }
        });
    }
    
    /**
     * Get all active quests
     * @returns {Array} Active quest states
     */
    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }
    
    /**
     * Get completed quest count
     * @returns {number} Number of completed quests
     */
    getCompletedQuestCount() {
        return this.completedQuests.size;
    }
    
    /**
     * Get all available quests (not started, meets requirements)
     * @returns {Array} Available quest IDs
     */
    getAvailableQuests() {
        const available = [];
        
        for (const questId in this.gameConfig.quests) {
            const state = this.getQuestState(questId);
            
            if (state === this.QuestState.NOT_STARTED) {
                const canStart = this.canStartQuest(questId);
                if (canStart.canStart) {
                    available.push(questId);
                }
            }
        }
        
        return available;
    }
    
    // ==================== EVENT HANDLERS ====================
    
    /**
     * Handle NPC talk event
     * @param {string} npcId - NPC ID that was talked to
     */
    onNPCTalked(npcId) {
        for (const [questId, questState] of this.activeQuests.entries()) {
            const questConfig = this.getQuestConfig(questId);
            const currentStage = questConfig.stages[questState.currentStage];
            const stageProgress = questState.progress[questState.currentStage];
            
            if (currentStage.type === 'talk_npc' && currentStage.target === npcId) {
                this.updateQuestProgress(questId, { completed: true });
            }
        }
    }
    
    /**
     * Handle resource gathered event
     * @param {string} resourceId - Resource ID gathered
     * @param {number} amount - Amount gathered
     */
    onResourceGathered(resourceId, amount = 1) {
        for (const [questId, questState] of this.activeQuests.entries()) {
            const questConfig = this.getQuestConfig(questId);
            const currentStage = questConfig.stages[questState.currentStage];
            const stageProgress = questState.progress[questState.currentStage];
            
            if (currentStage.type === 'gather' && currentStage.resource === resourceId) {
                this.updateQuestProgress(questId, { amount });
            }
        }
    }
    
    /**
     * Handle enemy killed event
     * @param {string} enemyType - Enemy type killed
     */
    onEnemyKilled(enemyType) {
        for (const [questId, questState] of this.activeQuests.entries()) {
            const questConfig = this.getQuestConfig(questId);
            const currentStage = questConfig.stages[questState.currentStage];
            const stageProgress = questState.progress[questState.currentStage];
            
            if (currentStage.type === 'kill' && currentStage.enemy === enemyType) {
                this.updateQuestProgress(questId, { amount: 1 });
            }
        }
    }
    
    /**
     * Handle item equipped event
     * @param {string} itemId - Item ID equipped
     */
    onItemEquipped(itemId) {
        for (const [questId, questState] of this.activeQuests.entries()) {
            const questConfig = this.getQuestConfig(questId);
            const currentStage = questConfig.stages[questState.currentStage];
            const stageProgress = questState.progress[questState.currentStage];
            
            if (currentStage.type === 'equip' && currentStage.item === itemId) {
                this.updateQuestProgress(questId, { completed: true });
            }
        }
    }
    
    /**
     * Handle item used event
     * @param {string} itemId - Item ID used
     */
    onItemUsed(itemId) {
        for (const [questId, questState] of this.activeQuests.entries()) {
            const questConfig = this.getQuestConfig(questId);
            const currentStage = questConfig.stages[questState.currentStage];
            const stageProgress = questState.progress[questState.currentStage];
            
            if (currentStage.type === 'use' && currentStage.item === itemId) {
                this.updateQuestProgress(questId, { completed: true });
            }
        }
    }
    
    // ==================== SERIALIZATION ====================
    
    /**
     * Serialize quest data for saving
     * @returns {object} Serialized quest data
     */
    serialize() {
        return {
            activeQuests: Array.from(this.activeQuests.entries()),
            completedQuests: Array.from(this.completedQuests),
            questPoints: this.questPoints
        };
    }
    
    /**
     * Deserialize quest data from save
     * @param {object} data - Saved quest data
     */
    deserialize(data) {
        if (!data) return;
        
        // Restore active quests
        if (data.activeQuests) {
            this.activeQuests = new Map(data.activeQuests);
        }
        
        // Restore completed quests
        if (data.completedQuests) {
            this.completedQuests = new Set(data.completedQuests);
        }
        
        // Restore quest points
        if (data.questPoints !== undefined) {
            this.questPoints = data.questPoints;
        }
        
        console.log('Quest data restored:', {
            active: this.activeQuests.size,
            completed: this.completedQuests.size,
            points: this.questPoints
        });
    }
    
    /**
     * Update system (called each frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Quest system is event-driven, no per-frame updates needed
    }
}

// Make available globally
window.QuestSystem = QuestSystem;
