/**
 * SpatialGrid.js - Spatial Partitioning System
 * 
 * Divides the world into grid cells for efficient entity queries.
 * Reduces O(n²) collision checks to O(n) by only checking nearby entities.
 * 
 * Performance Benefits:
 * - Fast spatial queries (getEntitiesInRadius, getEntitiesInArea)
 * - Efficient collision detection
 * - Optimized rendering (only check visible cells)
 * 
 * @class SpatialGrid
 */

class SpatialGrid {
    constructor(cellSize = 10) {
        this.cellSize = cellSize; // Size of each grid cell in world units
        this.grid = new Map(); // Map of "x,y" -> Set of entities
        this.entityCells = new Map(); // Map of entity -> Set of cell keys
        
        console.log(`SpatialGrid created with cell size ${cellSize}`);
    }
    
    /**
     * Convert world coordinates to cell coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {object} Cell coordinates
     */
    worldToCell(x, y) {
        return {
            x: Math.floor(x / this.cellSize),
            y: Math.floor(y / this.cellSize)
        };
    }
    
    /**
     * Get cell key from cell coordinates
     * @param {number} cellX - Cell X coordinate
     * @param {number} cellY - Cell Y coordinate
     * @returns {string} Cell key
     */
    getCellKey(cellX, cellY) {
        return `${cellX},${cellY}`;
    }
    
    /**
     * Get cell key from world coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {string} Cell key
     */
    getCellKeyFromWorld(x, y) {
        const cell = this.worldToCell(x, y);
        return this.getCellKey(cell.x, cell.y);
    }
    
    /**
     * Insert entity into the grid
     * @param {object} entity - Entity to insert
     */
    insert(entity) {
        if (!entity || entity.x === undefined || entity.y === undefined) {
            console.warn('SpatialGrid.insert: Invalid entity', entity);
            return;
        }
        
        // Get cell for entity position
        const cellKey = this.getCellKeyFromWorld(entity.x, entity.y);
        
        // Get or create cell
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, new Set());
        }
        
        // Add entity to cell
        this.grid.get(cellKey).add(entity);
        
        // Track which cells this entity is in
        if (!this.entityCells.has(entity)) {
            this.entityCells.set(entity, new Set());
        }
        this.entityCells.get(entity).add(cellKey);
    }
    
    /**
     * Remove entity from the grid
     * @param {object} entity - Entity to remove
     */
    remove(entity) {
        if (!entity) {
            return;
        }
        
        // Get cells this entity was in
        const cells = this.entityCells.get(entity);
        
        if (!cells) {
            return; // Entity not in grid
        }
        
        // Remove entity from all its cells
        for (const cellKey of cells) {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.delete(entity);
                
                // Clean up empty cells
                if (cell.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        }
        
        // Remove entity tracking
        this.entityCells.delete(entity);
    }
    
    /**
     * Update entity position in the grid
     * @param {object} entity - Entity to update
     * @param {number} oldX - Previous X position
     * @param {number} oldY - Previous Y position
     */
    update(entity, oldX, oldY) {
        if (!entity || entity.x === undefined || entity.y === undefined) {
            return;
        }
        
        // Check if entity changed cells
        const oldCellKey = this.getCellKeyFromWorld(oldX, oldY);
        const newCellKey = this.getCellKeyFromWorld(entity.x, entity.y);
        
        if (oldCellKey === newCellKey) {
            return; // Still in same cell, no update needed
        }
        
        // Remove from old cell and add to new cell
        this.remove(entity);
        this.insert(entity);
    }
    
    /**
     * Get all entities in a specific cell
     * @param {number} cellX - Cell X coordinate
     * @param {number} cellY - Cell Y coordinate
     * @returns {Set} Set of entities in cell
     */
    getCellEntities(cellX, cellY) {
        const cellKey = this.getCellKey(cellX, cellY);
        return this.grid.get(cellKey) || new Set();
    }
    
    /**
     * Get all entities within a radius of a point
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius - Search radius
     * @returns {Array} Array of entities within radius
     */
    getEntitiesInRadius(x, y, radius) {
        const entities = new Set();
        
        // Calculate cell range to check
        const centerCell = this.worldToCell(x, y);
        const cellRadius = Math.ceil(radius / this.cellSize);
        
        // Check all cells in range
        for (let cx = centerCell.x - cellRadius; cx <= centerCell.x + cellRadius; cx++) {
            for (let cy = centerCell.y - cellRadius; cy <= centerCell.y + cellRadius; cy++) {
                const cellEntities = this.getCellEntities(cx, cy);
                
                // Check each entity in cell
                for (const entity of cellEntities) {
                    // Calculate actual distance
                    const dx = entity.x - x;
                    const dy = entity.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= radius) {
                        entities.add(entity);
                    }
                }
            }
        }
        
        return Array.from(entities);
    }
    
    /**
     * Get all entities in a rectangular area
     * @param {number} minX - Minimum X coordinate
     * @param {number} minY - Minimum Y coordinate
     * @param {number} maxX - Maximum X coordinate
     * @param {number} maxY - Maximum Y coordinate
     * @returns {Array} Array of entities in area
     */
    getEntitiesInArea(minX, minY, maxX, maxY) {
        const entities = new Set();
        
        // Calculate cell range
        const minCell = this.worldToCell(minX, minY);
        const maxCell = this.worldToCell(maxX, maxY);
        
        // Check all cells in range
        for (let cx = minCell.x; cx <= maxCell.x; cx++) {
            for (let cy = minCell.y; cy <= maxCell.y; cy++) {
                const cellEntities = this.getCellEntities(cx, cy);
                
                // Check each entity in cell
                for (const entity of cellEntities) {
                    // Check if entity is actually in bounds
                    if (entity.x >= minX && entity.x <= maxX &&
                        entity.y >= minY && entity.y <= maxY) {
                        entities.add(entity);
                    }
                }
            }
        }
        
        return Array.from(entities);
    }
    
    /**
     * Get all entities near a given entity
     * @param {object} entity - Reference entity
     * @param {number} radius - Search radius
     * @returns {Array} Array of nearby entities (excluding the reference entity)
     */
    getNearbyEntities(entity, radius) {
        if (!entity || entity.x === undefined || entity.y === undefined) {
            return [];
        }
        
        const entities = this.getEntitiesInRadius(entity.x, entity.y, radius);
        
        // Filter out the reference entity itself
        return entities.filter(e => e !== entity);
    }
    
    /**
     * Clear all entities from the grid
     */
    clear() {
        this.grid.clear();
        this.entityCells.clear();
    }
    
    /**
     * Get statistics about the grid
     * @returns {object} Grid statistics
     */
    getStats() {
        let totalEntities = 0;
        let maxEntitiesPerCell = 0;
        let occupiedCells = 0;
        
        for (const [cellKey, entities] of this.grid.entries()) {
            occupiedCells++;
            totalEntities += entities.size;
            maxEntitiesPerCell = Math.max(maxEntitiesPerCell, entities.size);
        }
        
        return {
            cellSize: this.cellSize,
            totalEntities: totalEntities,
            occupiedCells: occupiedCells,
            maxEntitiesPerCell: maxEntitiesPerCell,
            avgEntitiesPerCell: occupiedCells > 0 ? (totalEntities / occupiedCells).toFixed(2) : 0
        };
    }
    
    /**
     * Rebuild the entire grid (useful after bulk entity updates)
     * @param {Array} entities - Array of all entities
     */
    rebuild(entities) {
        this.clear();
        
        if (!entities || !Array.isArray(entities)) {
            return;
        }
        
        for (const entity of entities) {
            this.insert(entity);
        }
        
        console.log(`SpatialGrid rebuilt with ${entities.length} entities`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpatialGrid;
}
