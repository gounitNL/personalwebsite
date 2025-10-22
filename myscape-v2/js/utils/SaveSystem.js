/**
 * SaveSystem.js - Save/Load Game State
 * 
 * Manages saving and loading player game state to localStorage.
 * Supports auto-save, manual save, and game state restoration.
 * 
 * @class SaveSystem
 */

class SaveSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.saveKey = 'myscape_v2_save';
        this.autoSaveInterval = 60; // seconds
        this.autoSaveTimer = 0;
        this.lastSaveTime = 0;
        this.autoSaveEnabled = true;
        
        console.log('SaveSystem initialized');
    }
    
    /**
     * Initialize save system
     */
    init() {
        console.log('SaveSystem ready');
        
        // Attempt to load existing save
        this.autoLoad();
    }
    
    /**
     * Update save system (handles auto-save)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.autoSaveEnabled) return;
        
        this.autoSaveTimer += deltaTime;
        
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.autoSave();
            this.autoSaveTimer = 0;
        }
    }
    
    /**
     * Auto-save the game
     */
    autoSave() {
        console.log('💾 Auto-saving...');
        const result = this.saveGame();
        
        if (result.success) {
            this.lastSaveTime = Date.now();
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Game auto-saved', 'info');
            }
        }
    }
    
    /**
     * Auto-load on game start
     */
    autoLoad() {
        if (this.hasSaveData()) {
            console.log('💾 Found existing save data');
            
            // Ask player if they want to load (could be UI prompt)
            // For now, auto-load
            this.loadGame();
        }
    }
    
    /**
     * Save game state to localStorage
     * @returns {object} Result with success status
     */
    saveGame() {
        try {
            const saveData = this.serializeGameState();
            
            // Compress and save to localStorage
            const saveString = JSON.stringify(saveData);
            localStorage.setItem(this.saveKey, saveString);
            
            console.log(`✅ Game saved (${(saveString.length / 1024).toFixed(2)} KB)`);
            
            this.gameEngine.emit('game:saved', { timestamp: saveData.timestamp });
            
            return {
                success: true,
                size: saveString.length,
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('❌ Failed to save game:', error);
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Failed to save game', 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Load game state from localStorage
     * @returns {object} Result with success status
     */
    loadGame() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            
            if (!saveString) {
                console.log('No save data found');
                return { success: false, error: 'No save data' };
            }
            
            const saveData = JSON.parse(saveString);
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                console.error('Invalid save data format');
                return { success: false, error: 'Invalid save data' };
            }
            
            // Restore game state
            this.deserializeGameState(saveData);
            
            console.log(`✅ Game loaded (saved at ${new Date(saveData.timestamp).toLocaleString()})`);
            
            this.gameEngine.emit('game:loaded', { timestamp: saveData.timestamp });
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Game loaded', 'success');
            }
            
            return {
                success: true,
                timestamp: saveData.timestamp
            };
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Failed to load game', 'error');
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Serialize current game state
     * @returns {object} Serialized game data
     */
    serializeGameState() {
        const player = this.gameEngine.player;
        
        const saveData = {
            version: '2.0',
            timestamp: Date.now(),
            
            // Player data
            player: {
                x: player.x,
                y: player.y,
                facing: player.facing,
                
                // Skills
                skills: {},
                
                // Combat stats
                combatStats: player.combatStats ? {
                    hitpoints: player.combatStats.hitpoints,
                    maxHitpoints: player.combatStats.maxHitpoints
                } : null,
                
                // Inventory
                inventory: player.inventory || [],
                
                // Equipment (if system exists)
                equipment: this.gameEngine.equipmentSystem ? 
                    this.gameEngine.equipmentSystem.serialize() : null,
                
                // Bank (if system exists)
                bank: this.gameEngine.bankingSystem ?
                    this.gameEngine.bankingSystem.serialize() : null
            },
            
            // World data
            world: {
                currentArea: this.gameEngine.worldSystem?.currentAreaId || 'lumbridge'
            },
            
            // Quest progress (if system exists)
            quests: this.gameEngine.questSystem ?
                this.gameEngine.questSystem.serialize() : null
        };
        
        // Serialize skills
        if (player.skills) {
            for (const [skillId, skillData] of Object.entries(player.skills)) {
                saveData.player.skills[skillId] = {
                    level: skillData.level,
                    xp: skillData.xp
                };
            }
        }
        
        return saveData;
    }
    
    /**
     * Deserialize and restore game state
     * @param {object} saveData - Saved game data
     */
    deserializeGameState(saveData) {
        const player = this.gameEngine.player;
        
        // Restore player position
        if (saveData.player.x !== undefined && saveData.player.y !== undefined) {
            player.teleportTo(saveData.player.x, saveData.player.y);
        }
        
        if (saveData.player.facing) {
            player.facing = saveData.player.facing;
        }
        
        // Restore skills
        if (saveData.player.skills) {
            for (const [skillId, skillData] of Object.entries(saveData.player.skills)) {
                if (player.skills[skillId]) {
                    player.skills[skillId].level = skillData.level;
                    player.skills[skillId].xp = skillData.xp;
                }
            }
            
            // Update UI
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.updateSkillsDisplay();
            }
        }
        
        // Restore combat stats
        if (saveData.player.combatStats && player.combatStats) {
            player.combatStats.hitpoints = saveData.player.combatStats.hitpoints;
            player.combatStats.maxHitpoints = saveData.player.combatStats.maxHitpoints;
        }
        
        // Restore inventory
        if (saveData.player.inventory) {
            player.inventory = saveData.player.inventory;
            
            if (this.gameEngine.inventorySystem) {
                this.gameEngine.inventorySystem.deserialize(saveData.player.inventory);
            }
        }
        
        // Restore equipment
        if (saveData.player.equipment && this.gameEngine.equipmentSystem) {
            this.gameEngine.equipmentSystem.deserialize(saveData.player.equipment);
        }
        
        // Restore bank
        if (saveData.player.bank && this.gameEngine.bankingSystem) {
            this.gameEngine.bankingSystem.deserialize(saveData.player.bank);
        }
        
        // Restore world state
        if (saveData.world?.currentArea && this.gameEngine.worldSystem) {
            const currentArea = this.gameEngine.worldSystem.currentAreaId;
            
            // Only change area if different
            if (currentArea !== saveData.world.currentArea) {
                this.gameEngine.worldSystem.loadArea(saveData.world.currentArea);
            }
        }
        
        // Restore quest progress
        if (saveData.quests && this.gameEngine.questSystem) {
            this.gameEngine.questSystem.deserialize(saveData.quests);
        }
        
        console.log('Game state restored');
    }
    
    /**
     * Validate save data structure
     * @param {object} saveData - Save data to validate
     * @returns {boolean} Is valid
     */
    validateSaveData(saveData) {
        if (!saveData || typeof saveData !== 'object') {
            return false;
        }
        
        // Check required fields
        if (!saveData.version || !saveData.timestamp) {
            return false;
        }
        
        if (!saveData.player || typeof saveData.player !== 'object') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if save data exists
     * @returns {boolean} Has save data
     */
    hasSaveData() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            return saveString !== null && saveString.length > 0;
        } catch (error) {
            console.error('Error checking save data:', error);
            return false;
        }
    }
    
    /**
     * Delete save data
     * @returns {boolean} Success
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('Save data deleted');
            
            this.gameEngine.emit('game:saveDeleted');
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Save deleted', 'info');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }
    
    /**
     * Get save data info without loading
     * @returns {object|null} Save info
     */
    getSaveInfo() {
        try {
            const saveString = localStorage.getItem(this.saveKey);
            
            if (!saveString) {
                return null;
            }
            
            const saveData = JSON.parse(saveString);
            
            return {
                version: saveData.version,
                timestamp: saveData.timestamp,
                date: new Date(saveData.timestamp).toLocaleString(),
                playerLevel: saveData.player?.skills?.attack?.level || 1,
                currentArea: saveData.world?.currentArea || 'unknown',
                size: (saveString.length / 1024).toFixed(2) + ' KB'
            };
        } catch (error) {
            console.error('Error getting save info:', error);
            return null;
        }
    }
    
    /**
     * Export save data as JSON file
     * @returns {string} JSON string
     */
    exportSave() {
        const saveData = this.serializeGameState();
        return JSON.stringify(saveData, null, 2);
    }
    
    /**
     * Import save data from JSON
     * @param {string} jsonString - JSON save data
     * @returns {object} Result
     */
    importSave(jsonString) {
        try {
            const saveData = JSON.parse(jsonString);
            
            if (!this.validateSaveData(saveData)) {
                throw new Error('Invalid save data format');
            }
            
            // Save to localStorage
            localStorage.setItem(this.saveKey, jsonString);
            
            // Load the imported save
            return this.loadGame();
        } catch (error) {
            console.error('Failed to import save:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Enable or disable auto-save
     * @param {boolean} enabled - Auto-save enabled
     */
    setAutoSave(enabled) {
        this.autoSaveEnabled = enabled;
        console.log(`Auto-save ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SaveSystem;
}
