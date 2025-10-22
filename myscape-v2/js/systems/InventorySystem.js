/**
 * InventorySystem.js - Inventory Management System
 * 
 * Manages player inventory with 28 slots, item stacking, drag-and-drop support,
 * item examination, and integration with game config. Handles adding, removing,
 * moving, and dropping items.
 * 
 * @class InventorySystem
 */

class InventorySystem {
    constructor(gameEngine, size = 28) {
        this.gameEngine = gameEngine;
        this.size = size;
        this.gameConfig = null; // Will be set from GameConfig
        
        // Inventory slots (array of items or null)
        this.slots = Array(size).fill(null);
        
        // Selected item for drag-drop
        this.selectedSlot = null;
        this.draggedItem = null;
        
        // Weight tracking
        this.totalWeight = 0;
        this.maxWeight = 1000; // kg (affects run energy)
    }
    
    /**
     * Initialize the inventory system
     * @param {object} gameConfig - Game configuration object
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('InventorySystem initialized with', this.size, 'slots');
    }
    
    /**
     * Get item data from config
     * @param {string} itemId - Item ID
     * @returns {object} Item configuration data
     */
    getItemConfig(itemId) {
        if (!this.gameConfig || !this.gameConfig.items) {
            console.error('Game config not loaded');
            return null;
        }
        
        return this.gameConfig.items[itemId];
    }
    
    /**
     * Add item to inventory
     * @param {string} itemId - Item ID to add
     * @param {number} amount - Amount to add
     * @param {object} options - Additional options (silent, forceSlot)
     * @returns {object} Result with success, remaining, and addedSlots
     */
    addItem(itemId, amount = 1, options = {}) {
        const itemConfig = this.getItemConfig(itemId);
        if (!itemConfig) {
            console.error(`Invalid item ID: ${itemId}`);
            return { success: false, remaining: amount, addedSlots: [] };
        }
        
        let remaining = amount;
        const addedSlots = [];
        
        // If item is stackable, try to find existing stack
        if (itemConfig.stackable) {
            for (let i = 0; i < this.slots.length; i++) {
                if (this.slots[i] && this.slots[i].id === itemId) {
                    this.slots[i].quantity += remaining;
                    addedSlots.push(i);
                    remaining = 0;
                    
                    if (!options.silent) {
                        this.gameEngine.emit('inventory:itemAdded', {
                            itemId,
                            amount,
                            slot: i,
                            stackable: true
                        });
                    }
                    
                    this.updateWeight();
                    return { success: true, remaining: 0, addedSlots };
                }
            }
        }
        
        // Add to empty slots
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            if (this.slots[i] === null) {
                const addAmount = itemConfig.stackable ? remaining : 1;
                
                this.slots[i] = {
                    id: itemId,
                    name: itemConfig.name,
                    quantity: addAmount,
                    stackable: itemConfig.stackable || false,
                    equipSlot: itemConfig.equipSlot || null,
                    weight: itemConfig.weight || 0,
                    value: itemConfig.value || 0,
                    examine: itemConfig.examine || '',
                    icon: itemConfig.icon || null
                };
                
                addedSlots.push(i);
                remaining -= addAmount;
                
                if (!options.silent) {
                    this.gameEngine.emit('inventory:itemAdded', {
                        itemId,
                        amount: addAmount,
                        slot: i,
                        stackable: itemConfig.stackable
                    });
                }
                
                if (!itemConfig.stackable && remaining === 0) {
                    break;
                }
            }
        }
        
        this.updateWeight();
        
        const success = remaining === 0;
        if (!success && !options.silent) {
            this.gameEngine.emit('inventory:full', { itemId, remaining });
        }
        
        return { success, remaining, addedSlots };
    }
    
    /**
     * Remove item from inventory
     * @param {string} itemId - Item ID to remove
     * @param {number} amount - Amount to remove
     * @param {object} options - Additional options (silent)
     * @returns {object} Result with success and removed count
     */
    removeItem(itemId, amount = 1, options = {}) {
        let remaining = amount;
        const removedSlots = [];
        
        // Remove from slots
        for (let i = 0; i < this.slots.length && remaining > 0; i++) {
            if (this.slots[i] && this.slots[i].id === itemId) {
                if (this.slots[i].quantity > remaining) {
                    // Partial removal from stack
                    this.slots[i].quantity -= remaining;
                    removedSlots.push(i);
                    remaining = 0;
                } else {
                    // Remove entire stack/item
                    remaining -= this.slots[i].quantity;
                    removedSlots.push(i);
                    this.slots[i] = null;
                }
                
                if (!options.silent) {
                    this.gameEngine.emit('inventory:itemRemoved', {
                        itemId,
                        slot: i
                    });
                }
            }
        }
        
        this.updateWeight();
        
        const success = remaining === 0;
        return { success, removed: amount - remaining, removedSlots };
    }
    
    /**
     * Check if player has item in inventory
     * @param {string} itemId - Item ID to check
     * @param {number} amount - Amount required
     * @returns {boolean} Has enough items
     */
    hasItem(itemId, amount = 1) {
        let count = 0;
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] && this.slots[i].id === itemId) {
                count += this.slots[i].quantity;
                if (count >= amount) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Get item count in inventory
     * @param {string} itemId - Item ID to count
     * @returns {number} Total count
     */
    getItemCount(itemId) {
        let count = 0;
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] && this.slots[i].id === itemId) {
                count += this.slots[i].quantity;
            }
        }
        
        return count;
    }
    
    /**
     * Get item in specific slot
     * @param {number} slot - Slot index
     * @returns {object|null} Item or null
     */
    getItem(slot) {
        if (slot < 0 || slot >= this.size) {
            return null;
        }
        
        return this.slots[slot];
    }
    
    /**
     * Get all non-empty slots
     * @returns {array} Array of {slot, item} objects
     */
    getAllItems() {
        const items = [];
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                items.push({
                    slot: i,
                    item: this.slots[i]
                });
            }
        }
        
        return items;
    }
    
    /**
     * Get first slot containing item
     * @param {string} itemId - Item ID to find
     * @returns {number} Slot index or -1 if not found
     */
    findItem(itemId) {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] && this.slots[i].id === itemId) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Get first empty slot
     * @returns {number} Slot index or -1 if full
     */
    getFirstEmptySlot() {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] === null) {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Count empty slots
     * @returns {number} Number of empty slots
     */
    getEmptySlotCount() {
        let count = 0;
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] === null) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Check if inventory is full
     * @returns {boolean} Is full
     */
    isFull() {
        return this.getEmptySlotCount() === 0;
    }
    
    /**
     * Move item from one slot to another
     * @param {number} fromSlot - Source slot
     * @param {number} toSlot - Destination slot
     * @returns {boolean} Success
     */
    moveItem(fromSlot, toSlot) {
        if (fromSlot < 0 || fromSlot >= this.size || toSlot < 0 || toSlot >= this.size) {
            return false;
        }
        
        if (fromSlot === toSlot) {
            return true;
        }
        
        const fromItem = this.slots[fromSlot];
        const toItem = this.slots[toSlot];
        
        if (!fromItem) {
            return false;
        }
        
        // Check if items can stack
        if (toItem && fromItem.id === toItem.id && fromItem.stackable) {
            // Merge stacks
            toItem.quantity += fromItem.quantity;
            this.slots[fromSlot] = null;
        } else {
            // Swap items
            this.slots[toSlot] = fromItem;
            this.slots[fromSlot] = toItem;
        }
        
        this.gameEngine.emit('inventory:itemMoved', { fromSlot, toSlot });
        return true;
    }
    
    /**
     * Swap items between two slots
     * @param {number} slot1 - First slot
     * @param {number} slot2 - Second slot
     * @returns {boolean} Success
     */
    swapItems(slot1, slot2) {
        if (slot1 < 0 || slot1 >= this.size || slot2 < 0 || slot2 >= this.size) {
            return false;
        }
        
        const temp = this.slots[slot1];
        this.slots[slot1] = this.slots[slot2];
        this.slots[slot2] = temp;
        
        this.gameEngine.emit('inventory:itemsSwapped', { slot1, slot2 });
        return true;
    }
    
    /**
     * Drop item from inventory
     * @param {number} slot - Slot to drop from
     * @param {number} amount - Amount to drop (for stackables)
     * @returns {object} Dropped item data or null
     */
    dropItem(slot, amount = 1) {
        if (slot < 0 || slot >= this.size || !this.slots[slot]) {
            return null;
        }
        
        const item = this.slots[slot];
        let droppedItem = null;
        
        if (item.stackable && item.quantity > amount) {
            // Drop partial stack
            droppedItem = {
                ...item,
                quantity: amount
            };
            item.quantity -= amount;
        } else {
            // Drop entire item/stack
            droppedItem = { ...item };
            this.slots[slot] = null;
        }
        
        this.updateWeight();
        this.gameEngine.emit('inventory:itemDropped', { slot, item: droppedItem });
        
        return droppedItem;
    }
    
    /**
     * Use item from inventory
     * @param {number} slot - Slot to use from
     * @param {object} target - Optional target (enemy, resource, etc.)
     * @returns {boolean} Success
     */
    useItem(slot, target = null) {
        if (slot < 0 || slot >= this.size || !this.slots[slot]) {
            return false;
        }
        
        const item = this.slots[slot];
        const itemConfig = this.getItemConfig(item.id);
        
        if (!itemConfig) {
            return false;
        }
        
        // Handle different item types
        if (itemConfig.type === 'food') {
            // Consume food
            this.gameEngine.emit('item:consume', { item, slot });
            
            // Remove consumed item
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.slots[slot] = null;
            }
            
            this.updateWeight();
            return true;
        } else if (itemConfig.type === 'potion') {
            // Drink potion
            this.gameEngine.emit('item:drink', { item, slot });
            
            // Remove consumed dose
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.slots[slot] = null;
            }
            
            this.updateWeight();
            return true;
        } else if (itemConfig.equipSlot) {
            // Equip item
            this.gameEngine.emit('item:equip', { item, slot });
            return true;
        } else if (itemConfig.type === 'tool') {
            // Use tool on target
            this.gameEngine.emit('item:useTool', { item, slot, target });
            return true;
        }
        
        return false;
    }
    
    /**
     * Examine item in slot
     * @param {number} slot - Slot to examine
     * @returns {string} Examine text
     */
    examineItem(slot) {
        if (slot < 0 || slot >= this.size || !this.slots[slot]) {
            return null;
        }
        
        const item = this.slots[slot];
        const itemConfig = this.getItemConfig(item.id);
        
        if (!itemConfig) {
            return 'An unknown item.';
        }
        
        return itemConfig.examine || `A ${itemConfig.name}.`;
    }
    
    /**
     * Clear entire inventory
     * @param {object} options - Options (silent)
     */
    clearInventory(options = {}) {
        this.slots = Array(this.size).fill(null);
        this.totalWeight = 0;
        
        if (!options.silent) {
            this.gameEngine.emit('inventory:cleared');
        }
    }
    
    /**
     * Update total inventory weight
     */
    updateWeight() {
        this.totalWeight = 0;
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                this.totalWeight += (this.slots[i].weight || 0) * this.slots[i].quantity;
            }
        }
        
        this.gameEngine.emit('inventory:weightChanged', { weight: this.totalWeight });
    }
    
    /**
     * Get total inventory value
     * @returns {number} Total value in gold
     */
    getTotalValue() {
        let totalValue = 0;
        
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i]) {
                totalValue += (this.slots[i].value || 0) * this.slots[i].quantity;
            }
        }
        
        return totalValue;
    }
    
    /**
     * Sort inventory by type, value, or name
     * @param {string} sortBy - Sort criteria (type, value, name)
     */
    sortInventory(sortBy = 'type') {
        const items = this.getAllItems();
        
        // Sort items
        items.sort((a, b) => {
            const itemA = this.getItemConfig(a.item.id);
            const itemB = this.getItemConfig(b.item.id);
            
            if (!itemA || !itemB) return 0;
            
            if (sortBy === 'type') {
                return (itemA.type || '').localeCompare(itemB.type || '');
            } else if (sortBy === 'value') {
                return (itemB.value || 0) - (itemA.value || 0);
            } else if (sortBy === 'name') {
                return itemA.name.localeCompare(itemB.name);
            }
            
            return 0;
        });
        
        // Clear and refill inventory
        this.slots = Array(this.size).fill(null);
        items.forEach((itemData, index) => {
            this.slots[index] = itemData.item;
        });
        
        this.gameEngine.emit('inventory:sorted', { sortBy });
    }
    
    /**
     * Serialize inventory data for saving
     * @returns {array} Serialized inventory
     */
    serialize() {
        return this.slots.map(item => {
            if (item) {
                return {
                    id: item.id,
                    quantity: item.quantity
                };
            }
            return null;
        });
    }
    
    /**
     * Load inventory from serialized data
     * @param {array} data - Serialized inventory data
     */
    deserialize(data) {
        if (!Array.isArray(data)) {
            console.error('Invalid inventory data');
            return;
        }
        
        this.slots = Array(this.size).fill(null);
        
        for (let i = 0; i < Math.min(data.length, this.size); i++) {
            if (data[i]) {
                const itemConfig = this.getItemConfig(data[i].id);
                if (itemConfig) {
                    this.slots[i] = {
                        id: data[i].id,
                        name: itemConfig.name,
                        quantity: data[i].quantity || 1,
                        stackable: itemConfig.stackable || false,
                        equipSlot: itemConfig.equipSlot || null,
                        weight: itemConfig.weight || 0,
                        value: itemConfig.value || 0,
                        examine: itemConfig.examine || '',
                        icon: itemConfig.icon || null
                    };
                }
            }
        }
        
        this.updateWeight();
    }
    
    /**
     * Update system (called each frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Future: Handle item effects, degradation, etc.
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventorySystem;
}
