/**
 * Renderer.js - Isometric Rendering Engine
 * Handles all visual rendering including isometric coordinate conversion,
 * tile rendering, entity rendering, and visual effects
 */

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Isometric tile dimensions
        this.tileWidth = 64;
        this.tileHeight = 32;
        
        // Rendering layers
        this.layers = {
            GROUND: 0,
            RESOURCES: 1,
            ITEMS: 2,
            ENTITIES: 3,
            EFFECTS: 4,
            UI: 5
        };
        
        // Tile colors for different terrain types
        this.tileColors = {
            grass: '#7CB342',
            dirt: '#8D6E63',
            stone: '#78909C',
            water: '#29B6F6',
            sand: '#FDD835',
            path: '#BCAAA4',
            wall: '#455A64'
        };
        
        // Entity colors (will be replaced with sprites later)
        this.entityColors = {
            player: '#4169E1',
            enemy: '#E53935',
            npc: '#FFB300',
            resource: '#8BC34A'
        };
        
        console.log('🎨 Renderer initialized');
    }

    /**
     * Convert world coordinates to screen coordinates (isometric projection)
     */
    worldToScreen(worldX, worldY, camera) {
        // Isometric projection formula
        const screenX = (worldX - worldY) * (this.tileWidth / 2);
        const screenY = (worldX + worldY) * (this.tileHeight / 2);
        
        // Apply camera offset
        return {
            x: screenX - camera.x + this.canvas.width / 2,
            y: screenY - camera.y + this.canvas.height / 2
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY, camera) {
        // Adjust for camera and center offset
        const adjustedX = screenX - this.canvas.width / 2 + camera.x;
        const adjustedY = screenY - this.canvas.height / 2 + camera.y;
        
        // Inverse isometric projection
        const worldX = (adjustedX / (this.tileWidth / 2) + adjustedY / (this.tileHeight / 2)) / 2;
        const worldY = (adjustedY / (this.tileHeight / 2) - adjustedX / (this.tileWidth / 2)) / 2;
        
        return {
            x: Math.floor(worldX),
            y: Math.floor(worldY)
        };
    }

    /**
     * Check if a position is visible on screen
     */
    isVisible(worldX, worldY, camera) {
        const screen = this.worldToScreen(worldX, worldY, camera);
        const margin = 100; // Extra margin for smooth scrolling
        
        return screen.x >= -margin && 
               screen.x <= this.canvas.width + margin &&
               screen.y >= -margin && 
               screen.y <= this.canvas.height + margin;
    }

    /**
     * Render a single isometric tile
     */
    renderTile(worldX, worldY, tileData, camera) {
        const screen = this.worldToScreen(worldX, worldY, camera);
        
        // Draw diamond-shaped tile
        this.ctx.beginPath();
        this.ctx.moveTo(screen.x, screen.y); // Top
        this.ctx.lineTo(screen.x + this.tileWidth / 2, screen.y + this.tileHeight / 2); // Right
        this.ctx.lineTo(screen.x, screen.y + this.tileHeight); // Bottom
        this.ctx.lineTo(screen.x - this.tileWidth / 2, screen.y + this.tileHeight / 2); // Left
        this.ctx.closePath();
        
        // Fill with tile color
        this.ctx.fillStyle = this.getTileColor(tileData.type);
        this.ctx.fill();
        
        // Draw tile border
        this.ctx.strokeStyle = this.darkenColor(this.getTileColor(tileData.type), 0.8);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Add some variation for visual interest
        if (Math.random() > 0.95) {
            this.ctx.fillStyle = this.lightenColor(this.getTileColor(tileData.type), 1.1);
            this.ctx.beginPath();
            this.ctx.arc(screen.x - 10 + Math.random() * 20, 
                        screen.y + Math.random() * this.tileHeight, 
                        2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Get color for tile type
     */
    getTileColor(tileType) {
        return this.tileColors[tileType] || this.tileColors.grass;
    }

    /**
     * Darken a color by a factor
     */
    darkenColor(color, factor) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    }

    /**
     * Lighten a color by a factor
     */
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * factor);
        
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    /**
     * Render an entity (player, enemy, NPC, resource)
     */
    renderEntity(entity, camera) {
        // ✅ CRITICAL FIX: Validate entity before rendering
        if (!entity) {
            console.warn('Renderer.renderEntity: entity is null or undefined');
            return;
        }
        
        if (entity.x === undefined || entity.y === undefined) {
            console.warn('Renderer.renderEntity: entity missing x/y coordinates', entity);
            return;
        }
        
        if (!camera) {
            console.warn('Renderer.renderEntity: camera is null or undefined');
            return;
        }
        
        try {
            const screen = this.worldToScreen(entity.x, entity.y, camera);
            
            // ✅ Check if entity is visible before rendering
            if (!this.isEntityVisible(entity, camera)) {
                return; // Skip off-screen entities for performance
            }
            
            // Get entity dimensions with validation
            const width = (typeof entity.width === 'number' && entity.width > 0) ? entity.width : 16;
            const height = (typeof entity.height === 'number' && entity.height > 0) ? entity.height : 24;
            
            // Draw entity shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(screen.x, screen.y + height / 2, width / 2, 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw entity body (simple rectangle for now, will be sprites later)
            this.ctx.fillStyle = entity.color || this.entityColors[entity.type] || this.entityColors.player;
            this.ctx.fillRect(
                screen.x - width / 2,
                screen.y - height,
                width,
                height
            );
            
            // Draw entity outline
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                screen.x - width / 2,
                screen.y - height,
                width,
                height
            );
            
            // Draw name label if entity has a name
            if (entity.name && typeof entity.name === 'string') {
                this.renderNameLabel(entity.name, screen.x, screen.y - height - 5);
            }
            
            // Draw health bar if entity has HP
            if (entity.hp !== undefined && entity.maxHp !== undefined && 
                typeof entity.hp === 'number' && typeof entity.maxHp === 'number' &&
                entity.maxHp > 0) {
                this.renderHealthBar(
                    screen.x,
                    screen.y - height - 20,
                    width + 10,
                    4,
                    entity.hp,
                    entity.maxHp
                );
            }
            
            // Draw movement indicator if moving
            if (entity.isMoving && entity.targetX !== undefined && entity.targetY !== undefined) {
                const targetScreen = this.worldToScreen(entity.targetX, entity.targetY, camera);
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(targetScreen.x, targetScreen.y, 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        } catch (error) {
            console.error('Renderer.renderEntity: Error rendering entity', entity, error);
        }
    }
    
    /**
     * Check if entity is visible in camera viewport
     */
    isEntityVisible(entity, camera) {
        if (!entity || entity.x === undefined || entity.y === undefined) {
            return false;
        }
        return this.isVisible(entity.x, entity.y, camera);
    }

    /**
     * Render name label above entity
     */
    renderNameLabel(name, x, y) {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        
        // Draw text outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(name, x, y);
        
        // Draw text fill
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.fillText(name, x, y);
    }

    /**
     * Render health bar
     */
    renderHealthBar(x, y, width, height, current, max) {
        const percent = current / max;
        
        // Background (lost HP)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - width / 2, y, width, height);
        
        // Health fill
        let color;
        if (percent > 0.5) {
            color = '#4CAF50'; // Green
        } else if (percent > 0.25) {
            color = '#FFC107'; // Yellow
        } else {
            color = '#F44336'; // Red
        }
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y, width * percent, height);
        
        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - width / 2, y, width, height);
    }

    /**
     * Render the entire game world
     */
    renderWorld(worldData, camera, entities) {
        // ✅ CRITICAL FIX: Validate inputs
        if (!worldData || !worldData.tiles) {
            console.warn('Renderer.renderWorld: Invalid worldData', worldData);
            return;
        }
        
        if (!camera) {
            console.warn('Renderer.renderWorld: camera is null or undefined');
            return;
        }
        
        if (!Array.isArray(entities)) {
            console.warn('Renderer.renderWorld: entities is not an array', entities);
            entities = [];
        }
        
        try {
            // Calculate visible tile range
            const topLeft = this.screenToWorld(0, 0, camera);
            const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height, camera);
            
            const startX = Math.max(0, Math.floor(topLeft.x) - 2);
            const endX = Math.min(worldData.width || 50, Math.ceil(bottomRight.x) + 2);
            const startY = Math.max(0, Math.floor(topLeft.y) - 2);
            const endY = Math.min(worldData.height || 50, Math.ceil(bottomRight.y) + 2);
            
            // Render tiles (ground layer)
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    if (worldData.tiles[y] && worldData.tiles[y][x]) {
                        try {
                            this.renderTile(x, y, worldData.tiles[y][x], camera);
                        } catch (tileError) {
                            // Silent tile rendering errors to prevent spam
                            if (Math.random() < 0.01) { // Log only 1% of tile errors
                                console.warn('Tile render error at', x, y, tileError);
                            }
                        }
                    }
                }
            }
            
            // Collect and sort all renderable objects by Y position (for proper layering)
            const renderQueue = [];
            
            // Add entities to render queue with validation
            for (const entity of entities) {
                if (entity && entity.x !== undefined && entity.y !== undefined) {
                    if (this.isVisible(entity.x, entity.y, camera)) {
                        renderQueue.push({
                            y: entity.y,
                            type: 'entity',
                            data: entity
                        });
                    }
                }
            }
            
            // Sort by Y position (back to front rendering)
            renderQueue.sort((a, b) => a.y - b.y);
            
            // Render all objects in order
            for (const item of renderQueue) {
                if (item.type === 'entity' && item.data) {
                    this.renderEntity(item.data, camera);
                }
            }
        } catch (error) {
            console.error('Renderer.renderWorld: Critical rendering error', error);
        }
    }

    /**
     * Render floating damage number
     */
    renderDamageNumber(x, y, value, camera, color = '#FF0000') {
        const screen = this.worldToScreen(x, y, camera);
        
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(value.toString(), screen.x, screen.y);
        
        // Fill
        this.ctx.fillStyle = color;
        this.ctx.fillText(value.toString(), screen.x, screen.y);
    }

    /**
     * Render XP drop notification
     */
    renderXPDrop(x, y, skill, amount, camera) {
        const screen = this.worldToScreen(x, y, camera);
        
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        const text = `+${amount} ${skill} XP`;
        
        // Outline
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(text, screen.x, screen.y);
        
        // Fill
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillText(text, screen.x, screen.y);
    }

    /**
     * Render level up effect
     */
    renderLevelUpEffect(x, y, camera, radius = 30) {
        const screen = this.worldToScreen(x, y, camera);
        
        // Animated expanding circle
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Sparkles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const sparkleX = screen.x + Math.cos(angle) * radius;
            const sparkleY = screen.y + Math.sin(angle) * radius;
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    /**
     * Render minimap (placeholder for Phase 8)
     */
    renderMinimap(playerPos, worldData, x, y, width, height) {
        // Draw minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw player position as dot
        const playerX = x + (playerPos.x / worldData.width) * width;
        const playerY = y + (playerPos.y / worldData.height) * height;
        
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Label
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Minimap', x + width / 2, y + height + 12);
    }

    /**
     * Clear the entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Set rendering quality
     */
    setQuality(quality) {
        // quality: 'low', 'medium', 'high'
        switch(quality) {
            case 'low':
                this.ctx.imageSmoothingEnabled = false;
                break;
            case 'medium':
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'medium';
                break;
            case 'high':
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
                break;
        }
    }
}

// Make available globally
window.Renderer = Renderer;
