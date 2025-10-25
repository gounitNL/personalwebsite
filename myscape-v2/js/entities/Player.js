/**
 * Player.js - Player Entity Class
 * 
 * Represents the player character with all stats, skills, inventory, equipment,
 * and state management. Includes movement, animation, combat stats, and serialization.
 * 
 * @class Player
 */

class Player {
    constructor(data = {}) {
        // Identity
        this.id = data.id || 'player';
        this.username = data.username || 'Player';
        this.name = data.name || data.username || 'Player'; // For rendering
        this.type = 'player';
        
        // Position
        this.x = data.x || 10;
        this.y = data.y || 10;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
        this.isMoving = false; // Alias for consistency with GameEngine
        
        // Movement
        this.speed = data.speed || 5; // tiles per second
        this.movementProgress = 0;
        this.facing = data.facing || 'south'; // north, south, east, west
        
        // Appearance
        this.color = data.color || '#4080ff';
        this.size = data.size || 0.8;
        this.width = data.width || 16; // For rendering
        this.height = data.height || 24; // For rendering
        this.nameColor = data.nameColor || '#ffff00';
        
        // Animation state
        this.animationState = 'idle'; // idle, walking, attacking, gathering
        this.animationFrame = 0;
        this.animationTime = 0;
        
        // Combat Stats
        this.combatStats = {
            hitpoints: data.combatStats?.hitpoints || 10,
            maxHitpoints: data.combatStats?.maxHitpoints || 10,
            prayer: data.combatStats?.prayer || 10,
            maxPrayer: data.combatStats?.maxPrayer || 10,
            energy: data.combatStats?.energy || 100,
            maxEnergy: data.combatStats?.maxEnergy || 100,
            
            attack: data.combatStats?.attack || 1,
            strength: data.combatStats?.strength || 1,
            defence: data.combatStats?.defence || 1,
            ranged: data.combatStats?.ranged || 1,
            magic: data.combatStats?.magic || 1,
            
            combatLevel: data.combatStats?.combatLevel || 3
        };
        
        // Expose HP for rendering
        this.hp = this.combatStats.hitpoints;
        this.maxHp = this.combatStats.maxHitpoints;
        
        // Skills (initialized with level 1, 0 XP)
        this.skills = data.skills || this.initializeSkills();
        
        // Inventory (28 slots)
        this.inventory = data.inventory || this.initializeInventory();
        this.inventoryWeight = 0;
        
        // Equipment slots
        this.equipment = data.equipment || {
            head: null,
            cape: null,
            neck: null,
            weapon: null,
            chest: null,
            shield: null,
            legs: null,
            hands: null,
            feet: null,
            ring: null,
            ammo: null
        };
        
        // Bank storage
        this.bank = data.bank || [];
        this.bankCapacity = data.bankCapacity || 300;
        
        // Quest data
        this.quests = data.quests || {};
        this.questPoints = data.questPoints || 0;
        
        // Current state
        this.inCombat = false;
        this.currentEnemy = null;
        this.currentActivity = null; // fishing, woodcutting, mining, etc.
        this.activityProgress = 0;
        
        // Interacting with
        this.interactingWith = null; // NPC, object, or other entity
        
        // Teleporting
        this.isTeleporting = false;
        this.teleportTarget = null;
        
        // Status effects
        this.statusEffects = [];
        
        // Timestamps
        this.lastSaved = data.lastSaved || Date.now();
        this.playTime = data.playTime || 0;
        this.lastLogout = data.lastLogout || null;
    }
    
    /**
     * Initialize all 15 skills with level 1 and 0 XP
     */
    initializeSkills() {
        const skillNames = [
            'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic',
            'cooking', 'woodcutting', 'fletching', 'fishing', 'firemaking', 'crafting',
            'smithing', 'mining', 'herblore', 'agility', 'thieving', 'slayer',
            'farming', 'runecraft', 'hunter', 'construction'
        ];
        
        const skills = {};
        skillNames.forEach(skill => {
            skills[skill] = {
                level: skill === 'hitpoints' ? 10 : 1,
                xp: skill === 'hitpoints' ? 1154 : 0,
                boostedLevel: skill === 'hitpoints' ? 10 : 1
            };
        });
        
        return skills;
    }
    
    /**
     * Initialize empty 28-slot inventory
     */
    initializeInventory() {
        return Array(28).fill(null);
    }
    
    /**
     * Update player state each frame
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update play time
        this.playTime += deltaTime;
        
        // Update movement
        if (this.moving) {
            this.updateMovement(deltaTime);
        }
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Regenerate energy when not moving
        if (!this.moving && this.combatStats.energy < this.combatStats.maxEnergy) {
            this.combatStats.energy = Math.min(
                this.combatStats.maxEnergy,
                this.combatStats.energy + (5 * deltaTime) // 5 energy per second
            );
        }
        
        // Passive HP regeneration (1 HP per minute when not in combat)
        if (!this.inCombat && this.combatStats.hitpoints < this.combatStats.maxHitpoints) {
            const regenRate = 1 / 60; // 1 HP per 60 seconds
            this.combatStats.hitpoints = Math.min(
                this.combatStats.maxHitpoints,
                this.combatStats.hitpoints + (regenRate * deltaTime)
            );
        }
        
        // Update activity progress
        if (this.currentActivity) {
            this.activityProgress += deltaTime;
        }
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // ✅ HIGH PRIORITY FIX: Sync properties for rendering consistency
        // This ensures renderer always has valid values
        this.hp = this.combatStats.hitpoints;
        this.maxHp = this.combatStats.maxHitpoints;
        this.isMoving = this.moving; // Keep both properties in sync
    }
    
    /**
     * Update movement towards target position
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateMovement(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.05) {
            // Reached target
            this.x = this.targetX;
            this.y = this.targetY;
            this.moving = false;
            this.movementProgress = 0;
            this.animationState = 'idle';
            return;
        }
        
        // Move towards target
        const moveDistance = this.speed * deltaTime;
        const moveRatio = Math.min(moveDistance / distance, 1);
        
        this.x += dx * moveRatio;
        this.y += dy * moveRatio;
        this.movementProgress += moveDistance;
        
        // Update facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'east' : 'west';
        } else {
            this.facing = dy > 0 ? 'south' : 'north';
        }
        
        // Drain energy while running
        if (this.speed > 3) {
            this.combatStats.energy = Math.max(
                0,
                this.combatStats.energy - (10 * deltaTime) // 10 energy per second
            );
            
            // Stop running if out of energy
            if (this.combatStats.energy <= 0) {
                this.speed = 3; // Walk speed
            }
        }
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Animation frame rate depends on state
        let frameRate = 0.2; // seconds per frame
        if (this.animationState === 'walking') {
            frameRate = 0.15;
        } else if (this.animationState === 'attacking') {
            frameRate = 0.1;
        }
        
        if (this.animationTime >= frameRate) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTime = 0;
        }
    }
    
    /**
     * Update status effects (buffs/debuffs)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateStatusEffects(deltaTime) {
        this.statusEffects = this.statusEffects.filter(effect => {
            effect.duration -= deltaTime;
            
            if (effect.duration <= 0) {
                this.removeStatusEffect(effect);
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Move player to target position
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.moving = true;
        this.animationState = 'walking';
    }
    
    /**
     * Stop player movement
     */
    stopMovement() {
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
        this.animationState = 'idle';
    }
    
    /**
     * Teleport player instantly to position
     * @param {number} x - Target X coordinate
     * @param {number} y - Target Y coordinate
     */
    teleportTo(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.moving = false;
        this.animationState = 'idle';
    }
    
    /**
     * Add XP to a skill
     * @param {string} skillName - Name of the skill
     * @param {number} xpAmount - Amount of XP to add
     * @returns {object} Result with levelUp boolean and new level
     */
    addXP(skillName, xpAmount) {
        if (!this.skills[skillName]) {
            console.error(`Invalid skill: ${skillName}`);
            return { levelUp: false, level: 0 };
        }
        
        // ✅ TASK 2.5 FIX: Delegate to SkillsSystem to properly emit events
        // This ensures UI updates, level-up notifications, and XP tracking work correctly
        if (window.gameEngine && window.gameEngine.skillsSystem) {
            // Use SkillsSystem which emits proper events
            const result = window.gameEngine.skillsSystem.addXP(this, skillName, xpAmount);
            return result || { levelUp: false, level: this.skills[skillName].level };
        }
        
        // Fallback for cases where SkillsSystem isn't available (shouldn't happen in normal gameplay)
        console.warn('⚠️ SkillsSystem not available, using fallback XP method');
        const skill = this.skills[skillName];
        const oldLevel = skill.level;
        
        skill.xp += xpAmount;
        
        // Check for level up
        const newLevel = this.getLevelFromXP(skill.xp);
        if (newLevel > oldLevel) {
            skill.level = newLevel;
            skill.boostedLevel = newLevel;
            
            // Update combat stats if combat skill
            if (['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic'].includes(skillName)) {
                this.updateCombatStats();
            }
            
            return { levelUp: true, level: newLevel, oldLevel };
        }
        
        return { levelUp: false, level: oldLevel };
    }
    
    /**
     * Get level from XP amount using RuneScape formula
     * @param {number} xp - XP amount
     * @returns {number} Corresponding level
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
        
        return level;
    }
    
    /**
     * Get XP required for next level
     * @param {string} skillName - Name of the skill
     * @returns {number} XP required for next level
     */
    getXPToNextLevel(skillName) {
        if (!this.skills[skillName]) return 0;
        
        const skill = this.skills[skillName];
        if (skill.level >= 99) return 0;
        
        let totalXP = 0;
        for (let i = 1; i <= skill.level; i++) {
            totalXP += Math.floor(i + 300 * Math.pow(2, i / 7));
        }
        const xpForNextLevel = Math.floor(totalXP / 4);
        
        return xpForNextLevel - skill.xp;
    }
    
    /**
     * Update combat level and stats based on skill levels
     */
    updateCombatStats() {
        // Update max HP
        this.combatStats.maxHitpoints = this.skills.hitpoints.level;
        
        // Heal if max HP increased
        if (this.combatStats.hitpoints > this.combatStats.maxHitpoints) {
            this.combatStats.hitpoints = this.combatStats.maxHitpoints;
        }
        
        // Update max prayer
        this.combatStats.maxPrayer = this.skills.prayer.level;
        
        // Calculate combat level (RuneScape formula)
        const base = 0.25 * (this.skills.defence.level + this.skills.hitpoints.level + Math.floor(this.skills.prayer.level / 2));
        const melee = 0.325 * (this.skills.attack.level + this.skills.strength.level);
        const range = 0.325 * (Math.floor(this.skills.ranged.level / 2) + this.skills.ranged.level);
        const mage = 0.325 * (Math.floor(this.skills.magic.level / 2) + this.skills.magic.level);
        
        this.combatStats.combatLevel = Math.floor(base + Math.max(melee, range, mage));
    }
    
    /**
     * Add item to inventory
     * @param {object} item - Item to add
     * @param {number} quantity - Quantity to add
     * @returns {boolean} Success
     */
    addToInventory(item, quantity = 1) {
        // Check if item is stackable
        if (item.stackable) {
            // Find existing stack
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i] && this.inventory[i].id === item.id) {
                    this.inventory[i].quantity += quantity;
                    this.updateInventoryWeight();
                    return true;
                }
            }
        }
        
        // Find empty slot(s)
        let remaining = quantity;
        for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
            if (!this.inventory[i]) {
                this.inventory[i] = {
                    ...item,
                    quantity: item.stackable ? remaining : 1
                };
                remaining = item.stackable ? 0 : remaining - 1;
                
                if (!item.stackable && remaining === 0) {
                    break;
                }
            }
        }
        
        this.updateInventoryWeight();
        return remaining === 0;
    }
    
    /**
     * Remove item from inventory
     * @param {string} itemId - Item ID to remove
     * @param {number} quantity - Quantity to remove
     * @returns {boolean} Success
     */
    removeFromInventory(itemId, quantity = 1) {
        let remaining = quantity;
        
        for (let i = 0; i < this.inventory.length && remaining > 0; i++) {
            if (this.inventory[i] && this.inventory[i].id === itemId) {
                if (this.inventory[i].quantity > remaining) {
                    this.inventory[i].quantity -= remaining;
                    remaining = 0;
                } else {
                    remaining -= this.inventory[i].quantity;
                    this.inventory[i] = null;
                }
            }
        }
        
        this.updateInventoryWeight();
        return remaining === 0;
    }
    
    /**
     * Check if player has item in inventory
     * @param {string} itemId - Item ID to check
     * @param {number} quantity - Quantity required
     * @returns {boolean} Has item
     */
    hasItem(itemId, quantity = 1) {
        let count = 0;
        
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] && this.inventory[i].id === itemId) {
                count += this.inventory[i].quantity;
            }
        }
        
        return count >= quantity;
    }
    
    /**
     * Get total inventory weight
     */
    updateInventoryWeight() {
        this.inventoryWeight = 0;
        
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i]) {
                this.inventoryWeight += (this.inventory[i].weight || 0) * this.inventory[i].quantity;
            }
        }
    }
    
    /**
     * Equip item from inventory
     * @param {number} slotIndex - Inventory slot index
     * @returns {boolean} Success
     */
    equipItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || !item.equipSlot) return false;
        
        // Remove from inventory
        this.inventory[slotIndex] = null;
        
        // Unequip current item in slot
        if (this.equipment[item.equipSlot]) {
            this.addToInventory(this.equipment[item.equipSlot]);
        }
        
        // Equip new item
        this.equipment[item.equipSlot] = item;
        this.updateInventoryWeight();
        
        return true;
    }
    
    /**
     * Unequip item to inventory
     * @param {string} slot - Equipment slot name
     * @returns {boolean} Success
     */
    unequipItem(slot) {
        if (!this.equipment[slot]) return false;
        
        const item = this.equipment[slot];
        if (this.addToInventory(item)) {
            this.equipment[slot] = null;
            return true;
        }
        
        return false;
    }
    
    /**
     * Take damage
     * @param {number} damage - Damage amount
     */
    takeDamage(damage) {
        this.combatStats.hitpoints = Math.max(0, this.combatStats.hitpoints - damage);
        
        if (this.combatStats.hitpoints === 0) {
            this.die();
        }
    }
    
    /**
     * Heal hitpoints
     * @param {number} amount - Amount to heal
     */
    heal(amount) {
        this.combatStats.hitpoints = Math.min(
            this.combatStats.maxHitpoints,
            this.combatStats.hitpoints + amount
        );
    }
    
    /**
     * Player death
     */
    die() {
        this.inCombat = false;
        this.currentEnemy = null;
        this.currentActivity = null;
        
        // Respawn logic would go here
        // For now, respawn at starting position with full HP
        this.teleportTo(10, 10);
        this.combatStats.hitpoints = this.combatStats.maxHitpoints;
    }
    
    /**
     * Add status effect
     * @param {object} effect - Status effect
     */
    addStatusEffect(effect) {
        this.statusEffects.push({
            ...effect,
            startTime: Date.now()
        });
    }
    
    /**
     * Remove status effect
     * @param {object} effect - Status effect to remove
     */
    removeStatusEffect(effect) {
        // Apply any cleanup logic here
        if (effect.onRemove) {
            effect.onRemove(this);
        }
    }
    
    /**
     * Serialize player data for saving
     * @returns {object} Serialized player data
     */
    serialize() {
        return {
            id: this.id,
            username: this.username,
            x: this.x,
            y: this.y,
            facing: this.facing,
            combatStats: { ...this.combatStats },
            skills: JSON.parse(JSON.stringify(this.skills)),
            inventory: this.inventory.map(item => item ? { ...item } : null),
            equipment: { ...this.equipment },
            bank: [...this.bank],
            bankCapacity: this.bankCapacity,
            quests: { ...this.quests },
            questPoints: this.questPoints,
            playTime: this.playTime,
            lastSaved: Date.now(),
            lastLogout: Date.now()
        };
    }
    
    /**
     * Create player from serialized data
     * @param {object} data - Serialized player data
     * @returns {Player} Player instance
     */
    static deserialize(data) {
        return new Player(data);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
