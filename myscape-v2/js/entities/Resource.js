/**
 * Resource.js - Gatherable Resource Entity
 * 
 * Represents gatherable resources like trees, rocks, fishing spots, etc.
 * Handles resource depletion, respawning, skill requirements, and XP rewards.
 * Integrates with SkillsSystem and InventorySystem.
 * 
 * @class Resource
 */

class Resource {
    constructor(data = {}) {
        // Identity
        this.id = data.id || `resource_${Date.now()}_${Math.random()}`;
        this.type = data.type; // mining, woodcutting, fishing, hunter
        this.resourceId = data.resourceId; // e.g., 'oak_tree', 'iron_rock'
        
        // Position
        this.x = data.x || 0;
        this.y = data.y || 0;
        
        // Visual properties
        this.name = data.name || 'Resource';
        this.color = data.color || '#888888';
        this.size = data.size || 0.8;
        this.icon = data.icon || null;
        
        // Resource state
        this.available = true;
        this.depleted = false;
        this.beingHarvested = false;
        this.currentHarvester = null;
        
        // Skill requirements
        this.skillRequired = data.skillRequired; // e.g., 'mining', 'woodcutting'
        this.levelRequired = data.levelRequired || 1;
        
        // Harvest properties
        this.harvestTime = data.harvestTime || 3; // seconds
        this.harvestProgress = 0;
        
        // Rewards
        this.xpReward = data.xpReward || 10;
        this.itemRewards = data.itemRewards || []; // Array of {itemId, minAmount, maxAmount, chance}
        
        // Respawn
        this.respawnTime = data.respawnTime || 60; // seconds
        this.respawnTimer = 0;
        this.respawnVariance = data.respawnVariance || 0.2; // ±20% variance
        
        // Depletion (some resources deplete after X harvests)
        this.maxHarvests = data.maxHarvests || Infinity;
        this.harvestCount = 0;
        
        // Animation
        this.animationState = 'idle'; // idle, harvesting, depleted, respawning
        this.animationTime = 0;
        
        // Configuration reference
        this.config = data.config || null;
    }
    
    /**
     * Update resource state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update harvest progress
        if (this.beingHarvested) {
            this.harvestProgress += deltaTime;
            
            // Check if harvest is complete
            if (this.harvestProgress >= this.harvestTime) {
                this.completeHarvest();
            }
        }
        
        // Update respawn timer
        if (this.depleted && !this.available) {
            this.respawnTimer += deltaTime;
            
            if (this.respawnTimer >= this.respawnTime) {
                this.respawn();
            }
        }
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time since last frame
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Simple animation cycle (can be expanded)
        if (this.animationState === 'harvesting') {
            // Shake animation during harvest
        } else if (this.animationState === 'respawning') {
            // Fade-in animation
        }
    }
    
    /**
     * Start harvesting this resource
     * @param {object} player - Player entity
     * @returns {object} Result with success and message
     */
    startHarvest(player) {
        // Check if resource is available
        if (!this.available || this.depleted) {
            return {
                success: false,
                message: 'This resource is not available.'
            };
        }
        
        // Check if already being harvested
        if (this.beingHarvested) {
            return {
                success: false,
                message: 'Someone is already harvesting this.'
            };
        }
        
        // Check skill level requirement
        if (!player.skills[this.skillRequired]) {
            return {
                success: false,
                message: `You need the ${this.skillRequired} skill to gather this.`
            };
        }
        
        const playerLevel = player.skills[this.skillRequired].level;
        if (playerLevel < this.levelRequired) {
            return {
                success: false,
                message: `You need level ${this.levelRequired} ${this.skillRequired} to gather this.`
            };
        }
        
        // Check inventory space
        if (player.inventory && this.itemRewards.length > 0) {
            const hasSpace = player.inventory.some(slot => slot === null);
            if (!hasSpace) {
                return {
                    success: false,
                    message: 'Your inventory is full.'
                };
            }
        }
        
        // Start harvesting
        this.beingHarvested = true;
        this.currentHarvester = player;
        this.harvestProgress = 0;
        this.animationState = 'harvesting';
        
        return {
            success: true,
            message: `You begin harvesting ${this.name}...`,
            harvestTime: this.harvestTime
        };
    }
    
    /**
     * Stop harvesting (player moved away or cancelled)
     */
    stopHarvest() {
        this.beingHarvested = false;
        this.currentHarvester = null;
        this.harvestProgress = 0;
        this.animationState = 'idle';
    }
    
    /**
     * Complete the harvest
     */
    completeHarvest() {
        if (!this.currentHarvester) {
            this.stopHarvest();
            return;
        }
        
        const player = this.currentHarvester;
        
        // Grant XP
        if (player.addXP) {
            const result = player.addXP(this.skillRequired, this.xpReward);
            
            // Emit XP gain event (will be caught by GameEngine/UIManager)
            if (window.game) {
                window.game.emit('skill:xpGained', {
                    skill: this.skillRequired,
                    amount: this.xpReward,
                    resource: this.name
                });
                
                if (result.levelUp) {
                    window.game.emit('skill:levelUp', {
                        skill: this.skillRequired,
                        level: result.level,
                        oldLevel: result.oldLevel
                    });
                }
            }
        }
        
        // Grant item rewards
        const itemsReceived = this.grantItems(player);
        
        // Emit harvest complete event
        if (window.game) {
            window.game.emit('resource:harvested', {
                resourceId: this.resourceId,
                resourceName: this.name,
                player: player,
                items: itemsReceived,
                xp: this.xpReward
            });
        }
        
        // Increment harvest count
        this.harvestCount++;
        
        // Check if resource should deplete
        if (this.harvestCount >= this.maxHarvests) {
            this.deplete();
        } else {
            // Reset for next harvest
            this.stopHarvest();
        }
    }
    
    /**
     * Grant item rewards to player
     * @param {object} player - Player entity
     * @returns {array} Items granted
     */
    grantItems(player) {
        const itemsReceived = [];
        
        for (const reward of this.itemRewards) {
            // Check drop chance
            const roll = Math.random();
            if (roll > (reward.chance || 1.0)) {
                continue; // Didn't get this item
            }
            
            // Determine amount
            const minAmount = reward.minAmount || 1;
            const maxAmount = reward.maxAmount || 1;
            const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
            
            // Add to player inventory
            if (player.addToInventory) {
                const added = player.addToInventory(reward, amount);
                if (added) {
                    itemsReceived.push({
                        itemId: reward.id,
                        itemName: reward.name,
                        amount
                    });
                }
            } else {
                // Fallback: Just track what would have been received
                itemsReceived.push({
                    itemId: reward.id,
                    itemName: reward.name,
                    amount
                });
            }
        }
        
        return itemsReceived;
    }
    
    /**
     * Deplete the resource
     */
    deplete() {
        this.available = false;
        this.depleted = true;
        this.beingHarvested = false;
        this.currentHarvester = null;
        this.harvestProgress = 0;
        this.animationState = 'depleted';
        this.respawnTimer = 0;
        
        // Add respawn variance
        const variance = this.respawnTime * this.respawnVariance;
        const randomVariance = (Math.random() * 2 - 1) * variance;
        this.actualRespawnTime = this.respawnTime + randomVariance;
        
        console.log(`Resource ${this.name} depleted, respawning in ${this.actualRespawnTime.toFixed(1)}s`);
    }
    
    /**
     * Respawn the resource
     */
    respawn() {
        this.available = true;
        this.depleted = false;
        this.harvestCount = 0;
        this.respawnTimer = 0;
        this.animationState = 'respawning';
        
        // Reset to idle after animation
        setTimeout(() => {
            this.animationState = 'idle';
        }, 500);
        
        console.log(`Resource ${this.name} respawned`);
        
        // Emit respawn event
        if (window.game) {
            window.game.emit('resource:respawned', {
                resourceId: this.resourceId,
                resourceName: this.name,
                position: { x: this.x, y: this.y }
            });
        }
    }
    
    /**
     * Get resource state for rendering
     * @returns {object} State info
     */
    getState() {
        return {
            available: this.available,
            depleted: this.depleted,
            beingHarvested: this.beingHarvested,
            harvestProgress: this.harvestProgress / this.harvestTime,
            respawnProgress: this.respawnTimer / this.respawnTime,
            animationState: this.animationState
        };
    }
    
    /**
     * Get resource info for examination
     * @returns {string} Description
     */
    getExamineText() {
        if (this.depleted) {
            return `${this.name} - This resource is depleted.`;
        }
        
        if (this.beingHarvested) {
            return `${this.name} - Someone is harvesting this.`;
        }
        
        return `${this.name} - Requires level ${this.levelRequired} ${this.skillRequired}.`;
    }
    
    /**
     * Check if player can harvest
     * @param {object} player - Player entity
     * @returns {boolean} Can harvest
     */
    canHarvest(player) {
        if (!this.available || this.depleted || this.beingHarvested) {
            return false;
        }
        
        if (!player.skills[this.skillRequired]) {
            return false;
        }
        
        const playerLevel = player.skills[this.skillRequired].level;
        return playerLevel >= this.levelRequired;
    }
    
    /**
     * Serialize resource data
     * @returns {object} Serialized data
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            resourceId: this.resourceId,
            x: this.x,
            y: this.y,
            available: this.available,
            depleted: this.depleted,
            harvestCount: this.harvestCount,
            respawnTimer: this.respawnTimer
        };
    }
    
    /**
     * Create resource from serialized data
     * @param {object} data - Serialized data
     * @param {object} config - Resource configuration
     * @returns {Resource} Resource instance
     */
    static deserialize(data, config) {
        const resource = new Resource({ ...data, ...config });
        resource.harvestCount = data.harvestCount || 0;
        resource.respawnTimer = data.respawnTimer || 0;
        
        if (data.depleted) {
            resource.depleted = true;
            resource.available = false;
        }
        
        return resource;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Resource;
}
