/**
 * BankingSystem.js - Bank Storage Management System
 * 
 * Manages player bank storage with 400+ slots organized in tabs.
 * Handles deposit, withdraw, quantity selection, and item organization.
 * RuneScape-style banking with search and filtering.
 * 
 * @class BankingSystem
 */

class BankingSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Bank configuration
        this.maxTabs = 9;
        this.slotsPerTab = 50;
        this.totalSlots = this.maxTabs * this.slotsPerTab; // 450 slots total
        
        // Bank storage - organized by tabs
        this.tabs = [];
        for (let i = 0; i < this.maxTabs; i++) {
            this.tabs.push({
                id: i,
                name: i === 0 ? 'Main' : `Tab ${i}`,
                icon: this.getTabIcon(i),
                items: [] // Array of {itemId, quantity, slot}
            });
        }
        
        // Current tab being viewed
        this.currentTab = 0;
        
        // Bank state
        this.isOpen = false;
        this.lastUsedBankerId = null;
        
        // Search and filter
        this.searchQuery = '';
        this.filterCategory = 'all'; // all, weapon, armor, resource, etc.
        
        console.log('BankingSystem initialized with', this.totalSlots, 'total slots');
    }
    
    /**
     * Initialize banking system with game config
     * @param {object} gameConfig - Game configuration
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('BankingSystem ready');
    }
    
    /**
     * Get icon for tab
     * @param {number} tabIndex - Tab index
     * @returns {string} Icon emoji
     */
    getTabIcon(tabIndex) {
        const icons = ['📦', '⚔️', '🛡️', '⛏️', '🪓', '🎣', '🔨', '✨', '💎'];
        return icons[tabIndex] || '📦';
    }
    
    /**
     * Open bank interface
     * @param {string} bankerId - NPC banker ID (optional)
     * @returns {object} Result with success status
     */
    openBank(bankerId = null) {
        this.isOpen = true;
        this.lastUsedBankerId = bankerId;
        
        console.log('🏦 Bank opened');
        
        this.gameEngine.emit('bank:opened', {
            bankerId,
            tabs: this.tabs,
            currentTab: this.currentTab
        });
        
        return {
            success: true,
            message: 'Bank opened'
        };
    }
    
    /**
     * Close bank interface
     */
    closeBank() {
        this.isOpen = false;
        
        console.log('🏦 Bank closed');
        
        this.gameEngine.emit('bank:closed');
        
        return {
            success: true,
            message: 'Bank closed'
        };
    }
    
    /**
     * Deposit item from inventory to bank
     * @param {object} player - Player entity
     * @param {number} inventorySlot - Inventory slot index
     * @param {number} quantity - Amount to deposit (0 = all)
     * @returns {object} Result with success status
     */
    depositItem(player, inventorySlot, quantity = 0) {
        if (!this.isOpen) {
            return {
                success: false,
                message: 'Bank is not open'
            };
        }
        
        // Get item from inventory
        const inventorySystem = this.gameEngine.inventorySystem;
        if (!inventorySystem) {
            return {
                success: false,
                message: 'Inventory system not available'
            };
        }
        
        const inventoryItem = player.inventory[inventorySlot];
        if (!inventoryItem) {
            return {
                success: false,
                message: 'No item in that slot'
            };
        }
        
        const itemId = inventoryItem.id || inventoryItem.itemId;
        const itemData = this.gameConfig.items[itemId];
        
        if (!itemData) {
            return {
                success: false,
                message: 'Invalid item'
            };
        }
        
        // Determine quantity to deposit
        const availableQty = inventoryItem.quantity || 1;
        const depositQty = quantity === 0 ? availableQty : Math.min(quantity, availableQty);
        
        // Check if item can be stacked in bank
        const existingBankItem = this.findItemInBank(itemId);
        
        if (existingBankItem && itemData.stackable) {
            // Stack with existing item
            existingBankItem.quantity += depositQty;
        } else {
            // Find empty slot in current tab
            const emptySlot = this.findEmptySlot(this.currentTab);
            
            if (emptySlot === -1) {
                return {
                    success: false,
                    message: 'Bank tab is full'
                };
            }
            
            // Add to bank
            this.tabs[this.currentTab].items.push({
                itemId: itemId,
                quantity: depositQty,
                slot: emptySlot,
                data: itemData
            });
        }
        
        // Remove from inventory
        const removeResult = inventorySystem.removeItem(player, inventorySlot, depositQty);
        
        if (!removeResult.success) {
            return {
                success: false,
                message: 'Failed to remove from inventory'
            };
        }
        
        console.log(`💰 Deposited ${depositQty}x ${itemData.name}`);
        
        this.gameEngine.emit('bank:deposited', {
            itemId,
            itemName: itemData.name,
            quantity: depositQty,
            tab: this.currentTab
        });
        
        return {
            success: true,
            message: `Deposited ${depositQty}x ${itemData.name}`,
            quantity: depositQty
        };
    }
    
    /**
     * Withdraw item from bank to inventory
     * @param {object} player - Player entity
     * @param {number} tabIndex - Bank tab index
     * @param {number} bankSlot - Bank slot index within tab
     * @param {number} quantity - Amount to withdraw (0 = all)
     * @returns {object} Result with success status
     */
    withdrawItem(player, tabIndex, bankSlot, quantity = 0) {
        if (!this.isOpen) {
            return {
                success: false,
                message: 'Bank is not open'
            };
        }
        
        // Find item in bank
        const tab = this.tabs[tabIndex];
        if (!tab) {
            return {
                success: false,
                message: 'Invalid tab'
            };
        }
        
        const bankItem = tab.items.find(item => item.slot === bankSlot);
        if (!bankItem) {
            return {
                success: false,
                message: 'No item in that slot'
            };
        }
        
        const itemData = this.gameConfig.items[bankItem.itemId];
        if (!itemData) {
            return {
                success: false,
                message: 'Invalid item'
            };
        }
        
        // Determine quantity to withdraw
        const availableQty = bankItem.quantity || 1;
        const withdrawQty = quantity === 0 ? availableQty : Math.min(quantity, availableQty);
        
        // Check inventory space
        const inventorySystem = this.gameEngine.inventorySystem;
        if (!inventorySystem) {
            return {
                success: false,
                message: 'Inventory system not available'
            };
        }
        
        const addResult = inventorySystem.addItem(player, bankItem.itemId, withdrawQty);
        
        if (!addResult.success || addResult.remaining > 0) {
            return {
                success: false,
                message: 'Not enough inventory space'
            };
        }
        
        // Remove from bank
        bankItem.quantity -= withdrawQty;
        
        if (bankItem.quantity <= 0) {
            // Remove item from bank entirely
            const itemIndex = tab.items.indexOf(bankItem);
            tab.items.splice(itemIndex, 1);
        }
        
        console.log(`💰 Withdrew ${withdrawQty}x ${itemData.name}`);
        
        this.gameEngine.emit('bank:withdrawn', {
            itemId: bankItem.itemId,
            itemName: itemData.name,
            quantity: withdrawQty,
            tab: tabIndex
        });
        
        return {
            success: true,
            message: `Withdrew ${withdrawQty}x ${itemData.name}`,
            quantity: withdrawQty
        };
    }
    
    /**
     * Deposit all items of a type from inventory
     * @param {object} player - Player entity
     * @param {string} itemId - Item ID to deposit all of
     * @returns {object} Result with success status
     */
    depositAll(player, itemId) {
        let totalDeposited = 0;
        
        // Find all matching items in inventory
        for (let i = 0; i < player.inventory.length; i++) {
            const invItem = player.inventory[i];
            if (invItem && (invItem.id === itemId || invItem.itemId === itemId)) {
                const result = this.depositItem(player, i, 0);
                if (result.success) {
                    totalDeposited += result.quantity;
                }
            }
        }
        
        if (totalDeposited > 0) {
            const itemData = this.gameConfig.items[itemId];
            return {
                success: true,
                message: `Deposited ${totalDeposited}x ${itemData?.name || itemId}`,
                quantity: totalDeposited
            };
        }
        
        return {
            success: false,
            message: 'No items deposited'
        };
    }
    
    /**
     * Find item in bank across all tabs
     * @param {string} itemId - Item ID
     * @returns {object|null} Bank item or null
     */
    findItemInBank(itemId) {
        for (const tab of this.tabs) {
            for (const item of tab.items) {
                if (item.itemId === itemId) {
                    return item;
                }
            }
        }
        return null;
    }
    
    /**
     * Find empty slot in tab
     * @param {number} tabIndex - Tab index
     * @returns {number} Slot index or -1 if full
     */
    findEmptySlot(tabIndex) {
        const tab = this.tabs[tabIndex];
        if (!tab) return -1;
        
        // Find first unused slot number
        const usedSlots = new Set(tab.items.map(item => item.slot));
        
        for (let slot = 0; slot < this.slotsPerTab; slot++) {
            if (!usedSlots.has(slot)) {
                return slot;
            }
        }
        
        return -1; // Tab is full
    }
    
    /**
     * Switch to a different tab
     * @param {number} tabIndex - Tab index
     * @returns {object} Result with success status
     */
    switchTab(tabIndex) {
        if (tabIndex < 0 || tabIndex >= this.maxTabs) {
            return {
                success: false,
                message: 'Invalid tab'
            };
        }
        
        this.currentTab = tabIndex;
        
        this.gameEngine.emit('bank:tabChanged', {
            tabIndex,
            tab: this.tabs[tabIndex]
        });
        
        return {
            success: true,
            tab: this.tabs[tabIndex]
        };
    }
    
    /**
     * Rename a tab
     * @param {number} tabIndex - Tab index
     * @param {string} newName - New tab name
     * @returns {object} Result with success status
     */
    renameTab(tabIndex, newName) {
        const tab = this.tabs[tabIndex];
        if (!tab) {
            return {
                success: false,
                message: 'Invalid tab'
            };
        }
        
        tab.name = newName.substring(0, 20); // Limit length
        
        return {
            success: true,
            message: 'Tab renamed'
        };
    }
    
    /**
     * Get all items in current tab
     * @returns {array} Array of bank items
     */
    getCurrentTabItems() {
        return this.tabs[this.currentTab].items;
    }
    
    /**
     * Get all items across all tabs
     * @returns {array} Array of all bank items
     */
    getAllItems() {
        const allItems = [];
        for (const tab of this.tabs) {
            allItems.push(...tab.items);
        }
        return allItems;
    }
    
    /**
     * Search items in bank
     * @param {string} query - Search query
     * @returns {array} Matching items
     */
    searchItems(query) {
        this.searchQuery = query.toLowerCase();
        
        if (!query) {
            return this.getCurrentTabItems();
        }
        
        const results = [];
        for (const tab of this.tabs) {
            for (const item of tab.items) {
                const itemData = this.gameConfig.items[item.itemId];
                if (itemData && itemData.name.toLowerCase().includes(this.searchQuery)) {
                    results.push({
                        ...item,
                        tabIndex: tab.id
                    });
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get total items in bank
     * @returns {number} Total item count
     */
    getTotalItems() {
        let total = 0;
        for (const tab of this.tabs) {
            total += tab.items.length;
        }
        return total;
    }
    
    /**
     * Get total value of items in bank
     * @returns {number} Total value in coins
     */
    getTotalValue() {
        let totalValue = 0;
        
        for (const tab of this.tabs) {
            for (const item of tab.items) {
                const itemData = this.gameConfig.items[item.itemId];
                if (itemData && itemData.value) {
                    totalValue += itemData.value * item.quantity;
                }
            }
        }
        
        return totalValue;
    }
    
    /**
     * Serialize bank data for saving
     * @returns {object} Serialized bank data
     */
    serialize() {
        const data = {
            currentTab: this.currentTab,
            tabs: []
        };
        
        for (const tab of this.tabs) {
            data.tabs.push({
                id: tab.id,
                name: tab.name,
                icon: tab.icon,
                items: tab.items.map(item => ({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    slot: item.slot
                }))
            });
        }
        
        return data;
    }
    
    /**
     * Deserialize and restore bank data
     * @param {object} data - Serialized bank data
     */
    deserialize(data) {
        if (!data || !data.tabs) return;
        
        // Restore current tab
        this.currentTab = data.currentTab || 0;
        
        // Restore tabs
        for (let i = 0; i < data.tabs.length && i < this.maxTabs; i++) {
            const savedTab = data.tabs[i];
            const tab = this.tabs[i];
            
            tab.name = savedTab.name;
            tab.icon = savedTab.icon;
            tab.items = [];
            
            // Restore items
            for (const savedItem of savedTab.items) {
                const itemData = this.gameConfig?.items?.[savedItem.itemId];
                if (itemData) {
                    tab.items.push({
                        itemId: savedItem.itemId,
                        quantity: savedItem.quantity,
                        slot: savedItem.slot,
                        data: itemData
                    });
                }
            }
        }
        
        console.log('Bank data restored from save');
    }
    
    /**
     * Clear all items from bank (for testing/reset)
     */
    clearBank() {
        for (const tab of this.tabs) {
            tab.items = [];
        }
        
        console.log('Bank cleared');
    }
    
    /**
     * Update banking system (called every frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Banking system doesn't need per-frame updates
        // All changes are event-driven
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BankingSystem;
}
