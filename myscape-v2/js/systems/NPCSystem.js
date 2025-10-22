/**
 * NPCSystem.js - Non-Player Character Management System
 * 
 * Manages all NPCs in the game world including:
 * - Spawning NPCs in areas
 * - NPC interactions (talk, trade, bank, examine)
 * - Dialogue system
 * - Action handling
 * - Integration with BankingSystem and ShopSystem
 * 
 * @class NPCSystem
 */

class NPCSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null;
        
        // NPC tracking
        this.spawnedNPCs = new Map(); // Map of NPC instances by unique ID
        this.npcCounter = 0;
        
        // Interaction state
        this.activeDialogue = null;
        this.activeNPC = null;
        
        console.log('NPCSystem initialized');
    }
    
    /**
     * Initialize NPC system with game config
     * @param {object} gameConfig - Game configuration
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('NPCSystem initialized with', Object.keys(gameConfig.npcs).length, 'NPC types');
    }
    
    /**
     * Spawn NPCs in an area based on area configuration
     * @param {string} areaId - ID of the area
     * @param {object} areaData - Area configuration data
     */
    spawnNPCsInArea(areaId, areaData) {
        if (!areaData.npcs || areaData.npcs.length === 0) {
            return;
        }
        
        console.log(`Spawning ${areaData.npcs.length} NPCs in ${areaId}...`);
        
        areaData.npcs.forEach(npcType => {
            const npcConfig = this.gameConfig.npcs[npcType];
            
            if (!npcConfig) {
                console.warn(`NPC type '${npcType}' not found in config`);
                return;
            }
            
            // Spawn NPC at designated positions based on type
            const spawnPosition = this.getNPCSpawnPosition(areaId, npcType, areaData);
            
            const npc = this.createNPC(npcType, npcConfig, areaId, spawnPosition);
            
            if (npc) {
                this.spawnedNPCs.set(npc.id, npc);
                console.log(`Spawned NPC: ${npc.name} at (${npc.x}, ${npc.y})`);
            }
        });
    }
    
    /**
     * Create an NPC instance
     * @param {string} type - NPC type ID
     * @param {object} config - NPC configuration
     * @param {string} areaId - Area ID
     * @param {object} position - Spawn position {x, y}
     * @returns {object} NPC instance
     */
    createNPC(type, config, areaId, position) {
        const npcId = `npc_${this.npcCounter++}`;
        
        const npc = {
            id: npcId,
            type: type,
            name: config.name,
            x: position.x,
            y: position.y,
            areaId: areaId,
            
            // Visual properties
            icon: this.getNPCIcon(type),
            color: this.getNPCColor(type),
            size: 1.2, // Slightly larger than players
            
            // Interaction properties
            dialogue: config.dialogue || [],
            actions: config.actions || ['Talk-to', 'Examine'],
            currentDialogueIndex: 0,
            
            // Functional properties
            isBank: config.isBank || false,
            shop: config.shop || null,
            hasQuest: config.hasQuest || false,
            questId: config.questId || null,
            
            // State
            isBusy: false,
            facingDirection: 'south',
            
            // Methods
            interact: (action) => this.handleNPCInteraction(npcId, action),
            getNextDialogue: () => this.getNextDialogue(npcId),
            resetDialogue: () => this.resetDialogue(npcId)
        };
        
        return npc;
    }
    
    /**
     * Get NPC spawn position based on type and area
     * @param {string} areaId - Area ID
     * @param {string} npcType - NPC type
     * @param {object} areaData - Area data
     * @returns {object} Position {x, y}
     */
    getNPCSpawnPosition(areaId, npcType, areaData) {
        const spawnPoint = areaData.spawnPoint;
        
        // Define NPC spawn positions relative to spawn point
        const npcPositions = {
            // Banks spawn near center/spawn point
            'banker': { x: spawnPoint.x + 5, y: spawnPoint.y - 3 },
            
            // Shops spawn in merchant areas
            'shop_keeper': { x: spawnPoint.x - 5, y: spawnPoint.y - 3 },
            'weapon_merchant': { x: spawnPoint.x + 7, y: spawnPoint.y + 2 },
            'armor_merchant': { x: spawnPoint.x + 7, y: spawnPoint.y + 5 },
            
            // Quest givers near spawn
            'quest_giver': { x: spawnPoint.x - 3, y: spawnPoint.y + 5 },
            
            // Trainers and helpers
            'skill_master': { x: spawnPoint.x, y: spawnPoint.y - 8 },
            
            // Resource area NPCs
            'fisherman': { x: spawnPoint.x + 10, y: spawnPoint.y + 10 },
            'miner': { x: spawnPoint.x - 10, y: spawnPoint.y - 5 },
            'lumberjack': { x: spawnPoint.x - 8, y: spawnPoint.y + 8 }
        };
        
        return npcPositions[npcType] || {
            x: spawnPoint.x + Math.floor(Math.random() * 10) - 5,
            y: spawnPoint.y + Math.floor(Math.random() * 10) - 5
        };
    }
    
    /**
     * Get NPC icon based on type
     * @param {string} type - NPC type
     * @returns {string} Icon emoji
     */
    getNPCIcon(type) {
        const icons = {
            'banker': '🏦',
            'shop_keeper': '🛒',
            'weapon_merchant': '⚔️',
            'armor_merchant': '🛡️',
            'quest_giver': '📜',
            'skill_master': '🎓',
            'fisherman': '🎣',
            'miner': '⛏️',
            'lumberjack': '🪓'
        };
        
        return icons[type] || '🧑';
    }
    
    /**
     * Get NPC color based on type
     * @param {string} type - NPC type
     * @returns {string} Color hex code
     */
    getNPCColor(type) {
        const colors = {
            'banker': '#FFD700', // Gold
            'shop_keeper': '#4169E1', // Royal Blue
            'weapon_merchant': '#DC143C', // Crimson
            'armor_merchant': '#708090', // Slate Gray
            'quest_giver': '#9370DB', // Medium Purple
            'skill_master': '#20B2AA', // Light Sea Green
            'fisherman': '#4682B4', // Steel Blue
            'miner': '#8B4513', // Saddle Brown
            'lumberjack': '#228B22' // Forest Green
        };
        
        return colors[type] || '#808080';
    }
    
    /**
     * Handle NPC interaction
     * @param {string} npcId - NPC unique ID
     * @param {string} action - Action to perform
     */
    handleNPCInteraction(npcId, action) {
        const npc = this.spawnedNPCs.get(npcId);
        
        if (!npc) {
            console.warn(`NPC ${npcId} not found`);
            return;
        }
        
        console.log(`Player interacting with ${npc.name}: ${action}`);
        
        // Set active NPC for dialogue/interactions
        this.activeNPC = npc;
        
        switch (action) {
            case 'Talk-to':
                this.startDialogue(npc);
                break;
                
            case 'Bank':
                if (npc.isBank) {
                    this.openBank(npc);
                } else {
                    this.gameEngine.eventEmitter.emit('systemMessage', 'This NPC doesn\'t offer banking services.');
                }
                break;
                
            case 'Trade':
                if (npc.shop) {
                    this.openShop(npc);
                } else {
                    this.gameEngine.eventEmitter.emit('systemMessage', 'This NPC doesn\'t have a shop.');
                }
                break;
                
            case 'Quest':
                if (npc.hasQuest) {
                    this.openQuest(npc);
                } else {
                    this.gameEngine.eventEmitter.emit('systemMessage', 'This NPC doesn\'t have any quests.');
                }
                break;
                
            case 'Examine':
                this.examineNPC(npc);
                break;
                
            default:
                console.warn(`Unknown NPC action: ${action}`);
        }
    }
    
    /**
     * Start dialogue with an NPC
     * @param {object} npc - NPC instance
     */
    startDialogue(npc) {
        if (!npc.dialogue || npc.dialogue.length === 0) {
            this.gameEngine.eventEmitter.emit('systemMessage', `${npc.name} has nothing to say.`);
            return;
        }
        
        // Get dialogue line
        const dialogueLine = npc.dialogue[npc.currentDialogueIndex];
        
        // Display dialogue
        this.gameEngine.eventEmitter.emit('npcDialogue', {
            npcName: npc.name,
            message: dialogueLine,
            actions: npc.actions
        });
        
        // Advance dialogue index (cycle through)
        npc.currentDialogueIndex = (npc.currentDialogueIndex + 1) % npc.dialogue.length;
        
        this.activeDialogue = {
            npc: npc,
            line: dialogueLine
        };
    }
    
    /**
     * Get next dialogue line from NPC
     * @param {string} npcId - NPC unique ID
     * @returns {string} Dialogue line
     */
    getNextDialogue(npcId) {
        const npc = this.spawnedNPCs.get(npcId);
        
        if (!npc || !npc.dialogue || npc.dialogue.length === 0) {
            return null;
        }
        
        const line = npc.dialogue[npc.currentDialogueIndex];
        npc.currentDialogueIndex = (npc.currentDialogueIndex + 1) % npc.dialogue.length;
        
        return line;
    }
    
    /**
     * Reset NPC dialogue to beginning
     * @param {string} npcId - NPC unique ID
     */
    resetDialogue(npcId) {
        const npc = this.spawnedNPCs.get(npcId);
        if (npc) {
            npc.currentDialogueIndex = 0;
        }
    }
    
    /**
     * Open bank with a banker NPC
     * @param {object} npc - NPC instance
     */
    openBank(npc) {
        if (!this.gameEngine.bankingSystem) {
            console.error('BankingSystem not initialized');
            return;
        }
        
        // Set the banker who opened the bank
        this.gameEngine.bankingSystem.lastUsedBankerId = npc.id;
        
        // Open bank interface
        this.gameEngine.bankingSystem.openBank();
        
        this.gameEngine.eventEmitter.emit('systemMessage', `${npc.name}: Good day! Your bank is ready.`);
    }
    
    /**
     * Open shop with a merchant NPC
     * @param {object} npc - NPC instance
     */
    openShop(npc) {
        if (!this.gameEngine.shopSystem) {
            this.gameEngine.eventEmitter.emit('systemMessage', 'Shop system coming soon!');
            return;
        }
        
        const shopData = this.gameConfig.shops[npc.shop];
        
        if (!shopData) {
            console.warn(`Shop '${npc.shop}' not found in config`);
            return;
        }
        
        // Open shop interface
        this.gameEngine.shopSystem.openShop(npc.shop, npc);
        
        this.gameEngine.eventEmitter.emit('systemMessage', `${npc.name}: Take a look at my wares!`);
    }
    
    /**
     * Open quest dialogue with NPC
     * @param {object} npc - NPC instance
     */
    openQuest(npc) {
        if (!this.gameEngine.questSystem) {
            this.gameEngine.eventEmitter.emit('systemMessage', 'Quest system coming soon!');
            return;
        }
        
        // Open quest interface
        this.gameEngine.questSystem.openQuestDialogue(npc);
        
        this.gameEngine.eventEmitter.emit('systemMessage', `${npc.name}: I have a task for you!`);
    }
    
    /**
     * Examine an NPC
     * @param {object} npc - NPC instance
     */
    examineNPC(npc) {
        let description = `This is ${npc.name}.`;
        
        if (npc.isBank) {
            description += ' They can help you access your bank.';
        }
        
        if (npc.shop) {
            description += ' They run a shop.';
        }
        
        if (npc.hasQuest) {
            description += ' They might have a quest for you.';
        }
        
        this.gameEngine.eventEmitter.emit('systemMessage', description);
    }
    
    /**
     * Get NPC at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} areaId - Area ID
     * @returns {object|null} NPC instance or null
     */
    getNPCAt(x, y, areaId) {
        for (const [id, npc] of this.spawnedNPCs) {
            if (npc.areaId === areaId && 
                Math.floor(npc.x) === Math.floor(x) && 
                Math.floor(npc.y) === Math.floor(y)) {
                return npc;
            }
        }
        return null;
    }
    
    /**
     * Get all NPCs in an area
     * @param {string} areaId - Area ID
     * @returns {array} Array of NPC instances
     */
    getNPCsInArea(areaId) {
        const npcs = [];
        for (const [id, npc] of this.spawnedNPCs) {
            if (npc.areaId === areaId) {
                npcs.push(npc);
            }
        }
        return npcs;
    }
    
    /**
     * Get NPC by ID
     * @param {string} npcId - NPC unique ID
     * @returns {object|null} NPC instance or null
     */
    getNPCById(npcId) {
        return this.spawnedNPCs.get(npcId);
    }
    
    /**
     * Clear all NPCs (e.g., when changing areas)
     */
    clearAllNPCs() {
        this.spawnedNPCs.clear();
        this.activeDialogue = null;
        this.activeNPC = null;
        console.log('All NPCs cleared');
    }
    
    /**
     * Clear NPCs in specific area
     * @param {string} areaId - Area ID
     */
    clearNPCsInArea(areaId) {
        const toRemove = [];
        
        for (const [id, npc] of this.spawnedNPCs) {
            if (npc.areaId === areaId) {
                toRemove.push(id);
            }
        }
        
        toRemove.forEach(id => this.spawnedNPCs.delete(id));
        
        console.log(`Cleared ${toRemove.length} NPCs from ${areaId}`);
    }
    
    /**
     * Update NPCs (called each frame)
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // NPCs are stationary in this implementation
        // Future: Add NPC wandering, animations, etc.
        
        // Update any NPC states if needed
        for (const [id, npc] of this.spawnedNPCs) {
            // Update NPC idle animations, rotations, etc.
            // For now, NPCs are static
        }
    }
    
    /**
     * Serialize NPCSystem state for saving
     * @returns {object} Serialized state
     */
    serialize() {
        return {
            npcCounter: this.npcCounter,
            activeNPCId: this.activeNPC ? this.activeNPC.id : null
        };
    }
    
    /**
     * Deserialize NPCSystem state from save
     * @param {object} data - Serialized state
     */
    deserialize(data) {
        if (data.npcCounter) {
            this.npcCounter = data.npcCounter;
        }
        
        if (data.activeNPCId) {
            this.activeNPC = this.spawnedNPCs.get(data.activeNPCId);
        }
    }
}

// Make NPCSystem available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPCSystem;
}
