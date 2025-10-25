/**
 * ObjectPool.js - Object Pooling System
 * 
 * Reuses objects instead of creating/destroying them repeatedly.
 * Reduces garbage collection overhead and improves performance.
 * 
 * Performance Benefits:
 * - Reduces GC pressure (fewer object allocations/deallocations)
 * - Faster object acquisition (no constructor overhead)
 * - Predictable memory usage
 * 
 * Usage:
 * const pool = new ObjectPool(() => new Enemy(), 50);
 * const enemy = pool.acquire();
 * // ... use enemy ...
 * pool.release(enemy);
 * 
 * @class ObjectPool
 */

class ObjectPool {
    constructor(factory, initialSize = 0, maxSize = Infinity) {
        this.factory = factory; // Function to create new objects
        this.pool = []; // Available objects
        this.active = new Set(); // Currently active objects
        this.maxSize = maxSize; // Maximum pool size
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
        
        console.log(`ObjectPool created with ${initialSize} objects (max: ${maxSize === Infinity ? '∞' : maxSize})`);
    }
    
    /**
     * Acquire an object from the pool
     * @param {function} resetFn - Optional reset function to initialize object
     * @returns {object} Object from pool
     */
    acquire(resetFn = null) {
        let obj;
        
        // Try to get from pool
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            // Pool empty, create new object
            obj = this.factory();
        }
        
        // Reset object if reset function provided
        if (resetFn && typeof resetFn === 'function') {
            resetFn(obj);
        }
        
        // Track active object
        this.active.add(obj);
        
        return obj;
    }
    
    /**
     * Release an object back to the pool
     * @param {object} obj - Object to release
     * @param {function} cleanupFn - Optional cleanup function
     */
    release(obj) {
        if (!obj) {
            return;
        }
        
        // Check if object was from this pool
        if (!this.active.has(obj)) {
            console.warn('ObjectPool.release: Object not from this pool');
            return;
        }
        
        // Remove from active tracking
        this.active.delete(obj);
        
        // Return to pool if under max size
        if (this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
        // Otherwise let it be garbage collected
    }
    
    /**
     * Release multiple objects at once
     * @param {Array} objects - Array of objects to release
     */
    releaseAll(objects) {
        if (!Array.isArray(objects)) {
            return;
        }
        
        for (const obj of objects) {
            this.release(obj);
        }
    }
    
    /**
     * Clear all objects from the pool
     */
    clear() {
        this.pool = [];
        this.active.clear();
    }
    
    /**
     * Get pool statistics
     * @returns {object} Pool stats
     */
    getStats() {
        return {
            available: this.pool.length,
            active: this.active.size,
            total: this.pool.length + this.active.size,
            maxSize: this.maxSize
        };
    }
}

/**
 * DamageNumberPool - Specialized pool for damage numbers
 */
class DamageNumberPool extends ObjectPool {
    constructor(initialSize = 20) {
        super(() => ({
            x: 0,
            y: 0,
            value: 0,
            color: '#ff0000',
            lifetime: 0,
            maxLifetime: 1.5,
            velocityY: -30,
            active: false
        }), initialSize, 50);
    }
    
    /**
     * Acquire a damage number with initialization
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} value - Damage value
     * @param {string} color - Text color
     * @returns {object} Damage number object
     */
    spawn(x, y, value, color = '#ff0000') {
        return this.acquire((obj) => {
            obj.x = x;
            obj.y = y;
            obj.value = value;
            obj.color = color;
            obj.lifetime = 0;
            obj.maxLifetime = 1.5;
            obj.velocityY = -30;
            obj.active = true;
        });
    }
}

/**
 * ParticlePool - Specialized pool for particle effects
 */
class ParticlePool extends ObjectPool {
    constructor(initialSize = 100) {
        super(() => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 2,
            color: '#ffffff',
            lifetime: 0,
            maxLifetime: 1,
            alpha: 1,
            active: false
        }), initialSize, 200);
    }
    
    /**
     * Acquire a particle with initialization
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - Particle color
     * @param {number} lifetime - Lifetime in seconds
     * @returns {object} Particle object
     */
    spawn(x, y, vx, vy, color = '#ffffff', lifetime = 1) {
        return this.acquire((obj) => {
            obj.x = x;
            obj.y = y;
            obj.vx = vx;
            obj.vy = vy;
            obj.size = 2 + Math.random() * 2;
            obj.color = color;
            obj.lifetime = 0;
            obj.maxLifetime = lifetime;
            obj.alpha = 1;
            obj.active = true;
        });
    }
    
    /**
     * Create particle burst effect
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} count - Number of particles
     * @param {string} color - Particle color
     * @returns {Array} Array of spawned particles
     */
    burst(x, y, count = 10, color = '#ffffff') {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            particles.push(this.spawn(x, y, vx, vy, color, 0.5 + Math.random() * 0.5));
        }
        
        return particles;
    }
}

/**
 * PoolManager - Manages multiple pools
 */
class PoolManager {
    constructor() {
        this.pools = new Map();
        
        // Create common pools
        this.createPool('damageNumbers', DamageNumberPool, 20);
        this.createPool('particles', ParticlePool, 100);
        
        console.log('PoolManager initialized with common pools');
    }
    
    /**
     * Create a new pool
     * @param {string} name - Pool name
     * @param {function} PoolClass - Pool class constructor
     * @param {number} initialSize - Initial pool size
     */
    createPool(name, PoolClass, initialSize = 0) {
        if (this.pools.has(name)) {
            console.warn(`PoolManager: Pool '${name}' already exists`);
            return;
        }
        
        this.pools.set(name, new PoolClass(initialSize));
    }
    
    /**
     * Get a pool by name
     * @param {string} name - Pool name
     * @returns {ObjectPool} Pool instance
     */
    getPool(name) {
        if (!this.pools.has(name)) {
            console.error(`PoolManager: Pool '${name}' not found`);
            return null;
        }
        
        return this.pools.get(name);
    }
    
    /**
     * Get stats for all pools
     * @returns {object} Stats for all pools
     */
    getAllStats() {
        const stats = {};
        
        for (const [name, pool] of this.pools.entries()) {
            stats[name] = pool.getStats();
        }
        
        return stats;
    }
    
    /**
     * Clear all pools
     */
    clearAll() {
        for (const pool of this.pools.values()) {
            pool.clear();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ObjectPool,
        DamageNumberPool,
        ParticlePool,
        PoolManager
    };
}
