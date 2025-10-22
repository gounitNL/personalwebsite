/**
 * Enemy.js - Enemy Entity Class
 * 
 * Represents hostile NPCs that players can fight. Includes AI for movement,
 * combat behavior, health management, loot drops, and respawning.
 * 
 * @class Enemy
 */

class Enemy {
    constructor(data = {}) {
        // Identity
        this.id = data.id || `enemy_${Date.now()}_${Math.random()}`;
        this.type = 'enemy';
        this.enemyType = data.enemyType; // e.g., 'goblin', 'dragon'
        
        // Position
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.spawnX = data.spawnX || this.x;
        this.spawnY = data.spawnY || this.y;
        
        // Movement
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
        this.speed = data.speed || 3; // tiles per second
        this.facing = 'south';
        
        // Combat stats
        this.level = data.level || 1;
        this.combatLevel = data.combatLevel || this.level;
        this.hitpoints = data.hitpoints || 10;
        this.maxHitpoints = data.maxHitpoints || this.hitpoints;
        
        this.attackLevel = data.attackLevel || this.level;
        this.strengthLevel = data.strengthLevel || this.level;
        this.defenceLevel = data.defenceLevel || this.level;
        this.rangedLevel = data.rangedLevel || 1;
        this.magicLevel = data.magicLevel || 1;
        
        // Combat properties
        this.maxHit = data.maxHit || Math.floor(this.level / 2) + 1;
        this.attackSpeed = data.attackSpeed || 4; // attacks per 2.4 seconds (RuneScape)
        this.attackRange = data.attackRange || 1; // melee range
        this.attackStyle = data.attackStyle || 'melee'; // melee, ranged, magic
        this.aggressive = data.aggressive !== undefined ? data.aggressive : true;
        this.respawnTime = data.respawnTime || 30; // seconds
        
        // Visual
        this.name = data.name || 'Enemy';
        this.color = data.color || '#ff4444';
        this.size = data.size || 0.9;
        
        // AI State
        this.aiState = 'idle'; // idle, wandering, chasing, attacking, fleeing
        this.target = null; // Current combat target
        this.inCombat = false;
        this.lastAttackTime = 0;
        
        // Behavior
        this.aggroRange = data.aggroRange || 5; // tiles
        this.wanderRadius = data.wanderRadius || 3; // tiles from spawn
        this.retreatThreshold = data.retreatThreshold || 0.2; // HP % to flee
        
        // State
        this.alive = true;
        this.respawning = false;
        this.respawnTimer = 0;
        
        // Loot
        this.lootTable = data.lootTable || [];
        this.alwaysDrops = data.alwaysDrops || [];
        
        // Animation
        this.animationState = 'idle';
        this.animationTime = 0;
        this.animationFrame = 0;
        
        // Timers
        this.wanderTimer = 0;
        this.wanderInterval = 3 + Math.random() * 3; // 3-6 seconds
        
        // Configuration reference
        this.config = data.config || null;
    }
    
    /**
     * Update enemy state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.alive) {
            // Handle respawning
            if (this.respawning) {
                this.respawnTimer += deltaTime;
                if (this.respawnTimer >= this.respawnTime) {
                    this.respawn();
                }
            }
            return;
        }
        
        // Update movement
        if (this.moving) {
            this.updateMovement(deltaTime);
        }
        
        // Update AI
        this.updateAI(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Passive HP regen when not in combat
        if (!this.inCombat && this.hitpoints < this.maxHitpoints) {
            const regenRate = this.maxHitpoints * 0.01; // 1% per second
            this.hitpoints = Math.min(
                this.maxHitpoints,
                this.hitpoints + (regenRate * deltaTime)
            );
        }
    }
    
    /**
     * Update movement towards target position
     * @param {number} deltaTime - Time since last frame
     */
    updateMovement(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) {
            // Reached destination
            this.x = this.targetX;
            this.y = this.targetY;
            this.moving = false;
            return;
        }
        
        // Move towards target
        const moveDistance = this.speed * deltaTime;
        const moveRatio = Math.min(moveDistance / distance, 1);
        
        this.x += dx * moveRatio;
        this.y += dy * moveRatio;
        
        // Update facing direction
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'east' : 'west';
        } else {
            this.facing = dy > 0 ? 'south' : 'north';
        }
    }
    
    /**
     * Update AI behavior
     * @param {number} deltaTime - Time since last frame
     */
    updateAI(deltaTime) {
        // Check if should flee
        if (this.hitpoints / this.maxHitpoints < this.retreatThreshold && this.inCombat) {
            this.aiState = 'fleeing';
            this.flee();
            return;
        }
        
        switch (this.aiState) {
            case 'idle':
                this.updateIdleAI(deltaTime);
                break;
                
            case 'wandering':
                if (!this.moving) {
                    this.aiState = 'idle';
                }
                break;
                
            case 'chasing':
                this.updateChaseAI(deltaTime);
                break;
                
            case 'attacking':
                this.updateAttackAI(deltaTime);
                break;
                
            case 'fleeing':
                this.updateFleeAI(deltaTime);
                break;
        }
    }
    
    /**
     * Update idle AI behavior
     * @param {number} deltaTime - Time since last frame
     */
    updateIdleAI(deltaTime) {
        // Check for nearby targets if aggressive
        if (this.aggressive && !this.inCombat) {
            const nearbyTarget = this.findNearbyTarget();
            if (nearbyTarget) {
                this.engageTarget(nearbyTarget);
                return;
            }
        }
        
        // Random wandering
        this.wanderTimer += deltaTime;
        if (this.wanderTimer >= this.wanderInterval) {
            this.wander();
            this.wanderTimer = 0;
            this.wanderInterval = 3 + Math.random() * 3;
        }
    }
    
    /**
     * Update chase AI
     * @param {number} deltaTime - Time since last frame
     */
    updateChaseAI(deltaTime) {
        if (!this.target || !this.target.alive) {
            this.disengage();
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Check if target is out of range
        if (distance > this.aggroRange * 2) {
            this.disengage();
            return;
        }
        
        // Check if in attack range
        if (distance <= this.attackRange) {
            this.aiState = 'attacking';
            this.moving = false;
            return;
        }
        
        // Chase target
        this.moveTowards(this.target.x, this.target.y);
    }
    
    /**
     * Update attack AI
     * @param {number} deltaTime - Time since last frame
     */
    updateAttackAI(deltaTime) {
        if (!this.target || !this.target.alive) {
            this.disengage();
            return;
        }
        
        const distance = this.getDistanceTo(this.target);
        
        // Check if target moved out of range
        if (distance > this.attackRange) {
            this.aiState = 'chasing';
            return;
        }
        
        // Attack based on attack speed
        const timeSinceLastAttack = Date.now() - this.lastAttackTime;
        const attackDelay = (2.4 / this.attackSpeed) * 1000; // Convert to milliseconds
        
        if (timeSinceLastAttack >= attackDelay) {
            this.performAttack();
        }
    }
    
    /**
     * Update flee AI
     * @param {number} deltaTime - Time since last frame
     */
    updateFleeAI(deltaTime) {
        if (!this.moving) {
            // Flee to spawn point
            this.moveTowards(this.spawnX, this.spawnY);
            
            // Check if reached spawn
            const distanceToSpawn = Math.sqrt(
                Math.pow(this.x - this.spawnX, 2) +
                Math.pow(this.y - this.spawnY, 2)
            );
            
            if (distanceToSpawn < 0.5) {
                this.aiState = 'idle';
                this.inCombat = false;
                this.target = null;
                
                // Heal up
                this.hitpoints = this.maxHitpoints;
            }
        }
    }
    
    /**
     * Find nearby target to attack
     * @returns {object|null} Target entity
     */
    findNearbyTarget() {
        // This will be called by CombatSystem with player reference
        // For now, return null
        return null;
    }
    
    /**
     * Engage a target
     * @param {object} target - Target entity
     */
    engageTarget(target) {
        this.target = target;
        this.inCombat = true;
        this.aiState = 'chasing';
        this.moveTowards(target.x, target.y);
        
        // Emit combat start event
        if (window.game) {
            window.game.emit('combat:started', {
                attacker: this,
                target: target
            });
        }
    }
    
    /**
     * Disengage from combat
     */
    disengage() {
        this.target = null;
        this.inCombat = false;
        this.aiState = 'idle';
        this.moving = false;
        
        // Return to spawn if too far
        const distanceToSpawn = Math.sqrt(
            Math.pow(this.x - this.spawnX, 2) +
            Math.pow(this.y - this.spawnY, 2)
        );
        
        if (distanceToSpawn > this.wanderRadius) {
            this.moveTowards(this.spawnX, this.spawnY);
        }
    }
    
    /**
     * Perform an attack
     */
    performAttack() {
        if (!this.target) return;
        
        this.lastAttackTime = Date.now();
        this.animationState = 'attacking';
        
        // Emit attack event (CombatSystem will handle damage calculation)
        if (window.game && window.game.combatSystem) {
            window.game.combatSystem.processAttack(this, this.target);
        }
    }
    
    /**
     * Wander randomly
     */
    wander() {
        // Random position within wander radius of spawn
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.wanderRadius;
        
        const targetX = this.spawnX + Math.cos(angle) * distance;
        const targetY = this.spawnY + Math.sin(angle) * distance;
        
        this.moveTowards(targetX, targetY);
        this.aiState = 'wandering';
    }
    
    /**
     * Flee from target
     */
    flee() {
        // Move towards spawn point
        this.moveTowards(this.spawnX, this.spawnY);
    }
    
    /**
     * Move towards position
     * @param {number} x - Target X
     * @param {number} y - Target Y
     */
    moveTowards(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.moving = true;
    }
    
    /**
     * Get distance to another entity
     * @param {object} entity - Target entity
     * @returns {number} Distance
     */
    getDistanceTo(entity) {
        const dx = entity.x - this.x;
        const dy = entity.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Take damage
     * @param {number} damage - Damage amount
     * @param {object} attacker - Attacking entity
     */
    takeDamage(damage, attacker) {
        if (!this.alive) return;
        
        this.hitpoints = Math.max(0, this.hitpoints - damage);
        
        // Engage attacker if not already in combat
        if (!this.inCombat && this.aggressive) {
            this.engageTarget(attacker);
        }
        
        // Check for death
        if (this.hitpoints <= 0) {
            this.die(attacker);
        }
        
        // Emit damage event
        if (window.game) {
            window.game.emit('combat:damageDealt', {
                attacker: attacker,
                target: this,
                damage: damage,
                position: { x: this.x, y: this.y }
            });
        }
    }
    
    /**
     * Die
     * @param {object} killer - Entity that killed this enemy
     */
    die(killer) {
        this.alive = false;
        this.inCombat = false;
        this.moving = false;
        this.animationState = 'dead';
        
        console.log(`💀 ${this.name} has been defeated!`);
        
        // Emit death event
        if (window.game) {
            window.game.emit('enemy:died', {
                enemy: this,
                killer: killer,
                position: { x: this.x, y: this.y }
            });
        }
        
        // Drop loot (CombatSystem will handle this)
        if (window.game && window.game.combatSystem) {
            window.game.combatSystem.dropLoot(this, killer);
        }
        
        // Start respawn timer
        this.respawning = true;
        this.respawnTimer = 0;
    }
    
    /**
     * Respawn enemy
     */
    respawn() {
        this.alive = true;
        this.respawning = false;
        this.respawnTimer = 0;
        this.hitpoints = this.maxHitpoints;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.targetX = this.spawnX;
        this.targetY = this.spawnY;
        this.moving = false;
        this.aiState = 'idle';
        this.target = null;
        this.inCombat = false;
        this.animationState = 'idle';
        
        console.log(`♻️ ${this.name} has respawned`);
        
        // Emit respawn event
        if (window.game) {
            window.game.emit('enemy:respawned', {
                enemy: this,
                position: { x: this.x, y: this.y }
            });
        }
    }
    
    /**
     * Update animation state
     * @param {number} deltaTime - Time since last frame
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update animation frame based on state
        if (this.animationState === 'attacking') {
            if (this.animationTime >= 0.6) {
                this.animationState = 'idle';
                this.animationTime = 0;
            }
        }
    }
    
    /**
     * Get examine text
     * @returns {string} Examine text
     */
    getExamineText() {
        return `${this.name} - Level ${this.level}`;
    }
    
    /**
     * Serialize enemy data
     * @returns {object} Serialized data
     */
    serialize() {
        return {
            id: this.id,
            enemyType: this.enemyType,
            x: this.x,
            y: this.y,
            spawnX: this.spawnX,
            spawnY: this.spawnY,
            hitpoints: this.hitpoints,
            alive: this.alive,
            respawning: this.respawning,
            respawnTimer: this.respawnTimer
        };
    }
    
    /**
     * Create enemy from serialized data
     * @param {object} data - Serialized data
     * @param {object} config - Enemy configuration
     * @returns {Enemy} Enemy instance
     */
    static deserialize(data, config) {
        const enemy = new Enemy({ ...data, ...config });
        enemy.hitpoints = data.hitpoints;
        enemy.alive = data.alive;
        enemy.respawning = data.respawning;
        enemy.respawnTimer = data.respawnTimer || 0;
        
        return enemy;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Enemy;
}
