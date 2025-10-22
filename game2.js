// RuneScape-Style Game Engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.entities = [];
        this.inventory = [];
        this.skills = {
            hitpoints: { level: 10, xp: 0, maxXp: 100 },
            mining: { level: 1, xp: 0, maxXp: 83 },
            magic: { level: 1, xp: 0, maxXp: 83 }
        };
        this.selectedEntity = null;
        this.camera = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.createPlayer();
        this.createEntities();
        this.setupInventory();
        this.setupEventListeners();
        this.updateStatsDisplay();
        this.gameLoop();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 6;
        this.canvas.height = container.clientHeight - 6;
    }

    createPlayer() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 20,
            height: 30,
            speed: 2,
            color: '#4169e1',
            targetX: null,
            targetY: null,
            isMoving: false,
            action: null
        };
    }

    createEntities() {
        for (let i = 0; i < 5; i++) {
            this.entities.push({
                type: 'rock',
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                width: 40,
                height: 40,
                color: '#808080',
                resource: 'ore',
                respawnTime: 0,
                maxRespawnTime: 3000
            });
        }

        for (let i = 0; i < 5; i++) {
            this.entities.push({
                type: 'tree',
                x: Math.random() * (this.canvas.width - 100) + 50,
                y: Math.random() * (this.canvas.height - 100) + 50,
                width: 30,
                height: 50,
                color: '#228b22',
                resource: 'logs',
                respawnTime: 0,
                maxRespawnTime: 4000
            });
        }

        this.entities.push({
            type: 'npc',
            x: 200,
            y: 200,
            width: 20,
            height: 30,
            color: '#ffd700',
            name: 'Bob the Merchant',
            dialogue: ['Hello adventurer!', 'Would you like to trade?']
        });

        this.entities.push({
            type: 'enemy',
            x: 500,
            y: 300,
            width: 25,
            height: 35,
            color: '#8b0000',
            name: 'Goblin',
            hp: 10,
            maxHp: 10,
            level: 2
        });
    }

    setupInventory() {
        const inventoryGrid = document.getElementById('inventory');
        
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slot = i;
            
            slot.addEventListener('click', () => this.useItem(i));
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showItemContextMenu(i, e.clientX, e.clientY);
            });
            
            inventoryGrid.appendChild(slot);
            this.inventory.push(null);
        }
    }

    addItemToInventory(itemName, quantity = 1) {
        let slot = this.inventory.findIndex(item => item && item.name === itemName);
        
        if (slot === -1) {
            slot = this.inventory.findIndex(item => item === null);
        }

        if (slot !== -1) {
            if (this.inventory[slot]) {
                this.inventory[slot].quantity += quantity;
            } else {
                this.inventory[slot] = {
                    name: itemName,
                    quantity: quantity,
                    icon: this.getItemIcon(itemName)
                };
            }
            this.updateInventoryDisplay();
            this.addChatMessage(`You received ${quantity}x ${itemName}`, 'system');
            return true;
        }
        
        this.addChatMessage('Your inventory is full!', 'system');
        return false;
    }

    getItemIcon(itemName) {
        const icons = {
            'ore': '⛏️',
            'logs': '🪵',
            'fish': '🐟',
            'coins': '💰'
        };
        return icons[itemName] || '📦';
    }

    updateInventoryDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        this.inventory.forEach((item, index) => {
            const slot = slots[index];
            slot.innerHTML = '';
            
            if (item) {
                slot.classList.add('has-item');
                const icon = document.createElement('div');
                icon.className = 'item-icon';
                icon.textContent = item.icon;
                icon.style.fontSize = '24px';
                
                const quantity = document.createElement('div');
                quantity.className = 'item-quantity';
                quantity.textContent = item.quantity > 1 ? item.quantity : '';
                
                slot.appendChild(icon);
                slot.appendChild(quantity);
            } else {
                slot.classList.remove('has-item');
            }
        });
    }

    useItem(slot) {
        const item = this.inventory[slot];
        if (item) {
            this.addChatMessage(`You use ${item.name}`, 'player');
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.player.targetX = x;
            this.player.targetY = y;
            this.player.isMoving = true;
            this.player.action = null;
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const entity = this.getEntityAt(x, y);
            if (entity) {
                this.showContextMenu(entity, e.clientX, e.clientY);
            }
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.addChatMessage(`Selected action: ${action}`, 'system');
            });
        });

        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.addChatMessage(chatInput.value, 'player');
                chatInput.value = '';
            }
        });

        document.addEventListener('click', () => {
            document.getElementById('context-menu').classList.add('hidden');
        });
    }

    getEntityAt(x, y) {
        return this.entities.find(entity => 
            x >= entity.x && x <= entity.x + entity.width &&
            y >= entity.y && y <= entity.y + entity.height &&
            entity.respawnTime === 0
        );
    }

    showContextMenu(entity, x, y) {
        const menu = document.getElementById('context-menu');
        menu.innerHTML = '';
        
        const actions = this.getEntityActions(entity);
        
        actions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'context-item';
            item.textContent = action.label;
            item.addEventListener('click', () => {
                action.callback(entity);
                menu.classList.add('hidden');
            });
            menu.appendChild(item);
        });

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
    }

    getEntityActions(entity) {
        const actions = [];

        switch(entity.type) {
            case 'rock':
                actions.push({
                    label: 'Mine Rock',
                    callback: (e) => this.performAction(e, 'mine')
                });
                break;
            case 'tree':
                actions.push({
                    label: 'Chop Tree',
                    callback: (e) => this.performAction(e, 'chop')
                });
                break;
            case 'npc':
                actions.push({
                    label: 'Talk-to',
                    callback: (e) => this.talkToNPC(e)
                });
                actions.push({
                    label: 'Trade',
                    callback: (e) => this.addChatMessage('Trading system coming soon!', 'system')
                });
                break;
            case 'enemy':
                actions.push({
                    label: 'Attack',
                    callback: (e) => this.performAction(e, 'attack')
                });
                break;
        }

        actions.push({
            label: 'Examine',
            callback: (e) => this.examineEntity(e)
        });

        return actions;
    }

    performAction(entity, actionType) {
        this.player.targetX = entity.x;
        this.player.targetY = entity.y;
        this.player.isMoving = true;
        this.player.action = { type: actionType, target: entity };
        
        const actionMessages = {
            'mine': 'You swing your pickaxe at the rock...',
            'chop': 'You swing your axe at the tree...',
            'attack': 'You attack the enemy...'
        };
        
        this.addChatMessage(actionMessages[actionType] || 'You perform an action...', 'system');
    }

    executeAction() {
        if (!this.player.action) return;

        const { type, target } = this.player.action;
        
        switch(type) {
            case 'mine':
                this.mineRock(target);
                break;
            case 'chop':
                this.chopTree(target);
                break;
            case 'attack':
                this.attackEnemy(target);
                break;
        }
    }

    mineRock(rock) {
        if (rock.respawnTime > 0) return;
        
        if (Math.random() > 0.3) {
            this.addItemToInventory('ore', 1);
            this.addSkillXP('mining', 17.5);
            rock.respawnTime = rock.maxRespawnTime;
            this.addChatMessage('You successfully mine some ore!', 'system');
        } else {
            this.addChatMessage('You fail to mine the rock.', 'system');
        }
        
        this.player.action = null;
    }

    chopTree(tree) {
        if (tree.respawnTime > 0) return;
        
        if (Math.random() > 0.3) {
            this.addItemToInventory('logs', 1);
            this.addSkillXP('woodcutting', 25);
            tree.respawnTime = tree.maxRespawnTime;
            this.addChatMessage('You chop down the tree!', 'system');
        } else {
            this.addChatMessage('You swing at the tree.', 'system');
        }
        
        this.player.action = null;
    }

    attackEnemy(enemy) {
        const damage = Math.floor(Math.random() * 5) + 1;
        enemy.hp -= damage;
        
        this.addChatMessage(`You deal ${damage} damage to ${enemy.name}!', 'system');
        this.addSkillXP('hitpoints', 1.33);
        
        if (enemy.hp <= 0) {
            this.addChatMessage(`You defeated ${enemy.name}!`, 'system');
            this.addItemToInventory('coins', Math.floor(Math.random() * 20) + 10);
            enemy.hp = enemy.maxHp;
        }
        
        this.player.action = null;
    }

    talkToNPC(npc) {
        if (npc.dialogue) {
            npc.dialogue.forEach((line, index) => {
                setTimeout(() => {
                    this.addChatMessage(`${npc.name}: ${line}`, 'npc');
                }, index * 1000);
            });
        }
    }

    examineEntity(entity) {
        const examineTexts = {
            'rock': 'A rock containing ore.',
            'tree': 'A sturdy tree perfect for woodcutting.',
            'npc': `${entity.name} - A friendly NPC.`,
            'enemy': `${entity.name} - Level ${entity.level}. This looks dangerous!`
        };
        
        this.addChatMessage(examineTexts[entity.type] || 'An interesting object.', 'system');
    }

    addSkillXP(skill, amount) {
        if (!this.skills[skill]) return;
        
        this.skills[skill].xp += amount;
        
        while (this.skills[skill].xp >= this.skills[skill].maxXp) {
            this.skills[skill].xp -= this.skills[skill].maxXp;
            this.skills[skill].level++;
            this.skills[skill].maxXp = Math.floor(this.skills[skill].maxXp * 1.15);
            
            this.addChatMessage(
                `Congratulations! Your ${skill} level is now ${this.skills[skill].level}!`,
                'system'
            );
        }
        
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            const levelEl = document.getElementById(`${skillName}-level`);
            const barEl = document.getElementById(`${skillName}-bar`);
            
            if (levelEl) levelEl.textContent = skill.level;
            if (barEl) {
                const progress = (skill.xp / skill.maxXp) * 100;
                barEl.style.width = progress + '%';
            }
        });
    }

    addChatMessage(message, type = 'system') {
        const chatMessages = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${type}`;
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        while (chatMessages.children.length > 100) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }

    updatePlayer() {
        if (!this.player.isMoving) return;

        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.player.speed) {
            this.player.x = this.player.targetX;
            this.player.y = this.player.targetY;
            this.player.isMoving = false;
            
            if (this.player.action) {
                this.executeAction();
            }
        } else {
            this.player.x += (dx / distance) * this.player.speed;
            this.player.y += (dy / distance) * this.player.speed;
        }
    }

    updateEntities() {
        this.entities.forEach(entity => {
            if (entity.respawnTime > 0) {
                entity.respawnTime -= 16;
                if (entity.respawnTime < 0) entity.respawnTime = 0;
            }
        });
    }

    render() {
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 32;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.entities.forEach(entity => {
            if (entity.respawnTime > 0) return;
            
            this.ctx.fillStyle = entity.color;
            
            if (entity.type === 'tree') {
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(entity.x + 10, entity.y + 20, 10, 30);
                this.ctx.fillStyle = '#228b22';
                this.ctx.beginPath();
                this.ctx.arc(entity.x + 15, entity.y + 15, 15, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (entity.type === 'rock') {
                this.ctx.beginPath();
                this.ctx.arc(entity.x + 20, entity.y + 20, 20, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#a9a9a9';
                this.ctx.beginPath();
                this.ctx.arc(entity.x + 15, entity.y + 15, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(entity.name || entity.type, entity.x + entity.width/2, entity.y - 5);
                
                if (entity.hp !== undefined) {
                    const hpBarWidth = entity.width;
                    const hpBarHeight = 4;
                    const hpPercent = entity.hp / entity.maxHp;
                    
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(entity.x, entity.y - 15, hpBarWidth, hpBarHeight);
                    this.ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : (hpPercent > 0.25 ? '#ff0' : '#f00');
                    this.ctx.fillRect(entity.x, entity.y - 15, hpBarWidth * hpPercent, hpBarHeight);
                }
            }
        });

        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x - this.player.width/2, 
                          this.player.y - this.player.height/2, 
                          this.player.width, 
                          this.player.height);
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('You', this.player.x, this.player.y - this.player.height/2 - 5);

        if (this.player.isMoving) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.player.targetX, this.player.targetY, 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    gameLoop() {
        this.updatePlayer();
        this.updateEntities();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new Game();
});
