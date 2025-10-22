/**
 * SkillsSystem.js - Skills Management System
 * 
 * Manages all 15 skills with XP tracking, level calculations, skill actions,
 * and interactions with game config data. Handles skill training events and
 * emits notifications for level-ups and XP gains.
 * 
 * @class SkillsSystem
 */

class SkillsSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null; // Will be set from GameConfig
        
        // Skill categories for organization
        this.skillCategories = {
            combat: ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic'],
            gathering: ['mining', 'woodcutting', 'fishing', 'hunter'],
            artisan: ['smithing', 'crafting', 'fletching', 'cooking', 'firemaking', 'herblore', 'construction'],
            support: ['agility', 'thieving', 'farming', 'runecraft', 'slayer']
        };
        
        // Skill action timers
        this.activeActions = new Map(); // player -> action data
        
        // XP multiplier (for events, boosts, etc.)
        this.xpMultiplier = 1.0;
    }
    
    /**
     * Initialize the skills system
     * @param {object} gameConfig - Game configuration object
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('SkillsSystem initialized with', Object.keys(gameConfig.skills).length, 'skills');
    }
    
    /**
     * Get skill data from config
     * @param {string} skillName - Name of the skill
     * @returns {object} Skill configuration data
     */
    getSkillConfig(skillName) {
        if (!this.gameConfig || !this.gameConfig.skills) {
            console.error('Game config not loaded');
            return null;
        }
        
        return this.gameConfig.skills[skillName];
    }
    
    /**
     * Get all skills organized by category
     * @returns {object} Skills organized by category
     */
    getAllSkillsByCategory() {
        return this.skillCategories;
    }
    
    /**
     * Get skill category
     * @param {string} skillName - Name of the skill
     * @returns {string} Category name
     */
    getSkillCategory(skillName) {
        for (const [category, skills] of Object.entries(this.skillCategories)) {
            if (skills.includes(skillName)) {
                return category;
            }
        }
        return 'unknown';
    }
    
    /**
     * Calculate level from XP using RuneScape formula
     * @param {number} xp - XP amount
     * @returns {number} Corresponding level (1-99)
     */
    getLevelFromXP(xp) {
        let level = 1;
        let totalXP = 0;
        
        for (let i = 1; i < 99; i++) {
            totalXP += Math.floor(i + 300 * Math.pow(2, i / 7));
            const xpForLevel = Math.floor(totalXP / 4);
            
            if (xp >= xpForLevel) {
                level = i + 1;
            } else {
                break;
            }
        }
        
        return Math.min(level, 99);
    }
    
    /**
     * Calculate XP required for a specific level
     * @param {number} level - Target level
     * @returns {number} XP required for that level
     */
    getXPForLevel(level) {
        if (level <= 1) return 0;
        if (level > 99) level = 99;
        
        let totalXP = 0;
        for (let i = 1; i < level; i++) {
            totalXP += Math.floor(i + 300 * Math.pow(2, i / 7));
        }
        return Math.floor(totalXP / 4);
    }
    
    /**
     * Get XP required to reach next level
     * @param {number} currentXP - Current XP amount
     * @returns {number} XP needed for next level
     */
    getXPToNextLevel(currentXP) {
        const currentLevel = this.getLevelFromXP(currentXP);
        if (currentLevel >= 99) return 0;
        
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        return nextLevelXP - currentXP;
    }
    
    /**
     * Get progress to next level as percentage
     * @param {number} currentXP - Current XP amount
     * @returns {number} Progress percentage (0-100)
     */
    getLevelProgress(currentXP) {
        const currentLevel = this.getLevelFromXP(currentXP);
        if (currentLevel >= 99) return 100;
        
        const currentLevelXP = this.getXPForLevel(currentLevel);
        const nextLevelXP = this.getXPForLevel(currentLevel + 1);
        const xpInLevel = currentXP - currentLevelXP;
        const xpForLevel = nextLevelXP - currentLevelXP;
        
        return (xpInLevel / xpForLevel) * 100;
    }
    
    /**
     * Add XP to player skill and handle level-ups
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     * @param {number} xpAmount - Amount of XP to add
     * @returns {object} Result with levelUp, newLevel, totalXP
     */
    addXP(player, skillName, xpAmount) {
        if (!player.skills[skillName]) {
            console.error(`Invalid skill: ${skillName}`);
            return { success: false };
        }
        
        const skill = player.skills[skillName];
        const oldLevel = skill.level;
        const oldXP = skill.xp;
        
        // Apply XP multiplier
        const finalXP = xpAmount * this.xpMultiplier;
        skill.xp += finalXP;
        
        // Check for level up
        const newLevel = this.getLevelFromXP(skill.xp);
        const levelUp = newLevel > oldLevel;
        
        if (levelUp) {
            skill.level = newLevel;
            skill.boostedLevel = newLevel;
            
            // Update combat stats if combat skill
            if (this.skillCategories.combat.includes(skillName)) {
                player.updateCombatStats();
            }
            
            // Emit level up event
            this.gameEngine.emit('skillLevelUp', {
                player,
                skillName,
                oldLevel,
                newLevel,
                skillConfig: this.getSkillConfig(skillName)
            });
            
            // Show level up animation
            this.gameEngine.emit('showLevelUp', {
                skillName,
                level: newLevel,
                x: player.x,
                y: player.y
            });
        }
        
        // Emit XP gain event
        this.gameEngine.emit('skillXPGain', {
            player,
            skillName,
            xpGained: finalXP,
            totalXP: skill.xp,
            level: skill.level
        });
        
        return {
            success: true,
            levelUp,
            oldLevel,
            newLevel: skill.level,
            xpGained: finalXP,
            totalXP: skill.xp
        };
    }
    
    /**
     * Start a skill action (mining, woodcutting, fishing, etc.)
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     * @param {object} actionData - Action data (resource, tool, location, etc.)
     * @returns {boolean} Success
     */
    startAction(player, skillName, actionData) {
        // Check if player meets level requirement
        const requiredLevel = actionData.requiredLevel || 1;
        if (player.skills[skillName].level < requiredLevel) {
            this.gameEngine.emit('actionFailed', {
                player,
                reason: `You need level ${requiredLevel} ${skillName} to do this.`,
                skillName,
                requiredLevel
            });
            return false;
        }
        
        // Check if player has required tools
        if (actionData.requiredTool) {
            if (!player.hasItem(actionData.requiredTool)) {
                this.gameEngine.emit('actionFailed', {
                    player,
                    reason: `You need a ${actionData.requiredTool} to do this.`,
                    skillName,
                    requiredTool: actionData.requiredTool
                });
                return false;
            }
        }
        
        // Stop any current action
        this.stopAction(player);
        
        // Start new action
        const action = {
            skillName,
            startTime: Date.now(),
            data: actionData,
            progress: 0,
            duration: actionData.duration || 3.0 // Default 3 seconds
        };
        
        this.activeActions.set(player.id, action);
        player.currentActivity = skillName;
        player.animationState = 'gathering';
        
        // Emit action start event
        this.gameEngine.emit('actionStart', {
            player,
            skillName,
            actionData
        });
        
        return true;
    }
    
    /**
     * Stop current skill action
     * @param {object} player - Player object
     */
    stopAction(player) {
        if (this.activeActions.has(player.id)) {
            const action = this.activeActions.get(player.id);
            
            this.gameEngine.emit('actionStop', {
                player,
                skillName: action.skillName,
                actionData: action.data
            });
            
            this.activeActions.delete(player.id);
            player.currentActivity = null;
            player.animationState = 'idle';
        }
    }
    
    /**
     * Update active skill actions
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        for (const [playerId, action] of this.activeActions.entries()) {
            const player = this.gameEngine.player;
            if (!player || player.id !== playerId) continue;
            
            // Update progress
            action.progress += deltaTime;
            
            // Check if action completed
            if (action.progress >= action.duration) {
                this.completeAction(player, action);
            }
            
            // Update player activity progress
            player.activityProgress = (action.progress / action.duration) * 100;
        }
    }
    
    /**
     * Complete a skill action and give rewards
     * @param {object} player - Player object
     * @param {object} action - Action data
     */
    completeAction(player, action) {
        const { skillName, data } = action;
        
        // Give XP reward
        if (data.xpReward) {
            this.addXP(player, skillName, data.xpReward);
        }
        
        // Give item reward
        if (data.itemReward) {
            const item = this.gameConfig.items[data.itemReward];
            if (item) {
                const quantity = data.itemQuantity || 1;
                if (player.addToInventory(item, quantity)) {
                    this.gameEngine.emit('itemReceived', {
                        player,
                        item,
                        quantity
                    });
                } else {
                    this.gameEngine.emit('inventoryFull', { player });
                }
            }
        }
        
        // Emit action complete event
        this.gameEngine.emit('actionComplete', {
            player,
            skillName,
            actionData: data
        });
        
        // Check if action should repeat (e.g., fishing spot hasn't moved)
        if (data.repeatable && player.currentActivity === skillName) {
            // Restart action
            action.progress = 0;
            action.startTime = Date.now();
        } else {
            // Stop action
            this.stopAction(player);
        }
    }
    
    /**
     * Get player's current action
     * @param {object} player - Player object
     * @returns {object|null} Current action data or null
     */
    getCurrentAction(player) {
        return this.activeActions.get(player.id) || null;
    }
    
    /**
     * Check if player can perform action
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     * @param {object} actionData - Action data
     * @returns {object} Result with canPerform boolean and reason
     */
    canPerformAction(player, skillName, actionData) {
        // Check level requirement
        const requiredLevel = actionData.requiredLevel || 1;
        if (player.skills[skillName].level < requiredLevel) {
            return {
                canPerform: false,
                reason: `Requires level ${requiredLevel} ${skillName}`
            };
        }
        
        // Check tool requirement
        if (actionData.requiredTool) {
            if (!player.hasItem(actionData.requiredTool)) {
                return {
                    canPerform: false,
                    reason: `Requires ${actionData.requiredTool}`
                };
            }
        }
        
        // Check inventory space
        if (actionData.itemReward) {
            const item = this.gameConfig.items[actionData.itemReward];
            if (item && !item.stackable) {
                // Check for empty slots
                const emptySlots = player.inventory.filter(slot => !slot).length;
                if (emptySlots === 0) {
                    return {
                        canPerform: false,
                        reason: 'Inventory full'
                    };
                }
            }
        }
        
        return { canPerform: true };
    }
    
    /**
     * Get total level (sum of all skill levels)
     * @param {object} player - Player object
     * @returns {number} Total level
     */
    getTotalLevel(player) {
        let total = 0;
        for (const skillName in player.skills) {
            total += player.skills[skillName].level;
        }
        return total;
    }
    
    /**
     * Get total XP (sum of all skill XP)
     * @param {object} player - Player object
     * @returns {number} Total XP
     */
    getTotalXP(player) {
        let total = 0;
        for (const skillName in player.skills) {
            total += player.skills[skillName].xp;
        }
        return total;
    }
    
    /**
     * Boost a skill temporarily
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     * @param {number} boostAmount - Amount to boost (can be negative for drain)
     * @param {number} duration - Duration in seconds (0 = permanent until restored)
     */
    boostSkill(player, skillName, boostAmount, duration = 0) {
        if (!player.skills[skillName]) return;
        
        const skill = player.skills[skillName];
        skill.boostedLevel = Math.max(1, Math.min(99, skill.boostedLevel + boostAmount));
        
        if (duration > 0) {
            // Add status effect to restore after duration
            player.addStatusEffect({
                type: 'skillBoost',
                skillName,
                amount: boostAmount,
                duration,
                onRemove: (player) => {
                    // Restore to normal level (or current boost level)
                    player.skills[skillName].boostedLevel = Math.max(
                        1,
                        Math.min(player.skills[skillName].level, player.skills[skillName].boostedLevel)
                    );
                }
            });
        }
        
        this.gameEngine.emit('skillBoosted', {
            player,
            skillName,
            boostAmount,
            boostedLevel: skill.boostedLevel,
            duration
        });
    }
    
    /**
     * Restore boosted skill to normal level
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     */
    restoreSkill(player, skillName) {
        if (!player.skills[skillName]) return;
        
        player.skills[skillName].boostedLevel = player.skills[skillName].level;
    }
    
    /**
     * Set XP multiplier for events/boosts
     * @param {number} multiplier - XP multiplier (1.0 = normal, 2.0 = double XP, etc.)
     */
    setXPMultiplier(multiplier) {
        this.xpMultiplier = Math.max(0.1, multiplier);
        console.log(`XP multiplier set to ${this.xpMultiplier}x`);
    }
    
    /**
     * Get formatted skill info
     * @param {object} player - Player object
     * @param {string} skillName - Name of the skill
     * @returns {object} Formatted skill information
     */
    getSkillInfo(player, skillName) {
        if (!player.skills[skillName]) return null;
        
        const skill = player.skills[skillName];
        const config = this.getSkillConfig(skillName);
        const xpToNext = this.getXPToNextLevel(skill.xp);
        const progress = this.getLevelProgress(skill.xp);
        
        return {
            name: skillName,
            displayName: config?.name || skillName,
            icon: config?.icon || '🎯',
            level: skill.level,
            boostedLevel: skill.boostedLevel,
            xp: skill.xp,
            xpToNext,
            progress,
            category: this.getSkillCategory(skillName),
            isBoosted: skill.boostedLevel !== skill.level
        };
    }
    
    /**
     * Get all skills info for player
     * @param {object} player - Player object
     * @returns {array} Array of skill information objects
     */
    getAllSkillsInfo(player) {
        const skillsInfo = [];
        
        for (const skillName in player.skills) {
            skillsInfo.push(this.getSkillInfo(player, skillName));
        }
        
        return skillsInfo;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillsSystem;
}
