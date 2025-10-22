/**
 * MyScape Enhanced - Game Configuration
 * All game data for easy modification and expansion
 */

const GameConfig = {
    // ==================== SKILLS CONFIGURATION ====================
    skills: {
        // Combat Skills
        attack: { name: 'Attack', icon: '⚔️', category: 'combat' },
        strength: { name: 'Strength', icon: '💪', category: 'combat' },
        defence: { name: 'Defence', icon: '🛡️', category: 'combat' },
        hitpoints: { name: 'Hitpoints', icon: '❤️', category: 'combat', startLevel: 10 },
        ranged: { name: 'Ranged', icon: '🏹', category: 'combat' },
        magic: { name: 'Magic', icon: '✨', category: 'combat' },
        prayer: { name: 'Prayer', icon: '🙏', category: 'combat' },
        
        // Gathering Skills
        mining: { name: 'Mining', icon: '⛏️', category: 'gathering' },
        woodcutting: { name: 'Woodcutting', icon: '🪓', category: 'gathering' },
        fishing: { name: 'Fishing', icon: '🎣', category: 'gathering' },
        
        // Production Skills
        smithing: { name: 'Smithing', icon: '🔨', category: 'production' },
        cooking: { name: 'Cooking', icon: '🍳', category: 'production' },
        crafting: { name: 'Crafting', icon: '🧵', category: 'production' },
        firemaking: { name: 'Firemaking', icon: '🔥', category: 'production' },
        
        // Support Skills
        agility: { name: 'Agility', icon: '🏃', category: 'support' }
    },

    // XP Table for levels 1-99 (RuneScape formula)
    getXPForLevel(level) {
        let xp = 0;
        for (let i = 1; i < level; i++) {
            xp += Math.floor(i + 300 * Math.pow(2, i / 7));
        }
        return Math.floor(xp / 4);
    },

    // ==================== ITEMS CONFIGURATION ====================
    items: {
        // Ores
        'copper_ore': { name: 'Copper Ore', icon: '🟤', stackable: true, value: 5 },
        'tin_ore': { name: 'Tin Ore', icon: '⚪', stackable: true, value: 5 },
        'iron_ore': { name: 'Iron Ore', icon: '⚫', stackable: true, value: 20 },
        'coal': { name: 'Coal', icon: '⬛', stackable: true, value: 50 },
        'gold_ore': { name: 'Gold Ore', icon: '🟡', stackable: true, value: 100 },
        'mithril_ore': { name: 'Mithril Ore', icon: '🔵', stackable: true, value: 150 },
        'adamant_ore': { name: 'Adamantite Ore', icon: '🟢', stackable: true, value: 400 },
        'rune_ore': { name: 'Runite Ore', icon: '🔷', stackable: true, value: 1000 },

        // Bars
        'bronze_bar': { name: 'Bronze Bar', icon: '🟫', stackable: true, value: 15 },
        'iron_bar': { name: 'Iron Bar', icon: '⬛', stackable: true, value: 50 },
        'steel_bar': { name: 'Steel Bar', icon: '⚫', stackable: true, value: 100 },
        'mithril_bar': { name: 'Mithril Bar', icon: '🔵', stackable: true, value: 300 },
        'adamant_bar': { name: 'Adamant Bar', icon: '🟢', stackable: true, value: 800 },
        'rune_bar': { name: 'Rune Bar', icon: '🔷', stackable: true, value: 2000 },

        // Logs
        'logs': { name: 'Logs', icon: '🪵', stackable: true, value: 5 },
        'oak_logs': { name: 'Oak Logs', icon: '🌰', stackable: true, value: 15 },
        'willow_logs': { name: 'Willow Logs', icon: '🌿', stackable: true, value: 30 },
        'maple_logs': { name: 'Maple Logs', icon: '🍁', stackable: true, value: 60 },
        'yew_logs': { name: 'Yew Logs', icon: '🌲', stackable: true, value: 150 },
        'magic_logs': { name: 'Magic Logs', icon: '✨', stackable: true, value: 500 },

        // Fish
        'raw_shrimp': { name: 'Raw Shrimp', icon: '🦐', stackable: true, value: 3 },
        'cooked_shrimp': { name: 'Cooked Shrimp', icon: '🍤', stackable: true, value: 5, heals: 3 },
        'raw_trout': { name: 'Raw Trout', icon: '🐟', stackable: true, value: 20 },
        'cooked_trout': { name: 'Cooked Trout', icon: '🍣', stackable: true, value: 30, heals: 7 },
        'raw_salmon': { name: 'Raw Salmon', icon: '🐠', stackable: true, value: 30 },
        'cooked_salmon': { name: 'Cooked Salmon', icon: '🍱', stackable: true, value: 45, heals: 9 },
        'raw_lobster': { name: 'Raw Lobster', icon: '🦞', stackable: true, value: 100 },
        'cooked_lobster': { name: 'Cooked Lobster', icon: '🦞', stackable: true, value: 150, heals: 12 },
        'raw_shark': { name: 'Raw Shark', icon: '🦈', stackable: true, value: 400 },
        'cooked_shark': { name: 'Cooked Shark', icon: '🦈', stackable: true, value: 600, heals: 20 },

        // Weapons - Swords
        'bronze_sword': { name: 'Bronze Sword', icon: '🗡️', type: 'weapon', slot: 'weapon', tier: 1, attackBonus: 4, strengthBonus: 3, value: 50, requirements: { attack: 1 } },
        'iron_sword': { name: 'Iron Sword', icon: '⚔️', type: 'weapon', slot: 'weapon', tier: 2, attackBonus: 10, strengthBonus: 8, value: 200, requirements: { attack: 10 } },
        'steel_sword': { name: 'Steel Sword', icon: '🗡️', type: 'weapon', slot: 'weapon', tier: 3, attackBonus: 17, strengthBonus: 15, value: 500, requirements: { attack: 20 } },
        'mithril_sword': { name: 'Mithril Sword', icon: '⚔️', type: 'weapon', slot: 'weapon', tier: 4, attackBonus: 25, strengthBonus: 23, value: 1500, requirements: { attack: 30 } },
        'adamant_sword': { name: 'Adamant Sword', icon: '🗡️', type: 'weapon', slot: 'weapon', tier: 5, attackBonus: 38, strengthBonus: 36, value: 5000, requirements: { attack: 40 } },
        'rune_sword': { name: 'Rune Sword', icon: '⚔️', type: 'weapon', slot: 'weapon', tier: 6, attackBonus: 55, strengthBonus: 53, value: 20000, requirements: { attack: 50 } },
        'dragon_sword': { name: 'Dragon Sword', icon: '🐉', type: 'weapon', slot: 'weapon', tier: 7, attackBonus: 75, strengthBonus: 73, value: 100000, requirements: { attack: 60 } },

        // Armor - Helmets
        'bronze_helmet': { name: 'Bronze Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 1, defenceBonus: 2, value: 30, requirements: { defence: 1 } },
        'iron_helmet': { name: 'Iron Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 2, defenceBonus: 5, value: 150, requirements: { defence: 10 } },
        'steel_helmet': { name: 'Steel Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 3, defenceBonus: 9, value: 400, requirements: { defence: 20 } },
        'mithril_helmet': { name: 'Mithril Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 4, defenceBonus: 14, value: 1200, requirements: { defence: 30 } },
        'adamant_helmet': { name: 'Adamant Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 5, defenceBonus: 21, value: 4000, requirements: { defence: 40 } },
        'rune_helmet': { name: 'Rune Helmet', icon: '⛑️', type: 'armor', slot: 'head', tier: 6, defenceBonus: 30, value: 15000, requirements: { defence: 50 } },

        // Armor - Platebody
        'bronze_platebody': { name: 'Bronze Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 1, defenceBonus: 5, value: 100, requirements: { defence: 1 } },
        'iron_platebody': { name: 'Iron Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 2, defenceBonus: 12, value: 500, requirements: { defence: 10 } },
        'steel_platebody': { name: 'Steel Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 3, defenceBonus: 22, value: 1200, requirements: { defence: 20 } },
        'mithril_platebody': { name: 'Mithril Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 4, defenceBonus: 33, value: 3500, requirements: { defence: 30 } },
        'adamant_platebody': { name: 'Adamant Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 5, defenceBonus: 48, value: 12000, requirements: { defence: 40 } },
        'rune_platebody': { name: 'Rune Platebody', icon: '🦺', type: 'armor', slot: 'body', tier: 6, defenceBonus: 70, value: 50000, requirements: { defence: 50 } },

        // Armor - Platelegs
        'bronze_platelegs': { name: 'Bronze Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 1, defenceBonus: 3, value: 60, requirements: { defence: 1 } },
        'iron_platelegs': { name: 'Iron Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 2, defenceBonus: 8, value: 300, requirements: { defence: 10 } },
        'steel_platelegs': { name: 'Steel Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 3, defenceBonus: 15, value: 800, requirements: { defence: 20 } },
        'mithril_platelegs': { name: 'Mithril Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 4, defenceBonus: 22, value: 2200, requirements: { defence: 30 } },
        'adamant_platelegs': { name: 'Adamant Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 5, defenceBonus: 33, value: 8000, requirements: { defence: 40 } },
        'rune_platelegs': { name: 'Rune Platelegs', icon: '👖', type: 'armor', slot: 'legs', tier: 6, defenceBonus: 48, value: 35000, requirements: { defence: 50 } },

        // Shields
        'wooden_shield': { name: 'Wooden Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 1, defenceBonus: 3, value: 20, requirements: { defence: 1 } },
        'bronze_shield': { name: 'Bronze Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 1, defenceBonus: 5, value: 40, requirements: { defence: 1 } },
        'iron_shield': { name: 'Iron Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 2, defenceBonus: 10, value: 200, requirements: { defence: 10 } },
        'steel_shield': { name: 'Steel Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 3, defenceBonus: 17, value: 500, requirements: { defence: 20 } },
        'mithril_shield': { name: 'Mithril Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 4, defenceBonus: 25, value: 1500, requirements: { defence: 30 } },
        'adamant_shield': { name: 'Adamant Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 5, defenceBonus: 37, value: 5000, requirements: { defence: 40 } },
        'rune_shield': { name: 'Rune Shield', icon: '🛡️', type: 'armor', slot: 'shield', tier: 6, defenceBonus: 55, value: 25000, requirements: { defence: 50 } },

        // Tools
        'bronze_pickaxe': { name: 'Bronze Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 1, value: 50, requirements: { mining: 1 } },
        'iron_pickaxe': { name: 'Iron Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 2, value: 200, requirements: { mining: 10 } },
        'steel_pickaxe': { name: 'Steel Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 3, value: 500, requirements: { mining: 20 } },
        'mithril_pickaxe': { name: 'Mithril Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 4, value: 1500, requirements: { mining: 30 } },
        'adamant_pickaxe': { name: 'Adamant Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 5, value: 5000, requirements: { mining: 40 } },
        'rune_pickaxe': { name: 'Rune Pickaxe', icon: '⛏️', type: 'tool', toolType: 'pickaxe', tier: 6, value: 20000, requirements: { mining: 50 } },

        'bronze_axe': { name: 'Bronze Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 1, value: 50, requirements: { woodcutting: 1 } },
        'iron_axe': { name: 'Iron Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 2, value: 200, requirements: { woodcutting: 10 } },
        'steel_axe': { name: 'Steel Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 3, value: 500, requirements: { woodcutting: 20 } },
        'mithril_axe': { name: 'Mithril Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 4, value: 1500, requirements: { woodcutting: 30 } },
        'adamant_axe': { name: 'Adamant Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 5, value: 5000, requirements: { woodcutting: 40 } },
        'rune_axe': { name: 'Rune Axe', icon: '🪓', type: 'tool', toolType: 'axe', tier: 6, value: 20000, requirements: { woodcutting: 50 } },

        // Currency
        'coins': { name: 'Coins', icon: '💰', stackable: true, value: 1 }
    },

    // ==================== ENEMIES CONFIGURATION ====================
    enemies: {
        'chicken': { name: 'Chicken', level: 1, hp: 10, maxHit: 1, attackSpeed: 3, xpReward: 10, loot: [{ item: 'raw_chicken', chance: 0.8 }, { item: 'coins', amount: [1, 5], chance: 0.3 }], color: '#FFEB3B', aggressive: false },
        'goblin': { name: 'Goblin', level: 2, hp: 20, maxHit: 2, attackSpeed: 3, xpReward: 20, loot: [{ item: 'coins', amount: [5, 15], chance: 0.9 }], color: '#4CAF50', aggressive: true },
        'cow': { name: 'Cow', level: 3, hp: 25, maxHit: 2, attackSpeed: 3, xpReward: 25, loot: [{ item: 'raw_beef', chance: 0.9 }, { item: 'coins', amount: [1, 8], chance: 0.4 }], color: '#795548', aggressive: false },
        'rat': { name: 'Rat', level: 1, hp: 8, maxHit: 1, attackSpeed: 2, xpReward: 8, loot: [{ item: 'coins', amount: [1, 3], chance: 0.2 }], color: '#9E9E9E', aggressive: false },
        'guard': { name: 'Guard', level: 15, hp: 100, maxHit: 8, attackSpeed: 4, xpReward: 50, loot: [{ item: 'bronze_sword', chance: 0.1 }, { item: 'coins', amount: [20, 50], chance: 0.9 }], color: '#2196F3', aggressive: false },
        'giant_spider': { name: 'Giant Spider', level: 8, hp: 50, maxHit: 5, attackSpeed: 3, xpReward: 35, loot: [{ item: 'coins', amount: [10, 25], chance: 0.7 }], color: '#9C27B0', aggressive: true },
        'dark_wizard': { name: 'Dark Wizard', level: 12, hp: 80, maxHit: 10, attackSpeed: 5, xpReward: 60, loot: [{ item: 'coins', amount: [30, 80], chance: 0.9 }, { item: 'air_rune', amount: [5, 10], chance: 0.5 }], color: '#673AB7', aggressive: true },
        'skeleton': { name: 'Skeleton', level: 10, hp: 70, maxHit: 7, attackSpeed: 4, xpReward: 45, loot: [{ item: 'bones', chance: 1.0 }, { item: 'coins', amount: [15, 40], chance: 0.6 }], color: '#BDBDBD', aggressive: true },
        'hill_giant': { name: 'Hill Giant', level: 20, hp: 150, maxHit: 12, attackSpeed: 5, xpReward: 100, loot: [{ item: 'big_bones', chance: 1.0 }, { item: 'coins', amount: [50, 150], chance: 0.8 }, { item: 'steel_sword', chance: 0.05 }], color: '#8D6E63', aggressive: true },
        'moss_giant': { name: 'Moss Giant', level: 25, hp: 200, maxHit: 15, attackSpeed: 5, xpReward: 150, loot: [{ item: 'big_bones', chance: 1.0 }, { item: 'coins', amount: [80, 200], chance: 0.8 }, { item: 'mithril_ore', chance: 0.1 }], color: '#558B2F', aggressive: true },
        'lesser_demon': { name: 'Lesser Demon', level: 35, hp: 300, maxHit: 20, attackSpeed: 4, xpReward: 250, loot: [{ item: 'coins', amount: [150, 400], chance: 0.9 }, { item: 'adamant_ore', chance: 0.08 }, { item: 'rune_essence', chance: 0.3 }], color: '#D32F2F', aggressive: true },
        'dragon': { name: 'Green Dragon', level: 50, hp: 500, maxHit: 30, attackSpeed: 4, xpReward: 500, loot: [{ item: 'dragon_bones', chance: 1.0 }, { item: 'coins', amount: [500, 1500], chance: 0.95 }, { item: 'rune_ore', chance: 0.05 }, { item: 'dragon_sword', chance: 0.01 }], color: '#388E3C', aggressive: true }
    },

    // ==================== RESOURCES CONFIGURATION ====================
    resources: {
        // Mining Rocks
        'copper_rock': { name: 'Copper Rock', type: 'rock', resource: 'copper_ore', xp: 17.5, levelReq: 1, respawnTime: 2000, color: '#D2691E' },
        'tin_rock': { name: 'Tin Rock', type: 'rock', resource: 'tin_ore', xp: 17.5, levelReq: 1, respawnTime: 2000, color: '#C0C0C0' },
        'iron_rock': { name: 'Iron Rock', type: 'rock', resource: 'iron_ore', xp: 35, levelReq: 15, respawnTime: 3000, color: '#696969' },
        'coal_rock': { name: 'Coal Rock', type: 'rock', resource: 'coal', xp: 50, levelReq: 30, respawnTime: 4000, color: '#2F4F4F' },
        'gold_rock': { name: 'Gold Rock', type: 'rock', resource: 'gold_ore', xp: 65, levelReq: 40, respawnTime: 5000, color: '#FFD700' },
        'mithril_rock': { name: 'Mithril Rock', type: 'rock', resource: 'mithril_ore', xp: 80, levelReq: 55, respawnTime: 6000, color: '#4169E1' },
        'adamant_rock': { name: 'Adamantite Rock', type: 'rock', resource: 'adamant_ore', xp: 95, levelReq: 70, respawnTime: 8000, color: '#228B22' },
        'rune_rock': { name: 'Runite Rock', type: 'rock', resource: 'rune_ore', xp: 125, levelReq: 85, respawnTime: 12000, color: '#00CED1' },

        // Trees
        'tree': { name: 'Tree', type: 'tree', resource: 'logs', xp: 25, levelReq: 1, respawnTime: 4000, color: '#228B22' },
        'oak_tree': { name: 'Oak Tree', type: 'tree', resource: 'oak_logs', xp: 37.5, levelReq: 15, respawnTime: 5000, color: '#8B4513' },
        'willow_tree': { name: 'Willow Tree', type: 'tree', resource: 'willow_logs', xp: 67.5, levelReq: 30, respawnTime: 6000, color: '#9ACD32' },
        'maple_tree': { name: 'Maple Tree', type: 'tree', resource: 'maple_logs', xp: 100, levelReq: 45, respawnTime: 7000, color: '#FF8C00' },
        'yew_tree': { name: 'Yew Tree', type: 'tree', resource: 'yew_logs', xp: 175, levelReq: 60, respawnTime: 10000, color: '#556B2F' },
        'magic_tree': { name: 'Magic Tree', type: 'tree', resource: 'magic_logs', xp: 250, levelReq: 75, respawnTime: 15000, color: '#8B008B' },

        // Fishing Spots
        'shrimp_spot': { name: 'Fishing Spot (Net)', type: 'fishing', resource: 'raw_shrimp', xp: 10, levelReq: 1, respawnTime: 0, color: '#1E90FF' },
        'trout_spot': { name: 'Fishing Spot (Fly)', type: 'fishing', resource: 'raw_trout', xp: 50, levelReq: 20, respawnTime: 0, color: '#1E90FF' },
        'salmon_spot': { name: 'Fishing Spot (Fly)', type: 'fishing', resource: 'raw_salmon', xp: 70, levelReq: 30, respawnTime: 0, color: '#1E90FF' },
        'lobster_spot': { name: 'Fishing Spot (Cage)', type: 'fishing', resource: 'raw_lobster', xp: 90, levelReq: 40, respawnTime: 0, color: '#1E90FF' },
        'shark_spot': { name: 'Fishing Spot (Harpoon)', type: 'fishing', resource: 'raw_shark', xp: 110, levelReq: 76, respawnTime: 0, color: '#1E90FF' }
    },

    // ==================== NPC CONFIGURATION ====================
    npcs: {
        'shop_keeper': { name: 'Shop Keeper', dialogue: ['Welcome to my shop!', 'Browse my wares!'], actions: ['Talk-to', 'Trade', 'Examine'], shop: 'general_store' },
        'weapon_merchant': { name: 'Weapon Merchant', dialogue: ['Looking for weapons?', 'I sell the finest blades!'], actions: ['Talk-to', 'Trade', 'Examine'], shop: 'weapon_shop' },
        'armor_merchant': { name: 'Armor Merchant', dialogue: ['Need protection?', 'Check out my armor!'], actions: ['Talk-to', 'Trade', 'Examine'], shop: 'armor_shop' },
        'banker': { name: 'Banker', dialogue: ['Good day!', 'Would you like to access your bank?'], actions: ['Talk-to', 'Bank', 'Examine'], isBank: true },
        'quest_giver': { name: 'Quest Giver', dialogue: ['I have tasks for brave adventurers!'], actions: ['Talk-to', 'Quest', 'Examine'], hasQuest: true },
        'skill_master': { name: 'Skill Master', dialogue: ['Train your skills here!'], actions: ['Talk-to', 'Train', 'Examine'] },
        'fisherman': { name: 'Fisherman', dialogue: ['The fish are biting today!', 'Try fishing over there.'], actions: ['Talk-to', 'Examine'] },
        'miner': { name: 'Miner', dialogue: ['These rocks are rich with ore!', 'Be careful mining deep.'], actions: ['Talk-to', 'Examine'] },
        'lumberjack': { name: 'Lumberjack', dialogue: ['Fine trees around here!', 'Chop carefully.'], actions: ['Talk-to', 'Examine'] }
    },

    // ==================== QUEST CONFIGURATION ====================
    quests: {
        'tutorial_quest': {
            name: 'Getting Started',
            description: 'Learn the basics of MyScape',
            difficulty: 'Beginner',
            requirements: {},
            stages: [
                { id: 0, description: 'Talk to the Quest Giver', type: 'talk_npc', target: 'quest_giver' },
                { id: 1, description: 'Mine 5 copper ore', type: 'gather', resource: 'copper_ore', amount: 5 },
                { id: 2, description: 'Return to Quest Giver', type: 'talk_npc', target: 'quest_giver' }
            ],
            rewards: {
                xp: { mining: 100 },
                items: [{ item: 'bronze_pickaxe', amount: 1 }],
                coins: 50,
                questPoints: 1
            }
        },
        'warriors_path': {
            name: 'Warrior\'s Path',
            description: 'Prove yourself in combat',
            difficulty: 'Intermediate',
            requirements: { attack: 10 },
            stages: [
                { id: 0, description: 'Talk to the Warrior Trainer', type: 'talk_npc', target: 'warrior_trainer' },
                { id: 1, description: 'Defeat 10 goblins', type: 'kill', enemy: 'goblin', amount: 10 },
                { id: 2, description: 'Equip an iron sword', type: 'equip', item: 'iron_sword' },
                { id: 3, description: 'Return to Warrior Trainer', type: 'talk_npc', target: 'warrior_trainer' }
            ],
            rewards: {
                xp: { attack: 500, strength: 500, defence: 500 },
                items: [{ item: 'iron_platebody', amount: 1 }],
                coins: 200,
                questPoints: 2
            }
        },
        'master_gatherer': {
            name: 'Master Gatherer',
            description: 'Become a skilled resource gatherer',
            difficulty: 'Advanced',
            requirements: { mining: 20, woodcutting: 20, fishing: 20 },
            stages: [
                { id: 0, description: 'Talk to the Skill Master', type: 'talk_npc', target: 'skill_master' },
                { id: 1, description: 'Mine 10 iron ore', type: 'gather', resource: 'iron_ore', amount: 10 },
                { id: 2, description: 'Chop 10 oak logs', type: 'gather', resource: 'oak_logs', amount: 10 },
                { id: 3, description: 'Catch 10 trout', type: 'gather', resource: 'raw_trout', amount: 10 },
                { id: 4, description: 'Return to Skill Master', type: 'talk_npc', target: 'skill_master' }
            ],
            rewards: {
                xp: { mining: 1000, woodcutting: 1000, fishing: 1000 },
                items: [{ item: 'steel_pickaxe', amount: 1 }, { item: 'steel_axe', amount: 1 }],
                coins: 500,
                questPoints: 3
            }
        }
    },

    // ==================== WORLD AREAS CONFIGURATION ====================
    areas: {
        'lumbridge': {
            name: 'Lumbridge',
            description: 'A peaceful starting town',
            size: { width: 50, height: 50 },
            spawnPoint: { x: 25, y: 25 },
            connections: [
                { area: 'varrock', position: { x: 49, y: 25 }, direction: 'east' },
                { area: 'mining_site', position: { x: 25, y: 0 }, direction: 'north' }
            ],
            npcs: ['shop_keeper', 'banker', 'quest_giver'],
            resources: ['tree', 'copper_rock', 'tin_rock'],
            enemies: ['chicken', 'rat', 'cow']
        },
        'varrock': {
            name: 'Varrock',
            description: 'A bustling city',
            size: { width: 60, height: 60 },
            spawnPoint: { x: 30, y: 30 },
            connections: [
                { area: 'lumbridge', position: { x: 0, y: 30 }, direction: 'west' },
                { area: 'wilderness', position: { x: 30, y: 0 }, direction: 'north' }
            ],
            npcs: ['weapon_merchant', 'armor_merchant', 'banker', 'skill_master'],
            resources: ['oak_tree', 'iron_rock'],
            enemies: ['guard', 'goblin']
        },
        'mining_site': {
            name: 'Mining Site',
            description: 'Rich with minerals',
            size: { width: 40, height: 40 },
            spawnPoint: { x: 20, y: 35 },
            connections: [
                { area: 'lumbridge', position: { x: 20, y: 39 }, direction: 'south' }
            ],
            npcs: ['miner'],
            resources: ['copper_rock', 'tin_rock', 'iron_rock', 'coal_rock', 'mithril_rock', 'adamant_rock'],
            enemies: ['goblin', 'giant_spider']
        },
        'forest': {
            name: 'Deep Forest',
            description: 'Ancient woods',
            size: { width: 50, height: 50 },
            spawnPoint: { x: 25, y: 45 },
            connections: [
                { area: 'lumbridge', position: { x: 0, y: 25 }, direction: 'east' }
            ],
            npcs: ['lumberjack'],
            resources: ['tree', 'oak_tree', 'willow_tree', 'maple_tree', 'yew_tree'],
            enemies: ['giant_spider', 'skeleton']
        },
        'wilderness': {
            name: 'Wilderness',
            description: 'Dangerous lands with great rewards',
            size: { width: 70, height: 70 },
            spawnPoint: { x: 35, y: 65 },
            connections: [
                { area: 'varrock', position: { x: 35, y: 69 }, direction: 'south' }
            ],
            npcs: [],
            resources: ['rune_rock', 'magic_tree'],
            enemies: ['dark_wizard', 'skeleton', 'hill_giant', 'moss_giant', 'lesser_demon', 'dragon']
        }
    },

    // ==================== SHOPS CONFIGURATION ====================
    shops: {
        'general_store': {
            name: 'General Store',
            items: [
                { item: 'bronze_pickaxe', stock: 5, price: 50 },
                { item: 'bronze_axe', stock: 5, price: 50 },
                { item: 'bronze_sword', stock: 3, price: 50 },
                { item: 'wooden_shield', stock: 10, price: 20 },
                { item: 'raw_shrimp', stock: 20, price: 5 },
                { item: 'cooked_shrimp', stock: 15, price: 8 }
            ]
        },
        'weapon_shop': {
            name: 'Weapon Shop',
            items: [
                { item: 'bronze_sword', stock: 10, price: 50 },
                { item: 'iron_sword', stock: 5, price: 200 },
                { item: 'steel_sword', stock: 3, price: 500 },
                { item: 'mithril_sword', stock: 2, price: 1500 }
            ]
        },
        'armor_shop': {
            name: 'Armor Shop',
            items: [
                { item: 'bronze_helmet', stock: 10, price: 30 },
                { item: 'bronze_platebody', stock: 10, price: 100 },
                { item: 'bronze_platelegs', stock: 10, price: 60 },
                { item: 'iron_helmet', stock: 5, price: 150 },
                { item: 'iron_platebody', stock: 5, price: 500 },
                { item: 'iron_platelegs', stock: 5, price: 300 }
            ]
        }
    }
};

// Make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
