/**
 * EquipmentPanel.js - Equipment Interface UI
 * 
 * Visual equipment panel showing the 11 equipment slots in RuneScape style.
 * Displays equipped items, stats, and allows drag-and-drop equipping.
 * 
 * @class EquipmentPanel
 */

class EquipmentPanel {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.equipmentSystem = null;
        this.player = null;
        
        // UI state
        this.visible = false;
        this.panel = null;
        
        // Panel dimensions and position
        this.panelX = 550;
        this.panelY = 50;
        this.panelWidth = 250;
        this.panelHeight = 450;
        
        // Equipment slot positions (relative to panel)
        this.slotPositions = {
            head: { x: 95, y: 40, size: 40 },
            cape: { x: 30, y: 40, size: 40 },
            amulet: { x: 160, y: 40, size: 40 },
            
            weapon: { x: 30, y: 95, size: 40 },
            body: { x: 95, y: 95, size: 40 },
            shield: { x: 160, y: 95, size: 40 },
            
            legs: { x: 95, y: 150, size: 40 },
            
            gloves: { x: 30, y: 205, size: 40 },
            boots: { x: 95, y: 205, size: 40 },
            ring: { x: 160, y: 205, size: 40 },
            
            ammo: { x: 95, y: 260, size: 40 }
        };
        
        // Stat display position
        this.statsX = 10;
        this.statsY = 315;
        
        // Selected slot for highlighting
        this.selectedSlot = null;
        this.hoverSlot = null;
        
        console.log('EquipmentPanel initialized');
    }
    
    /**
     * Initialize the equipment panel
     * @param {EquipmentSystem} equipmentSystem - Equipment system reference
     * @param {Player} player - Player entity
     */
    init(equipmentSystem, player) {
        this.equipmentSystem = equipmentSystem;
        this.player = player;
        
        // Listen to equipment change events
        this.gameEngine.on('equipment_changed', (data) => this.onEquipmentChanged(data));
        
        console.log('EquipmentPanel ready');
    }
    
    /**
     * Toggle panel visibility
     */
    toggle() {
        this.visible = !this.visible;
        console.log(`Equipment panel ${this.visible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * Show the equipment panel
     */
    show() {
        this.visible = true;
    }
    
    /**
     * Hide the equipment panel
     */
    hide() {
        this.visible = false;
    }
    
    /**
     * Handle equipment change event
     * @param {object} data - Event data
     */
    onEquipmentChanged(data) {
        // Panel will automatically update on next render
        console.log('Equipment changed:', data.action, data.slot);
    }
    
    /**
     * Handle mouse click on panel
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    handleClick(mouseX, mouseY) {
        if (!this.visible) return;
        
        // Check if click is within panel bounds
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            return;
        }
        
        // Check which slot was clicked
        const clickedSlot = this.getSlotAtPosition(mouseX, mouseY);
        
        if (clickedSlot) {
            this.selectedSlot = clickedSlot;
            this.onSlotClicked(clickedSlot);
        }
    }
    
    /**
     * Handle mouse hover over panel
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    handleHover(mouseX, mouseY) {
        if (!this.visible) {
            this.hoverSlot = null;
            return;
        }
        
        // Check if hover is within panel bounds
        if (mouseX < this.panelX || mouseX > this.panelX + this.panelWidth ||
            mouseY < this.panelY || mouseY > this.panelY + this.panelHeight) {
            this.hoverSlot = null;
            return;
        }
        
        // Check which slot is being hovered
        this.hoverSlot = this.getSlotAtPosition(mouseX, mouseY);
    }
    
    /**
     * Get equipment slot at mouse position
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     * @returns {string|null} Slot name or null
     */
    getSlotAtPosition(mouseX, mouseY) {
        const relX = mouseX - this.panelX;
        const relY = mouseY - this.panelY;
        
        for (const [slotName, pos] of Object.entries(this.slotPositions)) {
            const slotLeft = pos.x;
            const slotTop = pos.y;
            const slotRight = pos.x + pos.size;
            const slotBottom = pos.y + pos.size;
            
            if (relX >= slotLeft && relX <= slotRight &&
                relY >= slotTop && relY <= slotBottom) {
                return slotName;
            }
        }
        
        return null;
    }
    
    /**
     * Handle slot click (unequip item)
     * @param {string} slotName - Slot name
     */
    onSlotClicked(slotName) {
        if (!this.equipmentSystem) return;
        
        const equipped = this.equipmentSystem.getEquipped(slotName);
        
        if (equipped) {
            // Unequip the item
            const result = this.equipmentSystem.unequipItem(this.player, slotName);
            
            if (result.success) {
                console.log(`Unequipped from ${slotName}`);
                
                if (this.gameEngine.uiManager) {
                    this.gameEngine.uiManager.showNotification(result.message, 'info');
                }
            } else {
                console.log(`Failed to unequip: ${result.message}`);
                
                if (this.gameEngine.uiManager) {
                    this.gameEngine.uiManager.showNotification(result.message, 'error');
                }
            }
        }
    }
    
    /**
     * Render the equipment panel
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.visible || !this.equipmentSystem) return;
        
        ctx.save();
        
        // Draw panel background
        this.drawPanelBackground(ctx);
        
        // Draw equipment slots
        this.drawEquipmentSlots(ctx);
        
        // Draw stats
        this.drawStats(ctx);
        
        // Draw tooltip if hovering over slot
        if (this.hoverSlot) {
            this.drawTooltip(ctx, this.hoverSlot);
        }
        
        ctx.restore();
    }
    
    /**
     * Draw panel background
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawPanelBackground(ctx) {
        // Main panel background
        ctx.fillStyle = 'rgba(61, 39, 26, 0.95)';
        ctx.fillRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight);
        
        // Inner border
        ctx.strokeStyle = '#3d271a';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.panelX + 5, this.panelY + 5, this.panelWidth - 10, this.panelHeight - 10);
        
        // Title bar
        ctx.fillStyle = '#5C4A38';
        ctx.fillRect(this.panelX, this.panelY, this.panelWidth, 30);
        
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.panelX, this.panelY, this.panelWidth, 30);
        
        // Title text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Equipment', this.panelX + this.panelWidth / 2, this.panelY + 15);
        
        // Close button
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(this.panelX + this.panelWidth - 25, this.panelY + 5, 20, 20);
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.panelX + this.panelWidth - 25, this.panelY + 5, 20, 20);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('✕', this.panelX + this.panelWidth - 15, this.panelY + 15);
    }
    
    /**
     * Draw all equipment slots
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawEquipmentSlots(ctx) {
        for (const [slotName, pos] of Object.entries(this.slotPositions)) {
            this.drawSlot(ctx, slotName, pos);
        }
    }
    
    /**
     * Draw a single equipment slot
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} slotName - Slot name
     * @param {object} pos - Slot position {x, y, size}
     */
    drawSlot(ctx, slotName, pos) {
        const x = this.panelX + pos.x;
        const y = this.panelY + pos.y;
        const size = pos.size;
        
        const equipped = this.equipmentSystem.getEquipped(slotName);
        const isHovered = this.hoverSlot === slotName;
        const isSelected = this.selectedSlot === slotName;
        
        // Slot background
        if (equipped) {
            ctx.fillStyle = '#4A3829';
        } else {
            ctx.fillStyle = '#2A1F1A';
        }
        
        ctx.fillRect(x, y, size, size);
        
        // Slot border
        if (isHovered) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
        } else if (isSelected) {
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#5C4A38';
            ctx.lineWidth = 1;
        }
        ctx.strokeRect(x, y, size, size);
        
        // Draw equipped item or slot icon
        if (equipped && equipped.data) {
            // Draw item icon
            ctx.fillStyle = '#FFD700';
            ctx.font = `${size - 10}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(equipped.data.icon || '?', x + size / 2, y + size / 2);
        } else {
            // Draw slot type icon
            const slotIcon = this.getSlotIcon(slotName);
            ctx.fillStyle = '#666666';
            ctx.font = `${size - 15}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slotIcon, x + size / 2, y + size / 2);
        }
        
        // Slot label (small text below slot)
        ctx.fillStyle = '#999999';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.getSlotLabel(slotName), x + size / 2, y + size + 12);
    }
    
    /**
     * Get icon for empty slot
     * @param {string} slotName - Slot name
     * @returns {string} Icon character
     */
    getSlotIcon(slotName) {
        const icons = {
            head: '⛑️',
            cape: '🧥',
            amulet: '📿',
            weapon: '🗡️',
            body: '🦺',
            shield: '🛡️',
            legs: '👖',
            gloves: '🧤',
            boots: '👢',
            ring: '💍',
            ammo: '🏹'
        };
        return icons[slotName] || '?';
    }
    
    /**
     * Get label for slot
     * @param {string} slotName - Slot name
     * @returns {string} Label text
     */
    getSlotLabel(slotName) {
        const labels = {
            head: 'Head',
            cape: 'Cape',
            amulet: 'Neck',
            weapon: 'Weapon',
            body: 'Body',
            shield: 'Shield',
            legs: 'Legs',
            gloves: 'Gloves',
            boots: 'Boots',
            ring: 'Ring',
            ammo: 'Ammo'
        };
        return labels[slotName] || slotName;
    }
    
    /**
     * Draw equipment stats
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    drawStats(ctx) {
        const bonuses = this.equipmentSystem.bonuses;
        const x = this.panelX + this.statsX;
        let y = this.panelY + this.statsY;
        
        // Stats title
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Combat Stats:', x, y);
        y += 18;
        
        // Attack bonuses
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '11px Arial';
        
        const stats = [
            { label: 'Attack (Slash)', value: bonuses.attackSlash },
            { label: 'Strength', value: bonuses.meleeStrength },
            { label: 'Defence (Slash)', value: bonuses.defenceSlash },
            { label: 'Ranged', value: bonuses.attackRanged },
            { label: 'Magic', value: bonuses.attackMagic },
            { label: 'Prayer', value: bonuses.prayer }
        ];
        
        for (const stat of stats) {
            const color = stat.value > 0 ? '#4CAF50' : stat.value < 0 ? '#F44336' : '#888888';
            ctx.fillStyle = '#CCCCCC';
            ctx.fillText(stat.label + ':', x, y);
            
            ctx.fillStyle = color;
            ctx.textAlign = 'right';
            ctx.fillText(stat.value > 0 ? `+${stat.value}` : `${stat.value}`, x + 220, y);
            ctx.textAlign = 'left';
            
            y += 14;
        }
    }
    
    /**
     * Draw tooltip for hovered slot
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} slotName - Slot name
     */
    drawTooltip(ctx, slotName) {
        const equipped = this.equipmentSystem.getEquipped(slotName);
        
        if (!equipped || !equipped.data) return;
        
        const item = equipped.data;
        const pos = this.slotPositions[slotName];
        
        // Tooltip position (to the right of the slot)
        let tooltipX = this.panelX + pos.x + pos.size + 10;
        let tooltipY = this.panelY + pos.y;
        
        // Build tooltip text
        const lines = [
            item.name,
            `Tier ${item.tier || 1}`,
            ''
        ];
        
        if (item.attackBonus) lines.push(`Attack: +${item.attackBonus}`);
        if (item.strengthBonus) lines.push(`Strength: +${item.strengthBonus}`);
        if (item.defenceBonus) lines.push(`Defence: +${item.defenceBonus}`);
        if (item.requirements) {
            lines.push('');
            lines.push('Requirements:');
            for (const [skill, level] of Object.entries(item.requirements)) {
                lines.push(`  ${skill}: ${level}`);
            }
        }
        
        // Measure tooltip size
        ctx.font = '11px Arial';
        let maxWidth = 0;
        for (const line of lines) {
            const width = ctx.measureText(line).width;
            if (width > maxWidth) maxWidth = width;
        }
        
        const padding = 8;
        const lineHeight = 14;
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;
        
        // Adjust position if tooltip would go off screen
        if (tooltipX + tooltipWidth > ctx.canvas.width) {
            tooltipX = this.panelX + pos.x - tooltipWidth - 10;
        }
        
        // Draw tooltip background
        ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
        ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(lines[0], tooltipX + padding, tooltipY + padding + 11);
        
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '11px Arial';
        
        for (let i = 1; i < lines.length; i++) {
            ctx.fillText(lines[i], tooltipX + padding, tooltipY + padding + (i + 1) * lineHeight);
        }
    }
    
    /**
     * Update panel (called every frame)
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Equipment panel is mostly static, updates are event-driven
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquipmentPanel;
}
