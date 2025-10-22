/**
 * WorldSystem.js - World and Area Management System
 * 
 * Manages game world areas, tile data, area loading/unloading, entity spawning,
 * area transitions, and portal system. Coordinates with GameConfig for area data.
 * 
 * @class WorldSystem
 */

class WorldSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null; // Will be set from GameConfig
        
        // Current area
        this.currentArea = null;
        this.currentAreaId = null;
        
        // Area cache
        this.loadedAreas = new Map(); // areaId -> area data
        
        // Tile data
        this.tiles = []; // 2D array of tiles for current area
        
        // Area dimensions
        this.areaWidth = 0;
        this.areaHeight = 0;
        
        // Spawn points
        this.spawnedEntities = new Map(); // entityId -> entity
        this.resourceSpawns = []; // Resource spawn locations
        
        // Portal system
        this.portals = []; // Portal objects in current area
        this.portalCheckRadius = 1.5; // Distance to detect portal
        
        // Tile types
        this.tileTypes = {
            grass: { walkable: true, color: '#3a5f3a', speedMod: 1.0 },
            dirt: { walkable: true, color: '#8b7355', speedMod: 1.0 },
            stone: { walkable: true, color: '#808080', speedMod: 0.9 },
            water: { walkable: false, color: '#2d5f9f', speedMod: 0 },
            sand: { walkable: true, color: '#e6d690', speedMod: 0.95 },
            path: { walkable: true, color: '#a0826d', speedMod: 1.1 },
            rock: { walkable: false, color: '#606060', speedMod: 0 },
            tree: { walkable: false, color: '#2d4a2d', speedMod: 0 },
            wall: { walkable: false, color: '#4a4a4a', speedMod: 0 },
            door: { walkable: true, color: '#8b6f47', speedMod: 1.0 }
        };
    }
    
    /**
     * Initialize the world system
     * @param {object} gameConfig - Game configuration object
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('WorldSystem initialized with', Object.keys(gameConfig.areas || {}).length, 'areas');
    }
    
    /**
     * Load a specific area
     * @param {string} areaId - Area ID from config
     * @param {object} entryPoint - Entry point {x, y} (optional)
     * @returns {Promise<object>} Loaded area data
     */
    async loadArea(areaId, entryPoint = null) {
        console.log(`🗺️ Loading area: ${areaId}`);
        
        // Check if area exists in config
        if (!this.gameConfig || !this.gameConfig.areas || !this.gameConfig.areas[areaId]) {
            console.error(`Area not found: ${areaId}`);
            throw new Error(`Area not found: ${areaId}`);
        }
        
        const areaConfig = this.gameConfig.areas[areaId];
        
        // Check cache
        if (this.loadedAreas.has(areaId)) {
            console.log(`  Using cached area data for ${areaId}`);
            this.currentArea = this.loadedAreas.get(areaId);
        } else {
            // Generate area data
            console.log(`  Generating area data for ${areaId}...`);
            this.currentArea = this.generateAreaData(areaConfig);
            this.loadedAreas.set(areaId, this.currentArea);
        }
        
        this.currentAreaId = areaId;
        this.areaWidth = this.currentArea.width;
        this.areaHeight = this.currentArea.height;
        this.tiles = this.currentArea.tiles;
        this.portals = this.currentArea.portals || [];
        
        // Move player to entry point
        if (entryPoint && this.gameEngine.player) {
            this.gameEngine.player.teleportTo(entryPoint.x, entryPoint.y);
        } else if (this.currentArea.spawnPoint && this.gameEngine.player) {
            this.gameEngine.player.teleportTo(
                this.currentArea.spawnPoint.x,
                this.currentArea.spawnPoint.y
            );
        }
        
        // Spawn entities for this area
        await this.spawnEntities(areaId);
        
        // Set camera bounds
        if (this.gameEngine.camera) {
            this.gameEngine.camera.setBounds(
                0, this.areaWidth,
                0, this.areaHeight
            );
        }
        
        console.log(`✅ Area ${areaId} loaded (${this.areaWidth}x${this.areaHeight})`);
        this.gameEngine.emit('world:areaLoaded', { areaId, area: this.currentArea });
        
        return this.currentArea;
    }
    
    /**
     * Generate area data from config
     * @param {object} areaConfig - Area configuration
     * @returns {object} Generated area data
     */
    generateAreaData(areaConfig) {
        const width = areaConfig.width || 50;
        const height = areaConfig.height || 50;
        
        // Generate tile grid
        const tiles = [];
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = this.generateTile(x, y, areaConfig);
            }
        }
        
        // Generate portals from config
        const portals = [];
        if (areaConfig.portals) {
            for (const portalConfig of areaConfig.portals) {
                portals.push({
                    x: portalConfig.x,
                    y: portalConfig.y,
                    targetArea: portalConfig.targetArea,
                    targetX: portalConfig.targetX,
                    targetY: portalConfig.targetY,
                    name: portalConfig.name || 'Portal'
                });
            }
        }
        
        return {
            id: areaConfig.id,
            name: areaConfig.name,
            width,
            height,
            tiles,
            portals,
            spawnPoint: areaConfig.spawnPoint || { x: Math.floor(width / 2), y: Math.floor(height / 2) },
            music: areaConfig.music || null,
            ambientSound: areaConfig.ambientSound || null,
            dangerLevel: areaConfig.dangerLevel || 0
        };
    }
    
    /**
     * Generate a single tile
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} areaConfig - Area configuration
     * @returns {object} Tile data
     */
    generateTile(x, y, areaConfig) {
        // Use area's default tile type or grass
        let tileType = areaConfig.defaultTile || 'grass';
        
        // Add some variety with noise
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        
        if (areaConfig.theme === 'desert') {
            tileType = noise > 0.3 ? 'sand' : 'dirt';
        } else if (areaConfig.theme === 'dungeon') {
            tileType = noise > 0.5 ? 'stone' : 'dirt';
        } else if (areaConfig.theme === 'forest') {
            tileType = noise > 0.4 ? 'grass' : 'dirt';
        }
        
        // Edge tiles become walls for boundaries
        if (x === 0 || y === 0 || x === areaConfig.width - 1 || y === areaConfig.height - 1) {
            // Check if there's a portal at this edge
            const hasPortal = areaConfig.portals?.some(p => 
                Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2
            );
            
            if (!hasPortal) {
                tileType = areaConfig.theme === 'dungeon' ? 'wall' : 'rock';
            }
        }
        
        const tileInfo = this.tileTypes[tileType] || this.tileTypes.grass;
        
        return {
            type: tileType,
            walkable: tileInfo.walkable,
            speedMod: tileInfo.speedMod,
            color: tileInfo.color,
            x,
            y
        };
    }
    
    /**
     * Change to a different area
     * @param {string} newAreaId - Target area ID
     * @param {object} entryPoint - Entry point {x, y}
     */
    async changeArea(newAreaId, entryPoint = null) {
        console.log(`🚪 Changing area from ${this.currentAreaId} to ${newAreaId}`);
        
        // Unload current area entities
        this.unloadAreaEntities();
        
        // Load new area
        await this.loadArea(newAreaId, entryPoint);
        
        // Show area name to player
        if (this.gameEngine.uiManager) {
            this.gameEngine.uiManager.showNotification(
                `Entering ${this.currentArea.name}`,
                'info'
            );
        }
        
        this.gameEngine.emit('world:areaChanged', { 
            oldArea: this.currentAreaId,
            newArea: newAreaId 
        });
    }
    
    /**
     * Spawn entities for current area
     * @param {string} areaId - Area ID
     */
    async spawnEntities(areaId) {
        console.log(`  Spawning entities for area: ${areaId}`);
        
        const areaConfig = this.gameConfig.areas[areaId];
        if (!areaConfig) return;
        
        // Clear existing spawns
        this.spawnedEntities.clear();
        this.resourceSpawns = [];
        
        // Spawn resources
        if (areaConfig.resources) {
            for (const resourceSpawn of areaConfig.resources) {
                this.spawnResource(resourceSpawn);
            }
        }
        
        // Spawn NPCs
        if (areaConfig.npcs) {
            for (const npcSpawn of areaConfig.npcs) {
                this.spawnNPC(npcSpawn);
            }
        }
        
        // Spawn enemies
        if (areaConfig.enemies) {
            for (const enemySpawn of areaConfig.enemies) {
                this.spawnEnemy(enemySpawn);
            }
        }
        
        console.log(`  ✅ Spawned ${this.spawnedEntities.size} entities`);
    }
    
    /**
     * Spawn a resource node
     * @param {object} spawnData - Resource spawn configuration
     */
    spawnResource(spawnData) {
        // Resource spawning will be implemented with Resource.js in Task 3.2
        this.resourceSpawns.push({
            type: spawnData.type,
            x: spawnData.x,
            y: spawnData.y,
            respawnTime: spawnData.respawnTime || 60
        });
        
        // Placeholder: Will create actual Resource entity later
        console.log(`    [Resource] ${spawnData.type} at (${spawnData.x}, ${spawnData.y})`);
    }
    
    /**
     * Spawn an NPC
     * @param {object} spawnData - NPC spawn configuration
     */
    spawnNPC(spawnData) {
        // NPC spawning will be implemented with NPCSystem in Phase 6
        const npcId = `npc_${spawnData.npcId}_${Date.now()}`;
        
        this.spawnedEntities.set(npcId, {
            type: 'npc',
            npcId: spawnData.npcId,
            x: spawnData.x,
            y: spawnData.y
        });
        
        console.log(`    [NPC] ${spawnData.npcId} at (${spawnData.x}, ${spawnData.y})`);
    }
    
    /**
     * Spawn an enemy
     * @param {object} spawnData - Enemy spawn configuration
     */
    spawnEnemy(spawnData) {
        // Phase 4: Spawn actual Enemy instance
        const enemyId = `enemy_${spawnData.type}_${Date.now()}_${Math.random()}`;
        
        // Create Enemy instance
        const enemy = new Enemy({
            type: spawnData.type,
            x: spawnData.x,
            y: spawnData.y,
            level: spawnData.level || 1,
            gameEngine: this.gameEngine
        });
        
        // Add to game entities
        this.gameEngine.entities.push(enemy);
        
        // Store reference
        this.spawnedEntities.set(enemyId, enemy);
        
        console.log(`    [Enemy] ${spawnData.type} (Lv${spawnData.level || 1}) at (${spawnData.x}, ${spawnData.y})`);
    }
    
    /**
     * Unload entities from current area
     */
    unloadAreaEntities() {
        console.log(`  Unloading ${this.spawnedEntities.size} entities`);
        
        // Remove entities from game engine
        for (const [entityId, entity] of this.spawnedEntities.entries()) {
            if (entity.type === 'enemy' || entity.type === 'resource') {
                const index = this.gameEngine.entities.indexOf(entity);
                if (index > -1) {
                    this.gameEngine.entities.splice(index, 1);
                }
            }
        }
        
        this.spawnedEntities.clear();
        this.resourceSpawns = [];
    }
    
    /**
     * Get tile at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null} Tile data
     */
    getTileAt(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        if (tileX < 0 || tileX >= this.areaWidth || tileY < 0 || tileY >= this.areaHeight) {
            return null;
        }
        
        return this.tiles[tileY][tileX];
    }
    
    /**
     * Check if position is walkable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Is walkable
     */
    isWalkable(x, y) {
        const tile = this.getTileAt(x, y);
        return tile ? tile.walkable : false;
    }
    
    /**
     * Get speed modifier at position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Speed multiplier
     */
    getSpeedModifier(x, y) {
        const tile = this.getTileAt(x, y);
        return tile ? (tile.speedMod || 1.0) : 1.0;
    }
    
    /**
     * Check for nearby portals
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null} Portal if found
     */
    checkPortalCollision(x, y) {
        for (const portal of this.portals) {
            const dx = portal.x - x;
            const dy = portal.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.portalCheckRadius) {
                return portal;
            }
        }
        
        return null;
    }
    
    /**
     * Update world system
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.currentArea || !this.gameEngine.player) return;
        
        // Check if player is near a portal
        const playerX = this.gameEngine.player.x;
        const playerY = this.gameEngine.player.y;
        
        const nearbyPortal = this.checkPortalCollision(playerX, playerY);
        
        if (nearbyPortal && !this.gameEngine.player.moving) {
            // Player is standing on a portal
            this.handlePortalInteraction(nearbyPortal);
        }
        
        // Update spawned entities (will be expanded in later phases)
        // for (const [id, entity] of this.spawnedEntities) {
        //     if (entity.update) entity.update(deltaTime);
        // }
    }
    
    /**
     * Handle portal interaction
     * @param {object} portal - Portal object
     */
    handlePortalInteraction(portal) {
        // Debounce portal usage
        const now = Date.now();
        if (this.lastPortalUse && now - this.lastPortalUse < 1000) {
            return;
        }
        
        this.lastPortalUse = now;
        
        console.log(`🚪 Using portal to ${portal.targetArea}`);
        
        // Change to target area
        this.changeArea(portal.targetArea, {
            x: portal.targetX,
            y: portal.targetY
        });
    }
    
    /**
     * Get all entities in area
     * @returns {Map} Map of entity ID -> entity
     */
    getEntities() {
        return this.spawnedEntities;
    }
    
    /**
     * Get resource spawns
     * @returns {array} Array of resource spawn data
     */
    getResourceSpawns() {
        return this.resourceSpawns;
    }
    
    /**
     * Get current area info
     * @returns {object} Current area data
     */
    getCurrentArea() {
        return this.currentArea;
    }
    
    /**
     * Get area by ID
     * @param {string} areaId - Area ID
     * @returns {object} Area config
     */
    getAreaConfig(areaId) {
        if (!this.gameConfig || !this.gameConfig.areas) {
            return null;
        }
        
        return this.gameConfig.areas[areaId];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldSystem;
}
