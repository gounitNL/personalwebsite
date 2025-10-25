/**
 * ContextMenu.js - Right-Click Context Menu System
 * 
 * Provides context-sensitive right-click menus for entities, items, and terrain.
 * Displays appropriate actions based on what was clicked.
 * 
 * Features:
 * - Entity-specific actions (attack, follow, examine)
 * - Item actions (use, equip, drop, examine)
 * - Resource actions (mine, chop, fish)
 * - NPC actions (talk, trade, bank)
 * - Dynamic action lists based on context
 * 
 * @class ContextMenu
 */

class ContextMenu {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.menuElement = null;
        this.isVisible = false;
        this.currentTarget = null;
        this.currentActions = [];
        
        this.init();
        
        console.log('ContextMenu initialized');
    }
    
    /**
     * Initialize context menu
     */
    init() {
        // Create menu element
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'contextMenu';
        this.menuElement.className = 'context-menu hidden';
        document.body.appendChild(this.menuElement);
        
        // Add global right-click handler
        document.addEventListener('contextmenu', (e) => {
            // Allow default context menu for input elements
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            e.preventDefault();
            this.handleRightClick(e);
        });
        
        // Hide menu on any left click
        document.addEventListener('click', () => {
            this.hide();
        });
        
        // Hide menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
    
    /**
     * Handle right-click event
     * @param {MouseEvent} event - Mouse event
     */
    handleRightClick(event) {
        // Check if click was on game canvas
        const canvas = this.gameEngine.canvas;
        if (!canvas || event.target !== canvas) {
            this.hide();
            return;
        }
        
        // Get world coordinates from mouse position
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Convert to world coordinates
        const worldPos = this.gameEngine.inputHandler.screenToWorld(mouseX, mouseY, this.gameEngine.camera);
        
        // Find what was clicked
        const target = this.findTargetAtPosition(worldPos.x, worldPos.y);
        
        if (target) {
            // Generate actions for target
            const actions = this.getActionsForTarget(target);
            
            if (actions.length > 0) {
                this.show(event.clientX, event.clientY, target, actions);
            }
        } else {
            this.hide();
        }
    }
    
    /**
     * Find entity or object at world position
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {object|null} Target object or null
     */
    findTargetAtPosition(worldX, worldY) {
        const clickRadius = 1; // Click tolerance in world units
        
        // Check player
        if (this.gameEngine.player) {
            const player = this.gameEngine.player;
            const dx = player.x - worldX;
            const dy = player.y - worldY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < clickRadius) {
                return { type: 'player', entity: player };
            }
        }
        
        // Check entities (enemies, resources)
        if (this.gameEngine.spatialGrid) {
            // Use spatial grid for efficient nearby search
            const nearbyEntities = this.gameEngine.spatialGrid.getEntitiesInRadius(worldX, worldY, clickRadius * 2);
            
            for (const entity of nearbyEntities) {
                const dx = entity.x - worldX;
                const dy = entity.y - worldY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < clickRadius) {
                    return { 
                        type: entity.type || 'entity', 
                        entity: entity 
                    };
                }
            }
        } else {
            // Fallback: check all entities
            for (const entity of this.gameEngine.entities) {
                const dx = entity.x - worldX;
                const dy = entity.y - worldY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < clickRadius) {
                    return { 
                        type: entity.type || 'entity', 
                        entity: entity 
                    };
                }
            }
        }
        
        // Check NPCs
        if (this.gameEngine.npcSystem && this.gameEngine.worldSystem) {
            const npcs = this.gameEngine.npcSystem.getNPCsInArea(this.gameEngine.worldSystem.currentAreaId);
            
            for (const npc of npcs) {
                const dx = npc.x - worldX;
                const dy = npc.y - worldY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < clickRadius) {
                    return { type: 'npc', entity: npc };
                }
            }
        }
        
        // Check ground items (if system exists)
        // TODO: Implement ground items system
        
        return null;
    }
    
    /**
     * Get available actions for a target
     * @param {object} target - Target object
     * @returns {Array} Array of action objects
     */
    getActionsForTarget(target) {
        const actions = [];
        
        switch (target.type) {
            case 'player':
                actions.push(
                    { label: 'Skills', callback: () => this.openSkills() },
                    { label: 'Inventory', callback: () => this.openInventory() },
                    { label: 'Equipment', callback: () => this.openEquipment() },
                    { label: 'Quests', callback: () => this.openQuests() }
                );
                break;
                
            case 'enemy':
                const enemy = target.entity;
                actions.push(
                    { label: `Attack ${enemy.name}`, callback: () => this.attackEnemy(enemy), primary: true },
                    { label: 'Examine', callback: () => this.examineEntity(enemy) }
                );
                break;
                
            case 'resource':
                const resource = target.entity;
                const action = this.getResourceActionName(resource);
                actions.push(
                    { label: `${action} ${resource.name}`, callback: () => this.harvestResource(resource), primary: true },
                    { label: 'Examine', callback: () => this.examineEntity(resource) }
                );
                break;
                
            case 'npc':
                const npc = target.entity;
                actions.push(
                    { label: 'Talk-to', callback: () => this.talkToNPC(npc), primary: true }
                );
                
                if (npc.hasBank) {
                    actions.push({ label: 'Bank', callback: () => this.openNPCBank(npc) });
                }
                
                if (npc.hasShop) {
                    actions.push({ label: 'Trade', callback: () => this.openNPCShop(npc) });
                }
                
                actions.push({ label: 'Examine', callback: () => this.examineEntity(npc) });
                break;
        }
        
        return actions;
    }
    
    /**
     * Get appropriate action name for resource type
     * @param {object} resource - Resource entity
     * @returns {string} Action name
     */
    getResourceActionName(resource) {
        if (resource.skillRequired === 'mining') return 'Mine';
        if (resource.skillRequired === 'woodcutting') return 'Chop';
        if (resource.skillRequired === 'fishing') return 'Fish';
        return 'Gather';
    }
    
    /**
     * Show context menu
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {object} target - Target object
     * @param {Array} actions - Available actions
     */
    show(x, y, target, actions) {
        this.currentTarget = target;
        this.currentActions = actions;
        
        // Clear menu
        this.menuElement.innerHTML = '';
        
        // Add actions
        for (const action of actions) {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            
            if (action.primary) {
                item.classList.add('primary');
            }
            
            item.textContent = action.label;
            item.addEventListener('click', () => {
                action.callback();
                this.hide();
            });
            
            this.menuElement.appendChild(item);
        }
        
        // Position menu
        this.menuElement.style.left = x + 'px';
        this.menuElement.style.top = y + 'px';
        
        // Show menu
        this.menuElement.classList.remove('hidden');
        this.isVisible = true;
        
        // Adjust if menu goes off screen
        this.adjustPosition();
    }
    
    /**
     * Hide context menu
     */
    hide() {
        if (this.isVisible) {
            this.menuElement.classList.add('hidden');
            this.isVisible = false;
            this.currentTarget = null;
            this.currentActions = [];
        }
    }
    
    /**
     * Adjust menu position to stay on screen
     */
    adjustPosition() {
        const rect = this.menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust horizontal position
        if (rect.right > viewportWidth) {
            this.menuElement.style.left = (viewportWidth - rect.width - 5) + 'px';
        }
        
        // Adjust vertical position
        if (rect.bottom > viewportHeight) {
            this.menuElement.style.top = (viewportHeight - rect.height - 5) + 'px';
        }
    }
    
    // ==================== Action Handlers ====================
    
    openSkills() {
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.toggleSkillsPanel();
        }
    }
    
    openInventory() {
        if (window.toggleInventory) {
            window.toggleInventory();
        }
    }
    
    openEquipment() {
        if (window.openEquipment) {
            window.openEquipment();
        }
    }
    
    openQuests() {
        if (window.openQuests) {
            window.openQuests();
        }
    }
    
    attackEnemy(enemy) {
        if (this.gameEngine.combatSystem && this.gameEngine.player) {
            // Set enemy as current target
            this.gameEngine.player.currentEnemy = enemy;
            enemy.currentEnemy = this.gameEngine.player;
            
            // Start combat
            this.gameEngine.combatSystem.startCombat(this.gameEngine.player, enemy);
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification(`Attacking ${enemy.name}!`, 'combat');
            }
        }
    }
    
    harvestResource(resource) {
        if (resource && resource.startHarvest) {
            const result = resource.startHarvest(this.gameEngine.player);
            
            if (result.success && this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification(result.message, 'info');
            } else if (!result.success && this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification(result.message, 'error');
            }
        }
    }
    
    talkToNPC(npc) {
        if (this.gameEngine.npcSystem) {
            this.gameEngine.npcSystem.handleNPCInteraction(npc.id, 'Talk-to');
        }
    }
    
    openNPCBank(npc) {
        if (this.gameEngine.npcSystem) {
            this.gameEngine.npcSystem.handleNPCInteraction(npc.id, 'Bank');
        }
    }
    
    openNPCShop(npc) {
        if (this.gameEngine.npcSystem) {
            this.gameEngine.npcSystem.handleNPCInteraction(npc.id, 'Trade');
        }
    }
    
    examineEntity(entity) {
        let description = entity.description || entity.name || 'An unknown entity.';
        
        if (entity.level) {
            description += ` (Level ${entity.level})`;
        }
        
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.showNotification(description, 'info');
        }
        
        console.log('Examine:', description);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextMenu;
}
