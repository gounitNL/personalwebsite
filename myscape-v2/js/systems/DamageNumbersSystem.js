/**
 * DamageNumbersSystem.js - Floating Damage Numbers and Combat Text
 * Manages floating combat text that appears above entities
 */

class DamageNumbersSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.damageNumbers = []; // Active floating text elements
        this.maxNumbers = 50; // Maximum simultaneous damage numbers
        
        console.log('DamageNumbersSystem initialized');
    }
    
    /**
     * Initialize system
     */
    init() {
        // Listen to combat events
        this.gameEngine.on('combat_hit', (data) => this.onCombatHit(data));
        this.gameEngine.on('combat_miss', (data) => this.onCombatMiss(data));
        this.gameEngine.on('xp_gained', (data) => this.onXPGained(data));
        this.gameEngine.on('entity_death', (data) => this.onEntityDeath(data));
        this.gameEngine.on('heal', (data) => this.onHeal(data));
    }
    
    /**
     * Create a floating damage number
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {string} text - Text to display
     * @param {string} type - Type: 'damage', 'miss', 'xp', 'heal', 'death'
     */
    createDamageNumber(x, y, text, type = 'damage') {
        // Limit active numbers
        if (this.damageNumbers.length >= this.maxNumbers) {
            this.damageNumbers.shift();
        }
        
        const number = {
            x: x,
            y: y,
            worldX: x,
            worldY: y,
            text: text,
            type: type,
            age: 0,
            lifetime: 1.5, // seconds
            velocityX: (Math.random() - 0.5) * 0.3,
            velocityY: -1.5, // Float upward
            alpha: 1.0,
            scale: 1.0
        };
        
        this.damageNumbers.push(number);
    }
    
    /**
     * Handle combat hit event
     */
    onCombatHit(data) {
        const { target, damage, attacker } = data;
        
        if (!target || damage === undefined) return;
        
        // Create damage number at target position
        this.createDamageNumber(
            target.x,
            target.y - 1,
            `-${Math.floor(damage)}`,
            'damage'
        );
    }
    
    /**
     * Handle combat miss event
     */
    onCombatMiss(data) {
        const { target } = data;
        
        if (!target) return;
        
        this.createDamageNumber(
            target.x,
            target.y - 1,
            'MISS',
            'miss'
        );
    }
    
    /**
     * Handle XP gained event
     */
    onXPGained(data) {
        const { entity, xp, skill } = data;
        
        if (!entity || xp === undefined) return;
        
        // Small offset for XP text
        this.createDamageNumber(
            entity.x + 0.5,
            entity.y - 1.5,
            `+${Math.floor(xp)} ${skill}`,
            'xp'
        );
    }
    
    /**
     * Handle entity death event
     */
    onEntityDeath(data) {
        const { entity } = data;
        
        if (!entity) return;
        
        this.createDamageNumber(
            entity.x,
            entity.y - 1,
            'DEFEATED',
            'death'
        );
    }
    
    /**
     * Handle healing event
     */
    onHeal(data) {
        const { entity, amount } = data;
        
        if (!entity || amount === undefined) return;
        
        this.createDamageNumber(
            entity.x,
            entity.y - 1,
            `+${Math.floor(amount)}`,
            'heal'
        );
    }
    
    /**
     * Update all damage numbers
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Update each damage number
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const num = this.damageNumbers[i];
            
            // Update age
            num.age += deltaTime;
            
            // Update position (float upward and sideways)
            num.worldX += num.velocityX * deltaTime;
            num.worldY += num.velocityY * deltaTime;
            
            // Slow down velocity
            num.velocityX *= 0.95;
            num.velocityY *= 0.95;
            
            // Fade out
            const agePercent = num.age / num.lifetime;
            num.alpha = 1.0 - agePercent;
            
            // Scale animation (pop in then shrink slightly)
            if (agePercent < 0.2) {
                num.scale = 0.5 + (agePercent / 0.2) * 0.5; // 0.5 to 1.0
            } else {
                num.scale = 1.0 - (agePercent - 0.2) * 0.1; // Slow shrink
            }
            
            // Remove expired numbers
            if (num.age >= num.lifetime) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }
    
    /**
     * Render damage numbers on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} camera - Camera for world to screen conversion
     * @param {Renderer} renderer - Renderer for coordinate conversion
     */
    render(ctx, camera, renderer) {
        ctx.save();
        
        for (const num of this.damageNumbers) {
            // Convert world position to screen position
            const screen = renderer.worldToScreen(num.worldX, num.worldY, camera);
            
            // Skip if off-screen
            if (screen.x < 0 || screen.x > ctx.canvas.width ||
                screen.y < 0 || screen.y > ctx.canvas.height) {
                continue;
            }
            
            // Set alpha
            ctx.globalAlpha = num.alpha;
            
            // Determine color and font based on type
            let color, outlineColor, fontSize;
            
            switch (num.type) {
                case 'damage':
                    color = '#FF4444';
                    outlineColor = '#8B0000';
                    fontSize = 18 + (num.scale * 4);
                    break;
                case 'miss':
                    color = '#888888';
                    outlineColor = '#444444';
                    fontSize = 14 + (num.scale * 2);
                    break;
                case 'xp':
                    color = '#4CAF50';
                    outlineColor = '#2E7D32';
                    fontSize = 12 + (num.scale * 2);
                    break;
                case 'heal':
                    color = '#00FF00';
                    outlineColor = '#008800';
                    fontSize = 16 + (num.scale * 3);
                    break;
                case 'death':
                    color = '#FFD700';
                    outlineColor = '#8B6914';
                    fontSize = 16 + (num.scale * 3);
                    break;
                default:
                    color = '#FFFFFF';
                    outlineColor = '#000000';
                    fontSize = 16;
            }
            
            // Set font
            ctx.font = `bold ${Math.floor(fontSize)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw text outline
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 4;
            ctx.strokeText(num.text, screen.x, screen.y);
            
            // Draw text fill
            ctx.fillStyle = color;
            ctx.fillText(num.text, screen.x, screen.y);
        }
        
        ctx.restore();
    }
    
    /**
     * Clear all damage numbers
     */
    clear() {
        this.damageNumbers = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DamageNumbersSystem;
}
