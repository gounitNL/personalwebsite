/**
 * EquipmentSystem.js - Equipment Management System
 * Handles 11 equipment slots, stat bonuses, equip/unequip logic
 */

class EquipmentSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Equipment slots definition (RuneScape style)
        this.slots = {
            head: null,
            cape: null,
            amulet: null,
            weapon: null,
            body: null,
            shield: null,
            legs: null,
            gloves: null,
            boots: null,
            ring: null,
            ammo: null
        };
        
        // Bonus stats from equipped items
        this.bonuses = {
            // Attack bonuses
            attackStab: 0,
            attackSlash: 0,
            attackCrush: 0,
            attackMagic: 0,
            attackRanged: 0,
            
            // Defence bonuses
            defenceStab: 0,
            defenceSlash: 0,
            defenceCrush: 0,
            defenceMagic: 0,
            defenceRanged: 0,
            
            // Other bonuses
            meleeStrength: 0,
            rangedStrength: 0,
            magicDamage: 0,
            prayer: 0
        };
        
        console.log('EquipmentSystem initialized');
    }
    
    /**
     * Initialize system with game configuration
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('EquipmentSystem ready with', Object.keys(this.slots).length, 'equipment slots');
    }
    
    /**
     * Equip an item from inventory
     * @param {object} player - Player entity
     * @param {string} itemId - Item ID to equip
     * @param {number} inventorySlot - Source inventory slot
     * @returns {object} Result with success status and message
     */
    equipItem(player, itemId, inventorySlot) {
        // Get item data
        const itemData = this.gameConfig.items[itemId];
        
        if (!itemData) {
            return {
                success: false,
                message: `Invalid item: ${itemId}`
            };
        }
        
        // Check if item is equippable
        if (!itemData.equipable) {
            return {
                success: false,
                message: `${itemData.name} cannot be equipped`
            };
        }
        
        // Check level requirements
        const reqCheck = this.checkRequirements(player, itemData);
        if (!reqCheck.success) {
            return reqCheck;
        }
        
        // Determine equipment slot
        const slot = itemData.equipSlot;
        if (!this.slots.hasOwnProperty(slot)) {
            return {
                success: false,
                message: `Invalid equipment slot: ${slot}`
            };
        }
        
        // Handle two-handed weapons
        if (itemData.twoHanded && this.slots.shield) {
            // Need to unequip shield first
            const unequipResult = this.unequipItem(player, 'shield');
            if (!unequipResult.success) {
                return {
                    success: false,
                    message: 'Inventory full - cannot unequip shield for two-handed weapon'
                };
            }
        }
        
        // Handle shield when equipping (blocks two-handed weapons)
        if (slot === 'shield' && this.slots.weapon) {
            const weaponData = this.gameConfig.items[this.slots.weapon.itemId];
            if (weaponData && weaponData.twoHanded) {
                return {
                    success: false,
                    message: 'Cannot equip shield while wielding a two-handed weapon'
                };
            }
        }
        
        // Unequip current item in slot (if any)
        if (this.slots[slot]) {
            const unequipResult = this.unequipItem(player, slot);
            if (!unequipResult.success) {
                return {
                    success: false,
                    message: 'Inventory full - cannot unequip current item'
                };
            }
        }
        
        // Remove item from inventory
        const inventorySystem = this.gameEngine.inventorySystem;
        if (!inventorySystem) {
            return {
                success: false,
                message: 'Inventory system not available'
            };
        }
        
        const removeResult = inventorySystem.removeItem(player, inventorySlot, 1);
        if (!removeResult.success) {
            return {
                success: false,
                message: 'Failed to remove item from inventory'
            };
        }
        
        // Equip the item
        this.slots[slot] = {
            itemId: itemId,
            data: itemData,
            quantity: 1
        };
        
        // Recalculate bonuses
        this.calculateBonuses();
        
        // Emit equipment change event
        this.gameEngine.emit('equipment_changed', {
            player,
            slot,
            itemId,
            action: 'equip'
        });
        
        // Update player combat stats
        if (player.updateCombatStats) {
            player.updateCombatStats();
        }
        
        console.log(`✅ Equipped ${itemData.name} in ${slot} slot`);
        
        return {
            success: true,
            message: `Equipped ${itemData.name}`,
            slot,
            itemId
        };
    }
    
    /**
     * Unequip an item and return to inventory
     * @param {object} player - Player entity
     * @param {string} slot - Equipment slot name
     * @returns {object} Result with success status
     */
    unequipItem(player, slot) {
        if (!this.slots[slot]) {
            return {
                success: false,
                message: `No item equipped in ${slot} slot`
            };
        }
        
        const equippedItem = this.slots[slot];
        const itemData = equippedItem.data;
        
        // Try to add to inventory
        const inventorySystem = this.gameEngine.inventorySystem;
        if (!inventorySystem) {
            return {
                success: false,
                message: 'Inventory system not available'
            };
        }
        
        const addResult = inventorySystem.addItem(player, equippedItem.itemId, 1);
        if (!addResult.success || addResult.remaining > 0) {
            return {
                success: false,
                message: 'Inventory is full'
            };
        }
        
        // Remove from equipment slot
        this.slots[slot] = null;
        
        // Recalculate bonuses
        this.calculateBonuses();
        
        // Emit equipment change event
        this.gameEngine.emit('equipment_changed', {
            player,
            slot,
            itemId: equippedItem.itemId,
            action: 'unequip'
        });
        
        // Update player combat stats
        if (player.updateCombatStats) {
            player.updateCombatStats();
        }
        
        console.log(`✅ Unequipped ${itemData.name} from ${slot} slot`);
        
        return {
            success: true,
            message: `Unequipped ${itemData.name}`,
            slot,
            itemId: equippedItem.itemId
        };
    }
    
    /**
     * Check if player meets item requirements
     * @param {object} player - Player entity
     * @param {object} itemData - Item data from config
     * @returns {object} Result with success and message
     */
    checkRequirements(player, itemData) {
        if (!itemData.requirements) {
            return { success: true };
        }
        
        const reqs = itemData.requirements;
        
        // Check level requirements
        if (reqs.attack && player.skills.attack.level < reqs.attack) {
            return {
                success: false,
                message: `Requires ${reqs.attack} Attack`
            };
        }
        
        if (reqs.strength && player.skills.strength.level < reqs.strength) {
            return {
                success: false,
                message: `Requires ${reqs.strength} Strength`
            };
        }
        
        if (reqs.defence && player.skills.defence.level < reqs.defence) {
            return {
                success: false,
                message: `Requires ${reqs.defence} Defence`
            };
        }
        
        if (reqs.ranged && player.skills.ranged.level < reqs.ranged) {
            return {
                success: false,
                message: `Requires ${reqs.ranged} Ranged`
            };
        }
        
        if (reqs.magic && player.skills.magic.level < reqs.magic) {
            return {
                success: false,
                message: `Requires ${reqs.magic} Magic`
            };
        }
        
        if (reqs.prayer && player.skills.prayer.level < reqs.prayer) {
            return {
                success: false,
                message: `Requires ${reqs.prayer} Prayer`
            };
        }
        
        // Check quest requirements (if implemented)
        if (reqs.quest) {
            // TODO: Check quest completion when QuestSystem is implemented
        }
        
        return { success: true };
    }
    
    /**
     * Calculate total bonuses from all equipped items
     */
    calculateBonuses() {
        // Reset all bonuses
        for (const key in this.bonuses) {
            this.bonuses[key] = 0;
        }
        
        // Sum bonuses from all equipped items
        for (const slotName in this.slots) {
            const equipped = this.slots[slotName];
            if (!equipped || !equipped.data) continue;
            
            const itemData = equipped.data;
            const bonuses = itemData.bonuses;
            
            if (!bonuses) continue;
            
            // Add bonuses
            if (bonuses.attackStab) this.bonuses.attackStab += bonuses.attackStab;
            if (bonuses.attackSlash) this.bonuses.attackSlash += bonuses.attackSlash;
            if (bonuses.attackCrush) this.bonuses.attackCrush += bonuses.attackCrush;
            if (bonuses.attackMagic) this.bonuses.attackMagic += bonuses.attackMagic;
            if (bonuses.attackRanged) this.bonuses.attackRanged += bonuses.attackRanged;
            
            if (bonuses.defenceStab) this.bonuses.defenceStab += bonuses.defenceStab;
            if (bonuses.defenceSlash) this.bonuses.defenceSlash += bonuses.defenceSlash;
            if (bonuses.defenceCrush) this.bonuses.defenceCrush += bonuses.defenceCrush;
            if (bonuses.defenceMagic) this.bonuses.defenceMagic += bonuses.defenceMagic;
            if (bonuses.defenceRanged) this.bonuses.defenceRanged += bonuses.defenceRanged;
            
            if (bonuses.meleeStrength) this.bonuses.meleeStrength += bonuses.meleeStrength;
            if (bonuses.rangedStrength) this.bonuses.rangedStrength += bonuses.rangedStrength;
            if (bonuses.magicDamage) this.bonuses.magicDamage += bonuses.magicDamage;
            if (bonuses.prayer) this.bonuses.prayer += bonuses.prayer;
        }
        
        console.log('Equipment bonuses recalculated:', this.bonuses);
    }
    
    /**
     * Get attack bonus for specific attack style
     * @param {string} style - Attack style: 'stab', 'slash', 'crush', 'magic', 'ranged'
     * @returns {number} Attack bonus
     */
    getAttackBonus(style = 'slash') {
        switch (style.toLowerCase()) {
            case 'stab': return this.bonuses.attackStab;
            case 'slash': return this.bonuses.attackSlash;
            case 'crush': return this.bonuses.attackCrush;
            case 'magic': return this.bonuses.attackMagic;
            case 'ranged': return this.bonuses.attackRanged;
            default: return this.bonuses.attackSlash; // Default to slash
        }
    }
    
    /**
     * Get defence bonus for specific attack style
     * @param {string} style - Attack style: 'stab', 'slash', 'crush', 'magic', 'ranged'
     * @returns {number} Defence bonus
     */
    getDefenceBonus(style = 'slash') {
        switch (style.toLowerCase()) {
            case 'stab': return this.bonuses.defenceStab;
            case 'slash': return this.bonuses.defenceSlash;
            case 'crush': return this.bonuses.defenceCrush;
            case 'magic': return this.bonuses.defenceMagic;
            case 'ranged': return this.bonuses.defenceRanged;
            default: return this.bonuses.defenceSlash;
        }
    }
    
    /**
     * Get strength bonus
     * @returns {number} Melee strength bonus
     */
    getStrengthBonus() {
        return this.bonuses.meleeStrength;
    }
    
    /**
     * Get all equipped items
     * @returns {object} All equipment slots
     */
    getAllEquipped() {
        return { ...this.slots };
    }
    
    /**
     * Get equipped item in specific slot
     * @param {string} slot - Slot name
     * @returns {object|null} Equipped item or null
     */
    getEquipped(slot) {
        return this.slots[slot] || null;
    }
    
    /**
     * Check if item is equipped
     * @param {string} itemId - Item ID
     * @returns {boolean} True if equipped
     */
    isEquipped(itemId) {
        for (const slot in this.slots) {
            if (this.slots[slot] && this.slots[slot].itemId === itemId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get combat level from equipment and skills
     * @param {object} player - Player entity
     * @returns {number} Combat level
     */
    calculateCombatLevel(player) {
        const base = 0.25 * (player.skills.defence.level + player.skills.hitpoints.level + Math.floor(player.skills.prayer.level / 2));
        
        const melee = 0.325 * (player.skills.attack.level + player.skills.strength.level);
        const ranged = 0.325 * Math.floor(player.skills.ranged.level * 1.5);
        const magic = 0.325 * Math.floor(player.skills.magic.level * 1.5);
        
        const combatLevel = Math.floor(base + Math.max(melee, ranged, magic));
        
        return combatLevel;
    }
    
    /**
     * Unequip all items (e.g., on death)
     * @param {object} player - Player entity
     * @returns {object} Result with success status
     */
    unequipAll(player) {
        const unequipped = [];
        const failed = [];
        
        for (const slot in this.slots) {
            if (this.slots[slot]) {
                const result = this.unequipItem(player, slot);
                if (result.success) {
                    unequipped.push(slot);
                } else {
                    failed.push(slot);
                }
            }
        }
        
        return {
            success: failed.length === 0,
            unequipped,
            failed,
            message: failed.length > 0 ? 'Some items could not be unequipped (inventory full)' : 'All items unequipped'
        };
    }
    
    /**
     * Update system (called every frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Equipment system doesn't need per-frame updates
        // All changes are event-driven
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquipmentSystem;
}
