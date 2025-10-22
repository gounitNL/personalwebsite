# RuneScape-Style Game Example

## Overview
This is a comprehensive example of a game built with RuneScape's classic aesthetic and core gameplay mechanics. The game is built using vanilla HTML5, CSS3, and JavaScript with a Canvas-based rendering system.

## Architecture

### 1. **Game Class Structure**
The main `Game` class manages all game systems:

```javascript
class Game {
    constructor() {
        this.canvas      // HTML5 Canvas element
        this.ctx         // 2D rendering context
        this.player      // Player character object
        this.entities    // Array of game entities (NPCs, resources, enemies)
        this.inventory   // Player inventory (28 slots like RuneScape)
        this.skills      // Skills system (XP, levels)
        this.camera      // Camera system (not yet implemented)
    }
}
```

### 2. **Core Systems**

#### **Player System**
```javascript
player = {
    x, y           // Position
    width, height  // Dimensions
    speed          // Movement speed
    targetX, targetY  // Click-to-move target
    isMoving       // Movement state
    action         // Current action being performed
}
```

#### **Entity System**
Each entity (rock, tree, NPC, enemy) is an object with:
```javascript
entity = {
    type           // 'rock', 'tree', 'npc', 'enemy'
    x, y           // Position
    width, height  // Dimensions
    color          // Render color
    resource       // What it gives when harvested
    respawnTime    // Depletion/respawn mechanic
    // Type-specific properties...
}
```

#### **Skills System (RuneScape-style)**
```javascript
skills = {
    skillName: {
        level: 1,          // Current level
        xp: 0,             // Current XP
        maxXp: 83          // XP needed for next level
    }
}
```

**XP Calculation:**
- Each action gives XP (mining gives 17.5 XP, attacking gives 1.33 XP)
- Level up formula: `newMaxXP = currentMaxXP * 1.15` (exponential growth)
- XP resets after level up, remainder carries over

#### **Inventory System**
- 28 slots (classic RuneScape inventory size)
- Items stack automatically
- Each item has: name, quantity, icon
- Full inventory prevents item pickup

### 3. **Interaction Systems**

#### **Click-to-Move**
```javascript
canvas.addEventListener('click', (e) => {
    // Convert mouse coordinates to canvas coordinates
    // Set player.targetX, player.targetY
    // Enable movement
});
```

Movement is linear interpolation:
```javascript
dx = targetX - currentX
dy = targetY - currentY
distance = sqrt(dx² + dy²)
moveX = (dx / distance) * speed
moveY = (dy / distance) * speed
```

#### **Right-Click Context Menu**
RuneScape's signature interaction system:
```javascript
// Detect entity at click position
// Show context menu with available actions
// Actions depend on entity type:
//   - Rock: "Mine Rock", "Examine"
//   - Tree: "Chop Tree", "Examine"
//   - NPC: "Talk-to", "Trade", "Examine"
//   - Enemy: "Attack", "Examine"
```

#### **Action System**
```javascript
performAction(entity, actionType) {
    // Move player to entity
    // Store action for execution when player reaches target
    // Execute action on arrival
}
```

### 4. **Resource Gathering**

#### **Mining Example**
```javascript
mineRock(rock) {
    if (rock.respawnTime > 0) return; // Already depleted
    
    // Success chance (70%)
    if (Math.random() > 0.3) {
        addItemToInventory('ore', 1);
        addSkillXP('mining', 17.5);
        rock.respawnTime = 3000; // 3 second respawn
    }
}
```

#### **Respawn Mechanic**
```javascript
updateEntities() {
    entities.forEach(entity => {
        if (entity.respawnTime > 0) {
            entity.respawnTime -= 16; // Decrease each frame (~60fps)
        }
    });
}
```

### 5. **Combat System**

#### **Basic Combat**
```javascript
attackEnemy(enemy) {
    damage = random(1, 5);  // Random damage
    enemy.hp -= damage;
    
    addSkillXP('hitpoints', 1.33);  // Gain HP XP
    
    if (enemy.hp <= 0) {
        // Enemy defeated
        // Drop loot (coins)
        // Respawn enemy
    }
}
```

### 6. **Rendering System**

#### **Canvas Rendering Pipeline**
```javascript
render() {
    // 1. Clear canvas
    ctx.fillRect(0, 0, width, height);
    
    // 2. Draw grid (tile-based)
    drawGrid(32); // 32px tiles
    
    // 3. Draw entities (resources, NPCs, enemies)
    entities.forEach(drawEntity);
    
    // 4. Draw player
    drawPlayer();
    
    // 5. Draw UI overlays
    drawHealthBars();
    drawNames();
}
```

#### **Game Loop**
```javascript
gameLoop() {
    updatePlayer();      // Update movement
    updateEntities();    // Update entity states
    render();            // Draw everything
    
    requestAnimationFrame(gameLoop); // ~60 FPS
}
```

## How to Extend

### Adding New Skills

1. Add to skills object:
```javascript
this.skills = {
    // ... existing skills
    fishing: { level: 1, xp: 0, maxXp: 83 }
};
```

2. Add HTML stat display in `index.html`:
```html
<div class="stat-item">
    <img src="icon.svg" alt="Fishing">
    <span>Fishing:</span>
    <span id="fishing-level" class="stat-value">1</span>
    <div class="xp-bar">
        <div id="fishing-bar" class="xp-fill" style="width: 0%"></div>
    </div>
</div>
```

3. Create fishing action:
```javascript
fishSpot(spot) {
    if (Math.random() > 0.4) {
        this.addItemToInventory('fish', 1);
        this.addSkillXP('fishing', 10);
    }
}
```

### Adding New Entity Types

```javascript
createEntities() {
    // Add fishing spot
    this.entities.push({
        type: 'fishing_spot',
        x: 300,
        y: 400,
        width: 40,
        height: 40,
        color: '#4169e1',
        resource: 'fish',
        respawnTime: 0,
        maxRespawnTime: 2000
    });
}
```

Add context menu action:
```javascript
getEntityActions(entity) {
    // ...
    case 'fishing_spot':
        actions.push({
            label: 'Fish',
            callback: (e) => this.performAction(e, 'fish')
        });
        break;
}
```

### Adding Quests System

```javascript
class QuestManager {
    constructor() {
        this.quests = [];
        this.activeQuests = [];
        this.completedQuests = [];
    }
    
    addQuest(quest) {
        this.quests.push({
            id: quest.id,
            name: quest.name,
            description: quest.description,
            objectives: quest.objectives, // Array of objectives
            rewards: quest.rewards,
            progress: 0
        });
    }
    
    updateQuestProgress(questId, objectiveIndex) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (quest) {
            quest.objectives[objectiveIndex].completed = true;
            this.checkQuestCompletion(quest);
        }
    }
    
    checkQuestCompletion(quest) {
        if (quest.objectives.every(obj => obj.completed)) {
            this.completeQuest(quest);
        }
    }
    
    completeQuest(quest) {
        // Give rewards
        quest.rewards.forEach(reward => {
            if (reward.type === 'xp') {
                this.game.addSkillXP(reward.skill, reward.amount);
            } else if (reward.type === 'item') {
                this.game.addItemToInventory(reward.item, reward.quantity);
            }
        });
        
        this.completedQuests.push(quest);
        this.activeQuests = this.activeQuests.filter(q => q.id !== quest.id);
    }
}
```

### Adding Banking System

```javascript
class Bank {
    constructor() {
        this.storage = new Array(400).fill(null); // 400 bank slots
        this.isOpen = false;
    }
    
    deposit(item, quantity) {
        // Find matching item or empty slot
        let slot = this.storage.findIndex(i => i && i.name === item.name);
        if (slot === -1) slot = this.storage.findIndex(i => i === null);
        
        if (slot !== -1) {
            if (this.storage[slot]) {
                this.storage[slot].quantity += quantity;
            } else {
                this.storage[slot] = { name: item.name, quantity: quantity };
            }
            return true;
        }
        return false;
    }
    
    withdraw(slotIndex, quantity) {
        const item = this.storage[slotIndex];
        if (!item || item.quantity < quantity) return false;
        
        item.quantity -= quantity;
        if (item.quantity === 0) {
            this.storage[slotIndex] = null;
        }
        return true;
    }
    
    openBank() {
        this.isOpen = true;
        // Show bank UI
    }
}
```

### Adding Trading System

```javascript
class TradeManager {
    constructor() {
        this.activeTrade = null;
    }
    
    initiateTrade(player1, player2) {
        this.activeTrade = {
            player1: { items: [], accepted: false },
            player2: { items: [], accepted: false },
            completed: false
        };
    }
    
    addTradeItem(player, item, quantity) {
        if (!this.activeTrade) return false;
        
        const tradeSlot = this.activeTrade[player];
        tradeSlot.items.push({ item, quantity });
        tradeSlot.accepted = false; // Reset acceptance
        
        return true;
    }
    
    acceptTrade(player) {
        if (!this.activeTrade) return;
        
        this.activeTrade[player].accepted = true;
        
        if (this.activeTrade.player1.accepted && 
            this.activeTrade.player2.accepted) {
            this.completeTrade();
        }
    }
    
    completeTrade() {
        // Exchange items between players
        // Clear trade window
        this.activeTrade = null;
    }
}
```

### Adding Multiplayer

For multiplayer, you'd need:

1. **WebSocket Server** (Node.js example):
```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const players = new Map();

wss.on('connection', (ws) => {
    const playerId = generateUniqueId();
    
    players.set(playerId, {
        ws: ws,
        x: 400,
        y: 300,
        username: 'Player' + playerId
    });
    
    // Send player their ID
    ws.send(JSON.stringify({ type: 'init', playerId }));
    
    // Broadcast new player to all
    broadcast({ type: 'playerJoined', player: players.get(playerId) });
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        handlePlayerAction(playerId, msg);
    });
    
    ws.on('close', () => {
        players.delete(playerId);
        broadcast({ type: 'playerLeft', playerId });
    });
});

function broadcast(data) {
    players.forEach(player => {
        player.ws.send(JSON.stringify(data));
    });
}
```

2. **Client-side Networking**:
```javascript
class NetworkManager {
    constructor() {
        this.ws = new WebSocket('ws://localhost:8080');
        this.otherPlayers = new Map();
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
    }
    
    sendPosition(x, y) {
        this.ws.send(JSON.stringify({
            type: 'move',
            x: x,
            y: y
        }));
    }
    
    handleServerMessage(data) {
        switch(data.type) {
            case 'playerMoved':
                this.updateOtherPlayer(data.playerId, data.x, data.y);
                break;
            case 'playerJoined':
                this.addOtherPlayer(data.player);
                break;
            case 'playerLeft':
                this.removeOtherPlayer(data.playerId);
                break;
        }
    }
}
```

## Performance Optimization

### 1. **Spatial Partitioning**
For many entities, use a grid-based spatial hash:
```javascript
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    insert(entity) {
        const cellX = Math.floor(entity.x / this.cellSize);
        const cellY = Math.floor(entity.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }
    
    getNearby(x, y, range) {
        const entities = [];
        const cellRange = Math.ceil(range / this.cellSize);
        const centerX = Math.floor(x / this.cellSize);
        const centerY = Math.floor(y / this.cellSize);
        
        for (let dx = -cellRange; dx <= cellRange; dx++) {
            for (let dy = -cellRange; dy <= cellRange; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                if (this.grid.has(key)) {
                    entities.push(...this.grid.get(key));
                }
            }
        }
        return entities;
    }
}
```

### 2. **Object Pooling**
For frequently created/destroyed objects (damage numbers, effects):
```javascript
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 20) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = [];
        
        for (let i = 0; i < initialSize; i++) {
            this.available.push(createFn());
        }
    }
    
    acquire() {
        if (this.available.length === 0) {
            this.available.push(this.createFn());
        }
        
        const obj = this.available.pop();
        this.inUse.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.inUse.indexOf(obj);
        if (index !== -1) {
            this.inUse.splice(index, 1);
            this.resetFn(obj);
            this.available.push(obj);
        }
    }
}
```

### 3. **Delta Time**
For consistent gameplay across different framerates:
```javascript
gameLoop(currentTime) {
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
}

update(deltaTime) {
    // Use deltaTime for time-based calculations
    player.x += player.velocityX * deltaTime * 60; // 60 = target FPS
}
```

## Running the Game

1. Open `index.html` in a modern web browser
2. No server required for basic functionality
3. For multiplayer, you'll need to set up a WebSocket server

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Works but touch controls would need implementation

## Next Steps

1. Add more skills (Fishing, Cooking, Crafting)
2. Implement equipment system
3. Add more sophisticated combat
4. Create quest system
5. Add sound effects and music
6. Implement multiplayer
7. Add save/load functionality
8. Create more diverse maps/areas

## Credits

Inspired by RuneScape (Jagex Ltd.)
