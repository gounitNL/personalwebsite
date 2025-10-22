/**
 * CombatSystem.js - Combat Management System
 * 
 * Handles all combat mechanics including damage calculation, hit/miss determination,
 * attack processing, loot generation, and death handling. Integrates with Player,
 * Enemy, SkillsSystem, and InventorySystem.
 * 
 * @class CombatSystem
 */

class CombatSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameConfig = null; // Will be set from GameConfig
        
        // Combat tracking
        this.activeCombats = new Map(); // attacker ID -> combat data
        
        // Attack styles
        this.attackStyles = {
            accurate: { attackBonus: 3, strengthBonus: 0, defenceBonus: 0, xpStyle: 'attack' },
            aggressive: { attackBonus: 0, strengthBonus: 3, defenceBonus: 0, xpStyle: 'strength' },
            defensive: { attackBonus: 0, strengthBonus: 0, defenceBonus: 3, xpStyle: 'defence' },
            controlled: { attackBonus: 1, strengthBonus: 1, defenceBonus: 1, xpStyle: 'shared' }
        };
        
        // Combat constants (RuneScape formulas)
        this.ATTACK_ROLL_MULTIPLIER = 64;
        this.DEFENCE_ROLL_MULTIPLIER = 64;
        this.MAX_HIT_BASE = 1.3;
        this.STRENGTH_BONUS_DIVISOR = 10;
    }
    
    /**
     * Initialize the combat system
     * @param {object} gameConfig - Game configuration object
     */
    init(gameConfig) {
        this.gameConfig = gameConfig;
        console.log('CombatSystem initialized');
    }
    
    /**
     * Process an attack from attacker to target
     * @param {object} attacker - Attacking entity
     * @param {object} target - Target entity
     * @returns {object} Attack result
     */
    processAttack(attacker, target) {
        if (!attacker || !target) {
            console.error('Invalid attacker or target');
            return { hit: false, damage: 0 };
        }
        
        // Determine if attack hits
        const hitRoll = this.calculateHitRoll(attacker, target);
        const hit = hitRoll.hit;
        
        let damage = 0;
        if (hit) {
            // Calculate damage
            damage = this.calculateDamage(attacker, target);
            
            // Apply damage
            if (target.takeDamage) {
                target.takeDamage(damage, attacker);
            } else if (target.combatStats) {
                target.combatStats.hitpoints = Math.max(0, target.combatStats.hitpoints - damage);
                
                if (target.combatStats.hitpoints <= 0) {
                    this.handleDeath(target, attacker);
                }
            }
        }
        
        // Grant XP to attacker if player
        if (attacker.type === 'player' && hit) {
            this.grantCombatXP(attacker, damage, 'controlled');
        }
        
        // Emit combat events for UI
        this.gameEngine.emit('combat:attack', {
            attacker,
            target,
            hit,
            damage,
            position: { x: target.x, y: target.y }
        });
        
        // Emit specific events for damage numbers system
        if (hit) {
            this.gameEngine.emit('combat_hit', {
                attacker,
                target,
                damage
            });
        } else {
            this.gameEngine.emit('combat_miss', {
                attacker,
                target
            });
        }
        
        return { hit, damage, hitRoll: hitRoll.attackRoll, defenceRoll: hitRoll.defenceRoll };
    }
    
    /**
     * Calculate if attack hits using RuneScape formula
     * @param {object} attacker - Attacking entity
     * @param {object} target - Target entity
     * @returns {object} Hit result with rolls
     */
    calculateHitRoll(attacker, target) {
        // Get effective levels
        const attackerLevel = this.getEffectiveAttackLevel(attacker);
        const targetLevel = this.getEffectiveDefenceLevel(target);
        
        // Get equipment bonuses (stub for now, will integrate with EquipmentSystem)
        const attackBonus = this.getAttackBonus(attacker);
        const defenceBonus = this.getDefenceBonus(target);
        
        // Calculate attack roll
        const attackRoll = (attackerLevel + attackBonus) * this.ATTACK_ROLL_MULTIPLIER;
        
        // Calculate defence roll
        const defenceRoll = (targetLevel + defenceBonus) * this.DEFENCE_ROLL_MULTIPLIER;
        
        // Random rolls
        const attackerRoll = Math.floor(Math.random() * attackRoll);
        const defenderRoll = Math.floor(Math.random() * defenceRoll);
        
        // Hit if attack roll > defence roll
        const hit = attackerRoll > defenderRoll;
        
        return {
            hit,
            attackRoll: attackerRoll,
            defenceRoll: defenderRoll,
            attackMax: attackRoll,
            defenceMax: defenceRoll
        };
    }
    
    /**
     * Calculate damage dealt
     * @param {object} attacker - Attacking entity
     * @param {object} target - Target entity
     * @returns {number} Damage amount
     */
    calculateDamage(attacker, target) {
        const maxHit = this.calculateMaxHit(attacker);
        
        // Random damage from 0 to max hit
        const damage = Math.floor(Math.random() * (maxHit + 1));
        
        return damage;
    }
    
    /**
     * Calculate maximum hit
     * @param {object} attacker - Attacking entity
     * @returns {number} Max hit
     */
    calculateMaxHit(attacker) {
        let maxHit;
        
        if (attacker.type === 'player') {
            // Player max hit calculation
            const strengthLevel = attacker.skills?.strength?.level || 1;
            const strengthBonus = this.getStrengthBonus(attacker);
            
            // RuneScape formula: 0.5 + StrengthLevel * (StrengthBonus + 64) / 640
            maxHit = Math.floor(0.5 + strengthLevel * (strengthBonus + 64) / 640);
        } else {
            // Enemy max hit (from config or calculated)
            maxHit = attacker.maxHit || Math.floor(attacker.level / 2) + 1;
        }
        
        return Math.max(1, maxHit);
    }
    
    /**
     * Get effective attack level
     * @param {object} entity - Entity
     * @returns {number} Effective attack level
     */
    getEffectiveAttackLevel(entity) {
        if (entity.type === 'player') {
            return entity.skills?.attack?.level || 1;
        } else {
            return entity.attackLevel || entity.level || 1;
        }
    }
    
    /**
     * Get effective defence level
     * @param {object} entity - Entity
     * @returns {number} Effective defence level
     */
    getEffectiveDefenceLevel(entity) {
        if (entity.type === 'player') {
            return entity.skills?.defence?.level || 1;
        } else {
            return entity.defenceLevel || entity.level || 1;
        }
    }
    
    /**
     * Get attack bonus (equipment)
     * @param {object} entity - Entity
     * @returns {number} Attack bonus
     */
    getAttackBonus(entity) {
        // Integrated with EquipmentSystem (Phase 5)
        if (entity.type === 'player' && this.gameEngine.equipmentSystem) {
            return this.gameEngine.equipmentSystem.getAttackBonus('slash'); // Default to slash
        }
        return 0;
    }
    
    /**
     * Get defence bonus (equipment)
     * @param {object} entity - Entity
     * @returns {number} Defence bonus
     */
    getDefenceBonus(entity) {
        // Integrated with EquipmentSystem (Phase 5)
        if (entity.type === 'player' && this.gameEngine.equipmentSystem) {
            return this.gameEngine.equipmentSystem.getDefenceBonus('slash'); // Default to slash
        }
        return 0;
    }
    
    /**
     * Get strength bonus (equipment)
     * @param {object} entity - Entity
     * @returns {number} Strength bonus
     */
    getStrengthBonus(entity) {
        // Integrated with EquipmentSystem (Phase 5)
        if (entity.type === 'player' && this.gameEngine.equipmentSystem) {
            return this.gameEngine.equipmentSystem.getStrengthBonus();
        }
        return 0;
    }
    
    /**
     * Grant combat XP to player
     * @param {object} player - Player entity
     * @param {number} damage - Damage dealt
     * @param {string} attackStyle - Attack style used
     */
    grantCombatXP(player, damage, attackStyle = 'controlled') {
        // XP is 4 times the damage dealt
        const baseXP = damage * 4;
        
        const style = this.attackStyles[attackStyle] || this.attackStyles.controlled;
        
        if (style.xpStyle === 'shared') {
            // Shared XP: Split between attack, strength, defence
            const xpPerStat = baseXP / 3;
            if (player.addXP) {
                player.addXP('attack', xpPerStat);
                player.addXP('strength', xpPerStat);
                player.addXP('defence', xpPerStat);
            }
        } else {
            // Specific style XP
            if (player.addXP) {
                player.addXP(style.xpStyle, baseXP);
            }
        }
        
        // Always grant hitpoints XP (1/3 of base)
        if (player.addXP) {
            player.addXP('hitpoints', baseXP / 3);
        }
    }
    
    /**
     * Handle entity death
     * @param {object} victim - Dying entity
     * @param {object} killer - Killer entity
     */
    handleDeath(victim, killer) {
        console.log(`💀 ${victim.name || 'Entity'} has died`);
        
        // Generate and drop loot if victim is enemy
        if (victim.type === 'enemy') {
            this.dropLoot(victim, killer);
        }
        
        // Emit death events
        this.gameEngine.emit('combat:death', {
            victim,
            killer,
            position: { x: victim.x, y: victim.y }
        });
        
        this.gameEngine.emit('entity_death', {
            entity: victim,
            killer
        });
        
        // Handle player death
        if (victim.type === 'player') {
            this.handlePlayerDeath(victim);
        }
    }
    
    /**
     * Handle player death
     * @param {object} player - Player entity
     */
    handlePlayerDeath(player) {
        console.log('💀 Player has died!');
        
        // Drop items (can implement item loss mechanics here)
        // For now, respawn with all items
        
        // Respawn player
        setTimeout(() => {
            player.teleportTo(25, 25); // Lumbridge spawn
            player.combatStats.hitpoints = player.combatStats.maxHitpoints;
            player.inCombat = false;
            player.currentEnemy = null;
            
            this.gameEngine.emit('player:respawned', { player });
            
            if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.showNotification('Oh dear, you are dead!', 'error');
            }
        }, 2000);
    }
    
    /**
     * Generate and drop loot from enemy
     * @param {object} enemy - Enemy entity
     * @param {object} killer - Killer entity (player)
     */
    dropLoot(enemy, killer) {
        if (!enemy.lootTable && !enemy.alwaysDrops) {
            console.log('No loot configured for', enemy.name);
            return;
        }
        
        const droppedItems = [];
        
        // Always drops
        if (enemy.alwaysDrops && enemy.alwaysDrops.length > 0) {
            for (const drop of enemy.alwaysDrops) {
                droppedItems.push({
                    itemId: drop.id || drop.itemId,
                    quantity: drop.quantity || 1,
                    guaranteed: true
                });
            }
        }
        
        // Loot table rolls
        if (enemy.lootTable && enemy.lootTable.length > 0) {
            for (const loot of enemy.lootTable) {
                const roll = Math.random();
                const chance = loot.chance || 0.5;
                
                if (roll <= chance) {
                    const minQty = loot.minQuantity || loot.quantity || 1;
                    const maxQty = loot.maxQuantity || loot.quantity || 1;
                    const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
                    
                    droppedItems.push({
                        itemId: loot.id || loot.itemId,
                        quantity,
                        chance: chance
                    });
                }
            }
        }
        
        // Grant items to killer if player
        if (killer && killer.type === 'player' && droppedItems.length > 0) {
            this.grantLootToPlayer(killer, droppedItems, enemy);
        }
        
        console.log(`🎁 ${enemy.name} dropped ${droppedItems.length} items`);
        
        // Emit loot event
        this.gameEngine.emit('combat:lootDropped', {
            enemy,
            killer,
            loot: droppedItems,
            position: { x: enemy.x, y: enemy.y }
        });
        
        return droppedItems;
    }
    
    /**
     * Grant loot items to player
     * @param {object} player - Player entity
     * @param {array} items - Array of item drops
     * @param {object} enemy - Enemy that dropped loot
     */
    grantLootToPlayer(player, items, enemy) {
        for (const drop of items) {
            // Get item config
            const itemConfig = this.gameConfig?.items?.[drop.itemId];
            
            if (!itemConfig) {
                console.warn('Item not found:', drop.itemId);
                continue;
            }
            
            // Add to inventory
            if (player.addToInventory) {
                const added = player.addToInventory(itemConfig, drop.quantity);
                
                if (added) {
                    // Show notification
                    if (this.gameEngine.uiManager) {
                        this.gameEngine.uiManager.showNotification(
                            `Received ${drop.quantity}x ${itemConfig.name}`,
                            'success'
                        );
                    }
                }
            } else if (this.gameEngine.inventorySystem) {
                // Fallback to inventory system
                const result = this.gameEngine.inventorySystem.addItem(drop.itemId, drop.quantity);
                
                if (result.success && this.gameEngine.uiManager) {
                    this.gameEngine.uiManager.showNotification(
                        `Received ${drop.quantity}x ${itemConfig.name}`,
                        'success'
                    );
                }
            }
        }
    }
    
    /**
     * Check if entity can attack target
     * @param {object} attacker - Attacking entity
     * @param {object} target - Target entity
     * @returns {boolean} Can attack
     */
    canAttack(attacker, target) {
        if (!attacker || !target) return false;
        if (!target.alive && target.type === 'enemy') return false;
        if (target.combatStats?.hitpoints <= 0 && target.type === 'player') return false;
        
        // Check distance
        const dx = target.x - attacker.x;
        const dy = target.y - attacker.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const attackRange = attacker.attackRange || 1;
        
        return distance <= attackRange;
    }
    
    /**
     * Get combat stats for entity
     * @param {object} entity - Entity
     * @returns {object} Combat stats
     */
    getCombatStats(entity) {
        if (entity.type === 'player') {
            return {
                attack: entity.skills?.attack?.level || 1,
                strength: entity.skills?.strength?.level || 1,
                defence: entity.skills?.defence?.level || 1,
                hitpoints: entity.combatStats?.hitpoints || 10,
                maxHitpoints: entity.combatStats?.maxHitpoints || 10
            };
        } else {
            return {
                attack: entity.attackLevel || entity.level || 1,
                strength: entity.strengthLevel || entity.level || 1,
                defence: entity.defenceLevel || entity.level || 1,
                hitpoints: entity.hitpoints || 10,
                maxHitpoints: enemy.maxHitpoints || 10
            };
        }
    }
    
    /**
     * Update combat system
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // Update active combats (future: multi-combat tracking)
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatSystem;
}
