/**
 * PathFinding.js - A* Pathfinding Algorithm
 * 
 * Finds optimal path from start to goal avoiding obstacles.
 * Uses A* (A-star) algorithm with Manhattan distance heuristic.
 * 
 * Features:
 * - A* algorithm for optimal path finding
 * - Obstacle avoidance
 * - Diagonal movement support
 * - Path smoothing
 * - Configurable movement costs
 * 
 * @class PathFinding
 */

class PathFinding {
    constructor(worldSystem) {
        this.worldSystem = worldSystem;
        
        // Movement costs
        this.straightCost = 10; // Cost for straight movement (up, down, left, right)
        this.diagonalCost = 14; // Cost for diagonal movement (√2 * 10 ≈ 14)
        
        // Search limits
        this.maxIterations = 1000; // Prevent infinite loops
        
        console.log('PathFinding system initialized');
    }
    
    /**
     * Find path from start to goal using A* algorithm
     * @param {number} startX - Start X coordinate
     * @param {number} startY - Start Y coordinate
     * @param {number} goalX - Goal X coordinate
     * @param {number} goalY - Goal Y coordinate
     * @param {boolean} allowDiagonal - Allow diagonal movement
     * @returns {Array|null} Array of {x, y} points or null if no path found
     */
    findPath(startX, startY, goalX, goalY, allowDiagonal = true) {
        // Round coordinates to integer tiles
        startX = Math.floor(startX);
        startY = Math.floor(startY);
        goalX = Math.floor(goalX);
        goalY = Math.floor(goalY);
        
        // Check if start and goal are valid
        if (!this.isWalkable(startX, startY) || !this.isWalkable(goalX, goalY)) {
            console.warn('PathFinding: Start or goal is not walkable');
            return null;
        }
        
        // Check if already at goal
        if (startX === goalX && startY === goalY) {
            return [{ x: goalX, y: goalY }];
        }
        
        // Initialize open and closed sets
        const openSet = new Map(); // Map of "x,y" -> node
        const closedSet = new Set(); // Set of "x,y"
        
        // Create start node
        const startNode = this.createNode(startX, startY, null, 0, this.heuristic(startX, startY, goalX, goalY));
        openSet.set(this.getKey(startX, startY), startNode);
        
        let iterations = 0;
        
        // A* main loop
        while (openSet.size > 0 && iterations < this.maxIterations) {
            iterations++;
            
            // Find node with lowest f cost
            let current = null;
            let currentKey = null;
            let lowestF = Infinity;
            
            for (const [key, node] of openSet) {
                if (node.f < lowestF) {
                    lowestF = node.f;
                    current = node;
                    currentKey = key;
                }
            }
            
            // Check if reached goal
            if (current.x === goalX && current.y === goalY) {
                return this.reconstructPath(current);
            }
            
            // Move current from open to closed
            openSet.delete(currentKey);
            closedSet.add(currentKey);
            
            // Check neighbors
            const neighbors = this.getNeighbors(current.x, current.y, allowDiagonal);
            
            for (const neighbor of neighbors) {
                const neighborKey = this.getKey(neighbor.x, neighbor.y);
                
                // Skip if in closed set
                if (closedSet.has(neighborKey)) {
                    continue;
                }
                
                // Calculate g cost
                const moveCost = neighbor.diagonal ? this.diagonalCost : this.straightCost;
                const tentativeG = current.g + moveCost;
                
                // Check if this path to neighbor is better
                let neighborNode = openSet.get(neighborKey);
                
                if (!neighborNode) {
                    // Add new node to open set
                    const h = this.heuristic(neighbor.x, neighbor.y, goalX, goalY);
                    neighborNode = this.createNode(neighbor.x, neighbor.y, current, tentativeG, h);
                    openSet.set(neighborKey, neighborNode);
                } else if (tentativeG < neighborNode.g) {
                    // Update existing node with better path
                    neighborNode.g = tentativeG;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }
        
        // No path found
        if (iterations >= this.maxIterations) {
            console.warn('PathFinding: Max iterations reached');
        }
        
        return null;
    }
    
    /**
     * Create a pathfinding node
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} parent - Parent node
     * @param {number} g - Cost from start
     * @param {number} h - Heuristic cost to goal
     * @returns {object} Node object
     */
    createNode(x, y, parent, g, h) {
        return {
            x: x,
            y: y,
            parent: parent,
            g: g, // Cost from start
            h: h, // Heuristic cost to goal
            f: g + h // Total cost
        };
    }
    
    /**
     * Get string key for coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} Key string
     */
    getKey(x, y) {
        return `${x},${y}`;
    }
    
    /**
     * Heuristic function (Manhattan distance)
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - Goal X
     * @param {number} y2 - Goal Y
     * @returns {number} Estimated cost
     */
    heuristic(x1, y1, x2, y2) {
        // Manhattan distance * straight cost
        return (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * this.straightCost;
    }
    
    /**
     * Get walkable neighbors of a position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} allowDiagonal - Allow diagonal movement
     * @returns {Array} Array of neighbor positions
     */
    getNeighbors(x, y, allowDiagonal = true) {
        const neighbors = [];
        
        // Straight neighbors (up, down, left, right)
        const straight = [
            { x: x, y: y - 1, diagonal: false },     // North
            { x: x + 1, y: y, diagonal: false },     // East
            { x: x, y: y + 1, diagonal: false },     // South
            { x: x - 1, y: y, diagonal: false }      // West
        ];
        
        // Check straight neighbors
        const walkableStraight = [];
        for (const pos of straight) {
            if (this.isWalkable(pos.x, pos.y)) {
                neighbors.push(pos);
                walkableStraight.push(pos);
            }
        }
        
        // Diagonal neighbors (only if diagonal movement allowed)
        if (allowDiagonal) {
            const diagonal = [
                { x: x - 1, y: y - 1, diagonal: true, requires: [0, 3] },  // Northwest (North + West)
                { x: x + 1, y: y - 1, diagonal: true, requires: [0, 1] },  // Northeast (North + East)
                { x: x + 1, y: y + 1, diagonal: true, requires: [1, 2] },  // Southeast (East + South)
                { x: x - 1, y: y + 1, diagonal: true, requires: [2, 3] }   // Southwest (South + West)
            ];
            
            // Check diagonal neighbors (only if adjacent straight paths are walkable)
            for (let i = 0; i < diagonal.length; i++) {
                const pos = diagonal[i];
                
                // Check if both required straight paths are walkable
                const req1 = straight[pos.requires[0]];
                const req2 = straight[pos.requires[1]];
                
                if (this.isWalkable(req1.x, req1.y) && 
                    this.isWalkable(req2.x, req2.y) && 
                    this.isWalkable(pos.x, pos.y)) {
                    neighbors.push(pos);
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * Check if a tile is walkable
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} Is walkable
     */
    isWalkable(x, y) {
        if (!this.worldSystem || !this.worldSystem.currentArea) {
            return false;
        }
        
        // Check bounds
        const area = this.worldSystem.currentArea;
        if (x < 0 || y < 0 || x >= area.width || y >= area.height) {
            return false;
        }
        
        // Check tile walkability
        const tileIndex = y * area.width + x;
        const tile = area.tiles[tileIndex];
        
        if (!tile) {
            return false;
        }
        
        // Check if tile is walkable (not water, not obstacle)
        return tile.walkable !== false && tile.type !== 'water';
    }
    
    /**
     * Reconstruct path from goal node to start
     * @param {object} node - Goal node
     * @returns {Array} Path array of {x, y} points
     */
    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }
        
        return path;
    }
    
    /**
     * Smooth path by removing unnecessary waypoints
     * @param {Array} path - Original path
     * @returns {Array} Smoothed path
     */
    smoothPath(path) {
        if (!path || path.length <= 2) {
            return path;
        }
        
        const smoothed = [path[0]]; // Start with first point
        let current = 0;
        
        while (current < path.length - 1) {
            // Try to skip ahead as far as possible
            let farthest = current + 1;
            
            for (let i = path.length - 1; i > current + 1; i--) {
                if (this.hasLineOfSight(path[current].x, path[current].y, path[i].x, path[i].y)) {
                    farthest = i;
                    break;
                }
            }
            
            smoothed.push(path[farthest]);
            current = farthest;
        }
        
        return smoothed;
    }
    
    /**
     * Check if there's a clear line of sight between two points
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @returns {boolean} Has line of sight
     */
    hasLineOfSight(x1, y1, x2, y2) {
        // Bresenham's line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            // Check if current point is walkable
            if (!this.isWalkable(x, y)) {
                return false;
            }
            
            // Check if reached end
            if (x === x2 && y === y2) {
                return true;
            }
            
            const e2 = 2 * err;
            
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    /**
     * Get distance between two points
     * @param {number} x1 - Point 1 X
     * @param {number} y1 - Point 1 Y
     * @param {number} x2 - Point 2 X
     * @param {number} y2 - Point 2 Y
     * @returns {number} Distance
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathFinding;
}
