/**
 * ShopSystem.js - Shop Management System
 * 
 * Manages all shops in the game including:
 * - Shop inventory and stock management
 * - Buy/sell transactions with players
 * - Dynamic pricing based on supply/demand
 * - Shop NPC interactions
 * - Integration with InventorySystem and NPCSystem
 * 
 * @class ShopSystem
 */

class ShopSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null;
        
        // Shop state tracking
        this.shops = new Map(); // shopId -> shop state
        this.activeShop = null; // Currently open shop
        this.activeShopNPC = null; // NPC associated with active shop
        
        // Transaction history (for dynamic pricing)
        this.transactionHistory = new Map(); // shopId -> array of transactions
        
        // Price multipliers
        this.buyPriceMultiplier = 1.0; // Players buy at base price
        this.sellPriceMultiplier = 0.6; // Players sell at 60% of base price
        
        console.log('ShopSystem initialized');
    }
    
    /**
     * Initialize shop system with game config
     * @param {object} gameConfig - Game configuration
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        
        // Initialize all shops from config
        if (gameConfig.shops) {
            for (const [shopId, shopConfig] of Object.entries(gameConfig.shops)) {
                this.initializeShop(shopId, shopConfig);
            }
        }
        
        console.log('ShopSystem ready with', this.shops.size, 'shops');
    }
    
    /**
     * Initialize a shop with its inventory
     * @param {string} shopId - Shop identifier
     * @param {object} shopConfig - Shop configuration from game-config
     */
    initializeShop(shopId, shopConfig) {
        const shop = {
            id: shopId,
            name: shopConfig.name,
            items: [],
            originalStock: new Map() // Track original stock levels
        };
        
        // Initialize shop inventory from config
        if (shopConfig.items) {
            shopConfig.items.forEach(itemConfig => {
                const itemData = this.gameConfig.items[itemConfig.item];
                
                if (!itemData) {
                    console.warn(`Item '${itemConfig.item}' not found in config for shop '${shopId}'`);
                    return;
                }
                
                const shopItem = {
                    itemId: itemConfig.item,
                    itemData: itemData,
                    stock: itemConfig.stock,
                    basePrice: itemConfig.price,
                    currentPrice: itemConfig.price
                };
                
                shop.items.push(shopItem);
                shop.originalStock.set(itemConfig.item, itemConfig.stock);
            });
        }
        
        this.shops.set(shopId, shop);
    }
    
    /**
     * Open a shop for a player
     * @param {string} shopId - Shop identifier
     * @param {object} npc - NPC who owns the shop
     * @returns {object} Shop data or error
     */
    openShop(shopId, npc = null) {
        const shop = this.shops.get(shopId);
        
        if (!shop) {
            return {
                success: false,
                message: `Shop '${shopId}' not found`
            };
        }
        
        this.activeShop = shop;
        this.activeShopNPC = npc;
        
        // Emit shop opened event
        this.gameEngine.emit('shopOpened', {
            shop: shop,
            npc: npc
        });
        
        return {
            success: true,
            shop: shop
        };
    }
    
    /**
     * Close the currently open shop
     */
    closeShop() {
        if (this.activeShop) {
            this.gameEngine.emit('shopClosed', {
                shop: this.activeShop
            });
            
            this.activeShop = null;
            this.activeShopNPC = null;
        }
    }
    
    /**
     * Buy an item from the shop
     * @param {object} player - Player object
     * @param {string} itemId - Item to buy
     * @param {number} quantity - Quantity to buy
     * @returns {object} Transaction result
     */
    buyItem(player, itemId, quantity = 1) {
        if (!this.activeShop) {
            return {
                success: false,
                message: 'No shop is currently open'
            };
        }
        
        // Find item in shop
        const shopItem = this.activeShop.items.find(item => item.itemId === itemId);
        
        if (!shopItem) {
            return {
                success: false,
                message: 'Item not available in this shop'
            };
        }
        
        // Check stock
        if (shopItem.stock < quantity) {
            return {
                success: false,
                message: `Not enough stock. Available: ${shopItem.stock}`
            };
        }
        
        // Calculate total cost
        const totalCost = shopItem.currentPrice * quantity;
        
        // Check if player has enough coins
        const playerCoins = this.getPlayerCoins(player);
        if (playerCoins < totalCost) {
            return {
                success: false,
                message: `Not enough coins. Need ${totalCost}, have ${playerCoins}`
            };
        }
        
        // Check inventory space
        const hasSpace = this.gameEngine.inventorySystem.hasSpace(player, quantity);
        if (!hasSpace) {
            return {
                success: false,
                message: 'Not enough inventory space'
            };
        }
        
        // Execute transaction
        // 1. Remove coins from player
        this.removePlayerCoins(player, totalCost);
        
        // 2. Add item to player inventory
        const itemAdded = this.gameEngine.inventorySystem.addItem(
            player,
            shopItem.itemData,
            quantity
        );
        
        if (!itemAdded) {
            // Refund coins if item couldn't be added
            this.addPlayerCoins(player, totalCost);
            return {
                success: false,
                message: 'Failed to add item to inventory'
            };
        }
        
        // 3. Decrease shop stock
        shopItem.stock -= quantity;
        
        // 4. Record transaction
        this.recordTransaction(this.activeShop.id, 'buy', itemId, quantity, totalCost);
        
        // 5. Emit event
        this.gameEngine.emit('itemBought', {
            shop: this.activeShop,
            itemId: itemId,
            quantity: quantity,
            totalCost: totalCost,
            player: player
        });
        
        return {
            success: true,
            message: `Bought ${quantity}x ${shopItem.itemData.name} for ${totalCost} coins`,
            itemId: itemId,
            quantity: quantity,
            totalCost: totalCost,
            remainingStock: shopItem.stock
        };
    }
    
    /**
     * Sell an item to the shop
     * @param {object} player - Player object
     * @param {number} slotIndex - Inventory slot index
     * @param {number} quantity - Quantity to sell
     * @returns {object} Transaction result
     */
    sellItem(player, slotIndex, quantity = 1) {
        if (!this.activeShop) {
            return {
                success: false,
                message: 'No shop is currently open'
            };
        }
        
        // Get item from player inventory
        const inventoryItem = player.inventory[slotIndex];
        
        if (!inventoryItem) {
            return {
                success: false,
                message: 'No item in that slot'
            };
        }
        
        if (inventoryItem.quantity < quantity) {
            return {
                success: false,
                message: `Not enough items. Have ${inventoryItem.quantity}, trying to sell ${quantity}`
            };
        }
        
        // Get item data
        const itemData = this.gameConfig.items[inventoryItem.itemId];
        
        if (!itemData || !itemData.value) {
            return {
                success: false,
                message: 'This item cannot be sold'
            };
        }
        
        // Calculate sell price (60% of base value)
        const sellPrice = Math.floor(itemData.value * this.sellPriceMultiplier);
        const totalValue = sellPrice * quantity;
        
        // Execute transaction
        // 1. Remove item from player inventory
        const removed = this.gameEngine.inventorySystem.removeItem(
            player,
            slotIndex,
            quantity
        );
        
        if (!removed) {
            return {
                success: false,
                message: 'Failed to remove item from inventory'
            };
        }
        
        // 2. Add coins to player
        this.addPlayerCoins(player, totalValue);
        
        // 3. Increase shop stock if this item is sold by the shop
        const shopItem = this.activeShop.items.find(item => item.itemId === inventoryItem.itemId);
        if (shopItem) {
            shopItem.stock += quantity;
        }
        
        // 4. Record transaction
        this.recordTransaction(this.activeShop.id, 'sell', inventoryItem.itemId, quantity, totalValue);
        
        // 5. Emit event
        this.gameEngine.emit('itemSold', {
            shop: this.activeShop,
            itemId: inventoryItem.itemId,
            quantity: quantity,
            totalValue: totalValue,
            player: player
        });
        
        return {
            success: true,
            message: `Sold ${quantity}x ${itemData.name} for ${totalValue} coins`,
            itemId: inventoryItem.itemId,
            quantity: quantity,
            totalValue: totalValue
        };
    }
    
    /**
     * Get player's coin count
     * @param {object} player - Player object
     * @returns {number} Number of coins
     */
    getPlayerCoins(player) {
        // Look for coins in inventory
        let totalCoins = 0;
        
        for (const item of player.inventory) {
            if (item && item.itemId === 'coins') {
                totalCoins += item.quantity;
            }
        }
        
        return totalCoins;
    }
    
    /**
     * Add coins to player inventory
     * @param {object} player - Player object
     * @param {number} amount - Amount to add
     * @returns {boolean} Success
     */
    addPlayerCoins(player, amount) {
        const coinsData = this.gameConfig.items['coins'];
        return this.gameEngine.inventorySystem.addItem(player, coinsData, amount);
    }
    
    /**
     * Remove coins from player inventory
     * @param {object} player - Player object
     * @param {number} amount - Amount to remove
     * @returns {boolean} Success
     */
    removePlayerCoins(player, amount) {
        // Find coins in inventory and remove
        let remaining = amount;
        
        for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
            const item = player.inventory[i];
            
            if (item && item.itemId === 'coins') {
                const toRemove = Math.min(item.quantity, remaining);
                this.gameEngine.inventorySystem.removeItem(player, i, toRemove);
                remaining -= toRemove;
            }
        }
        
        return remaining === 0;
    }
    
    /**
     * Record a transaction for analytics/dynamic pricing
     * @param {string} shopId - Shop identifier
     * @param {string} type - 'buy' or 'sell'
     * @param {string} itemId - Item involved
     * @param {number} quantity - Quantity transacted
     * @param {number} value - Total transaction value
     */
    recordTransaction(shopId, type, itemId, quantity, value) {
        if (!this.transactionHistory.has(shopId)) {
            this.transactionHistory.set(shopId, []);
        }
        
        this.transactionHistory.get(shopId).push({
            type: type,
            itemId: itemId,
            quantity: quantity,
            value: value,
            timestamp: Date.now()
        });
    }
    
    /**
     * Restock shop items (called periodically)
     * @param {string} shopId - Shop to restock
     */
    restockShop(shopId) {
        const shop = this.shops.get(shopId);
        
        if (!shop) return;
        
        // Restore stock to original levels
        shop.items.forEach(item => {
            const originalStock = shop.originalStock.get(item.itemId);
            if (originalStock !== undefined) {
                item.stock = originalStock;
            }
        });
        
        this.gameEngine.emit('shopRestocked', {
            shopId: shopId,
            shop: shop
        });
    }
    
    /**
     * Restock all shops
     */
    restockAllShops() {
        for (const shopId of this.shops.keys()) {
            this.restockShop(shopId);
        }
    }
    
    /**
     * Get shop by ID
     * @param {string} shopId - Shop identifier
     * @returns {object} Shop data
     */
    getShop(shopId) {
        return this.shops.get(shopId);
    }
    
    /**
     * Serialize shop system state for saving
     * @returns {object} Serialized state
     */
    serialize() {
        const shopStates = {};
        
        for (const [shopId, shop] of this.shops.entries()) {
            shopStates[shopId] = {
                items: shop.items.map(item => ({
                    itemId: item.itemId,
                    stock: item.stock,
                    currentPrice: item.currentPrice
                }))
            };
        }
        
        return {
            shops: shopStates,
            transactions: Array.from(this.transactionHistory.entries())
        };
    }
    
    /**
     * Deserialize and restore shop system state
     * @param {object} data - Serialized state
     */
    deserialize(data) {
        if (!data) return;
        
        // Restore shop states
        if (data.shops) {
            for (const [shopId, shopState] of Object.entries(data.shops)) {
                const shop = this.shops.get(shopId);
                
                if (shop && shopState.items) {
                    shopState.items.forEach(savedItem => {
                        const shopItem = shop.items.find(item => item.itemId === savedItem.itemId);
                        if (shopItem) {
                            shopItem.stock = savedItem.stock;
                            shopItem.currentPrice = savedItem.currentPrice;
                        }
                    });
                }
            }
        }
        
        // Restore transaction history
        if (data.transactions) {
            this.transactionHistory = new Map(data.transactions);
        }
    }
}
