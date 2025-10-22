/**
 * UIManager.js - UI Coordination and Management
 * 
 * Manages all UI components, coordinates updates, and handles
 * interactions between game systems and the DOM. Acts as the
 * central hub for UI state management.
 * 
 * @class UIManager
 */

class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // UI Components
        this.components = {
            statsPanel: null,
            skillsPanel: null,
            inventoryPanel: null,
            chatPanel: null,
            topBar: null
        };
        
        // DOM Elements
        this.elements = {
            gameContainer: null,
            loginScreen: null,
            loadingOverlay: null,
            modalOverlay: null,
            topBar: {
                playerName: null,
                hpBar: null,
                hpText: null,
                prayerBar: null,
                prayerText: null,
                energyBar: null,
                energyText: null
            },
            skills: {
                grid: null,
                items: {}
            },
            inventory: {
                grid: null,
                slots: []
            },
            chat: {
                messages: null,
                input: null
            },
            actions: {
                container: null,
                buttons: {}
            }
        };
        
        // UI State
        this.state = {
            selectedSkill: null,
            selectedInventorySlot: null,
            contextMenuOpen: false,
            modalOpen: false,
            chatHistory: [],
            notifications: []
        };
        
        // Update throttling
        this.lastUpdate = {
            stats: 0,
            skills: 0,
            inventory: 0
        };
        this.updateInterval = 100; // ms
    }
    
    /**
     * Initialize the UI Manager
     */
    init() {
        console.log('UIManager initializing...');
        
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize UI components
        this.initializeComponents();
        
        console.log('UIManager initialized');
    }
    
    /**
     * Cache all DOM elements for performance
     */
    cacheElements() {
        // Main containers
        this.elements.gameContainer = document.getElementById('gameContainer');
        this.elements.loginScreen = document.getElementById('loginScreen');
        this.elements.loadingOverlay = document.getElementById('loadingOverlay');
        this.elements.modalOverlay = document.getElementById('modalOverlay');
        
        // Top bar elements
        this.elements.topBar.playerName = document.getElementById('playerName');
        this.elements.topBar.hpBar = document.getElementById('hpBar');
        this.elements.topBar.hpText = document.getElementById('hpText');
        this.elements.topBar.prayerBar = document.getElementById('prayerBar');
        this.elements.topBar.prayerText = document.getElementById('prayerText');
        this.elements.topBar.energyBar = document.getElementById('energyBar');
        this.elements.topBar.energyText = document.getElementById('energyText');
        
        // Skills panel
        this.elements.skills.grid = document.getElementById('skillsGrid');
        
        // Inventory panel
        this.elements.inventory.grid = document.getElementById('inventoryGrid');
        
        // Chat panel
        this.elements.chat.messages = document.getElementById('chatMessages');
        this.elements.chat.input = document.getElementById('chatInput');
        
        // Actions panel
        this.elements.actions.container = document.getElementById('actionButtons');
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Game engine events
        this.gameEngine.on('playerStatsChanged', this.updatePlayerStats.bind(this));
        this.gameEngine.on('skillXPGain', this.onSkillXPGain.bind(this));
        this.gameEngine.on('skillLevelUp', this.onSkillLevelUp.bind(this));
        this.gameEngine.on('inventoryChanged', this.updateInventory.bind(this));
        this.gameEngine.on('itemEquipped', this.onItemEquipped.bind(this));
        this.gameEngine.on('itemUnequipped', this.onItemUnequipped.bind(this));
        this.gameEngine.on('itemUsed', this.onItemUsed.bind(this));
        this.gameEngine.on('showLevelUp', this.showLevelUpAnimation.bind(this));
        this.gameEngine.on('showNotification', this.showNotification.bind(this));
        this.gameEngine.on('actionStart', this.onActionStart.bind(this));
        this.gameEngine.on('actionStop', this.onActionStop.bind(this));
        this.gameEngine.on('actionComplete', this.onActionComplete.bind(this));
        
        // Chat input
        if (this.elements.chat.input) {
            this.elements.chat.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Top bar buttons
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }
    }
    
    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Initialize skills grid
        this.initializeSkillsUI();
        
        // Initialize inventory grid
        this.initializeInventoryUI();
        
        // Initialize action buttons
        this.initializeActionButtons();
    }
    
    /**
     * Initialize skills UI grid
     */
    initializeSkillsUI() {
        if (!this.elements.skills.grid) return;
        
        const player = this.gameEngine.player;
        if (!player) return;
        
        const skillsHTML = [];
        
        for (const skillName in player.skills) {
            const skill = player.skills[skillName];
            const skillConfig = this.gameEngine.gameConfig.skills[skillName];
            
            if (!skillConfig) continue;
            
            const skillHTML = `
                <div class="skill-item" data-skill="${skillName}">
                    <div class="skill-icon">${skillConfig.icon}</div>
                    <div class="skill-name">${skillConfig.name}</div>
                    <div class="skill-level" id="skill-${skillName}-level">${skill.level}</div>
                    <div class="skill-xp" id="skill-${skillName}-xp">${this.formatNumber(skill.xp)} XP</div>
                </div>
            `;
            
            skillsHTML.push(skillHTML);
        }
        
        this.elements.skills.grid.innerHTML = skillsHTML.join('');
        
        // Add click listeners
        const skillItems = this.elements.skills.grid.querySelectorAll('.skill-item');
        skillItems.forEach(item => {
            item.addEventListener('click', () => {
                const skillName = item.dataset.skill;
                this.showSkillDetails(skillName);
            });
        });
    }
    
    /**
     * Initialize inventory UI grid
     */
    initializeInventoryUI() {
        if (!this.elements.inventory.grid) return;
        
        const slotsHTML = [];
        
        for (let i = 0; i < 28; i++) {
            slotsHTML.push(`
                <div class="inventory-slot" data-slot="${i}" id="inv-slot-${i}">
                    <div class="inventory-item-icon" id="inv-icon-${i}"></div>
                    <div class="inventory-item-count" id="inv-count-${i}"></div>
                </div>
            `);
        }
        
        this.elements.inventory.grid.innerHTML = slotsHTML.join('');
        
        // Cache slot elements
        for (let i = 0; i < 28; i++) {
            this.elements.inventory.slots[i] = document.getElementById(`inv-slot-${i}`);
        }
        
        // Add event listeners
        this.elements.inventory.grid.addEventListener('click', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (slot) {
                const slotIndex = parseInt(slot.dataset.slot);
                this.handleInventoryClick(slotIndex, 'left');
            }
        });
        
        this.elements.inventory.grid.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const slot = e.target.closest('.inventory-slot');
            if (slot) {
                const slotIndex = parseInt(slot.dataset.slot);
                this.handleInventoryClick(slotIndex, 'right');
            }
        });
    }
    
    /**
     * Initialize action buttons
     */
    initializeActionButtons() {
        if (!this.elements.actions.container) return;
        
        const actionsHTML = `
            <button class="action-button" id="action-attack">Attack</button>
            <button class="action-button" id="action-gather">Gather</button>
            <button class="action-button" id="action-bank">Bank</button>
            <button class="action-button" id="action-shop">Shop</button>
            <button class="action-button" id="action-quest">Quests</button>
            <button class="action-button" id="action-teleport">Teleport</button>
        `;
        
        this.elements.actions.container.innerHTML = actionsHTML;
        
        // Add event listeners
        document.getElementById('action-attack')?.addEventListener('click', () => this.startCombat());
        document.getElementById('action-gather')?.addEventListener('click', () => this.startGathering());
        document.getElementById('action-bank')?.addEventListener('click', () => this.openBank());
        document.getElementById('action-shop')?.addEventListener('click', () => this.openShop());
        document.getElementById('action-quest')?.addEventListener('click', () => this.openQuests());
        document.getElementById('action-teleport')?.addEventListener('click', () => this.openTeleport());
    }
    
    /**
     * Update player stats in top bar
     */
    updatePlayerStats() {
        const now = Date.now();
        if (now - this.lastUpdate.stats < this.updateInterval) return;
        this.lastUpdate.stats = now;
        
        const player = this.gameEngine.player;
        if (!player) return;
        
        // Update player name
        if (this.elements.topBar.playerName) {
            this.elements.topBar.playerName.textContent = player.username;
        }
        
        // Update HP bar
        const hpPercent = (player.combatStats.hitpoints / player.combatStats.maxHitpoints) * 100;
        if (this.elements.topBar.hpBar) {
            this.elements.topBar.hpBar.style.width = `${hpPercent}%`;
        }
        if (this.elements.topBar.hpText) {
            this.elements.topBar.hpText.textContent = 
                `${Math.floor(player.combatStats.hitpoints)}/${player.combatStats.maxHitpoints}`;
        }
        
        // Update Prayer bar
        const prayerPercent = (player.combatStats.prayer / player.combatStats.maxPrayer) * 100;
        if (this.elements.topBar.prayerBar) {
            this.elements.topBar.prayerBar.style.width = `${prayerPercent}%`;
        }
        if (this.elements.topBar.prayerText) {
            this.elements.topBar.prayerText.textContent = 
                `${Math.floor(player.combatStats.prayer)}/${player.combatStats.maxPrayer}`;
        }
        
        // Update Energy bar
        const energyPercent = (player.combatStats.energy / player.combatStats.maxEnergy) * 100;
        if (this.elements.topBar.energyBar) {
            this.elements.topBar.energyBar.style.width = `${energyPercent}%`;
        }
        if (this.elements.topBar.energyText) {
            this.elements.topBar.energyText.textContent = 
                `${Math.floor(player.combatStats.energy)}/${player.combatStats.maxEnergy}`;
        }
    }
    
    /**
     * Update skills UI
     */
    updateSkillsUI() {
        const now = Date.now();
        if (now - this.lastUpdate.skills < this.updateInterval) return;
        this.lastUpdate.skills = now;
        
        const player = this.gameEngine.player;
        if (!player) return;
        
        for (const skillName in player.skills) {
            const skill = player.skills[skillName];
            
            const levelEl = document.getElementById(`skill-${skillName}-level`);
            const xpEl = document.getElementById(`skill-${skillName}-xp`);
            
            if (levelEl) {
                levelEl.textContent = skill.level;
            }
            
            if (xpEl) {
                xpEl.textContent = `${this.formatNumber(skill.xp)} XP`;
            }
        }
    }
    
    /**
     * Update inventory display
     */
    updateInventory() {
        const now = Date.now();
        if (now - this.lastUpdate.inventory < this.updateInterval) return;
        this.lastUpdate.inventory = now;
        
        const player = this.gameEngine.player;
        if (!player) return;
        
        for (let i = 0; i < player.inventory.length; i++) {
            const item = player.inventory[i];
            const slot = this.elements.inventory.slots[i];
            
            if (!slot) continue;
            
            const iconEl = document.getElementById(`inv-icon-${i}`);
            const countEl = document.getElementById(`inv-count-${i}`);
            
            if (item) {
                slot.classList.add('has-item');
                if (iconEl) iconEl.textContent = item.icon || '📦';
                if (countEl && item.quantity > 1) {
                    countEl.textContent = this.formatNumber(item.quantity);
                    countEl.style.display = 'block';
                } else if (countEl) {
                    countEl.style.display = 'none';
                }
            } else {
                slot.classList.remove('has-item');
                if (iconEl) iconEl.textContent = '';
                if (countEl) countEl.style.display = 'none';
            }
        }
    }
    
    /**
     * Handle skill XP gain event
     */
    onSkillXPGain(data) {
        const { skillName, xpGained } = data;
        
        this.updateSkillsUI();
        
        // Show XP drop animation
        this.showXPDrop(skillName, xpGained);
    }
    
    /**
     * Handle skill level up event
     */
    onSkillLevelUp(data) {
        const { skillName, newLevel, skillConfig } = data;
        
        this.updateSkillsUI();
        this.updatePlayerStats();
        
        // Show notification
        this.showNotification({
            type: 'levelup',
            message: `Congratulations! Your ${skillConfig.name} level is now ${newLevel}!`,
            icon: skillConfig.icon,
            duration: 5000
        });
        
        // Add to chat
        this.addChatMessage('system', `Level up! You are now level ${newLevel} ${skillConfig.name}.`);
    }
    
    /**
     * Handle item equipped event
     */
    onItemEquipped(data) {
        const { item, slot } = data;
        
        this.updateInventory();
        this.addChatMessage('system', `Equipped ${item.name}.`);
    }
    
    /**
     * Handle item unequipped event
     */
    onItemUnequipped(data) {
        const { item, slot } = data;
        
        this.updateInventory();
        this.addChatMessage('system', `Unequipped ${item.name}.`);
    }
    
    /**
     * Handle item used event
     */
    onItemUsed(data) {
        const { item } = data;
        
        this.updateInventory();
        this.updatePlayerStats();
        this.addChatMessage('system', `Used ${item.name}.`);
    }
    
    /**
     * Handle action start event
     */
    onActionStart(data) {
        const { skillName } = data;
        this.addChatMessage('system', `You start ${skillName}...`);
    }
    
    /**
     * Handle action stop event
     */
    onActionStop(data) {
        // Action stopped
    }
    
    /**
     * Handle action complete event
     */
    onActionComplete(data) {
        const { skillName } = data;
        // Action completed - XP gain event will handle the notification
    }
    
    /**
     * Show level up animation
     */
    showLevelUpAnimation(data) {
        const { skillName, level } = data;
        // This would show a visual animation on the canvas
        // For now, just emit to renderer
    }
    
    /**
     * Show XP drop animation
     */
    showXPDrop(skillName, xpAmount) {
        // This would show an XP drop above the player
        // For now, just update UI
    }
    
    /**
     * Show notification
     */
    showNotification(data) {
        const { type, message, icon, duration = 3000 } = data;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;
        notification.innerHTML = `
            ${icon ? `<span class="notification-icon">${icon}</span>` : ''}
            <span class="notification-message">${message}</span>
        `;
        
        // Add to page (would need notification container in HTML)
        // For now, just add to chat
        this.addChatMessage('system', message);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
    
    /**
     * Add message to chat
     */
    addChatMessage(type, message, username = null) {
        if (!this.elements.chat.messages) return;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${type}`;
        
        if (type === 'player' && username) {
            messageEl.innerHTML = `
                <span class="timestamp">${timestamp}</span>
                <span class="username">${username}:</span> ${message}
            `;
        } else {
            messageEl.innerHTML = `<span class="timestamp">${timestamp}</span> ${message}`;
        }
        
        this.elements.chat.messages.appendChild(messageEl);
        this.elements.chat.messages.scrollTop = this.elements.chat.messages.scrollHeight;
        
        // Keep only last 100 messages
        while (this.elements.chat.messages.children.length > 100) {
            this.elements.chat.messages.removeChild(this.elements.chat.messages.firstChild);
        }
    }
    
    /**
     * Send chat message
     */
    sendChatMessage() {
        if (!this.elements.chat.input) return;
        
        const message = this.elements.chat.input.value.trim();
        if (!message) return;
        
        const player = this.gameEngine.player;
        this.addChatMessage('player', message, player.username);
        
        this.elements.chat.input.value = '';
    }
    
    /**
     * Handle inventory click
     */
    handleInventoryClick(slotIndex, button) {
        const player = this.gameEngine.player;
        if (!player || !player.inventory[slotIndex]) return;
        
        this.gameEngine.inventorySystem.handleItemClick(player, slotIndex, button);
    }
    
    /**
     * Show skill details modal
     */
    showSkillDetails(skillName) {
        const player = this.gameEngine.player;
        const skillInfo = this.gameEngine.skillsSystem.getSkillInfo(player, skillName);
        
        if (!skillInfo) return;
        
        const xpToNext = this.gameEngine.skillsSystem.getXPToNextLevel(skillInfo.xp);
        const progress = this.gameEngine.skillsSystem.getLevelProgress(skillInfo.xp);
        
        this.showModal(`
            <h2>${skillInfo.icon} ${skillInfo.displayName}</h2>
            <p><strong>Level:</strong> ${skillInfo.level}</p>
            <p><strong>XP:</strong> ${this.formatNumber(skillInfo.xp)}</p>
            <p><strong>XP to next level:</strong> ${this.formatNumber(xpToNext)}</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
                <div class="progress-text">${progress.toFixed(1)}%</div>
            </div>
            <p><strong>Category:</strong> ${skillInfo.category}</p>
        `);
    }
    
    /**
     * Show modal
     */
    showModal(content) {
        if (!this.elements.modalOverlay) return;
        
        const modalContent = this.elements.modalOverlay.querySelector('.modal-content');
        if (!modalContent) return;
        
        const modalBody = modalContent.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
        
        this.elements.modalOverlay.classList.remove('hidden');
        this.state.modalOpen = true;
    }
    
    /**
     * Hide modal
     */
    hideModal() {
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.classList.add('hidden');
            this.state.modalOpen = false;
        }
    }
    
    /**
     * Show/hide loading overlay
     */
    setLoading(loading, message = 'Loading...') {
        if (!this.elements.loadingOverlay) return;
        
        const loadingText = this.elements.loadingOverlay.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
        
        if (loading) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }
    
    /**
     * Action button handlers
     */
    startCombat() {
        this.addChatMessage('system', 'Click on an enemy to attack.');
    }
    
    startGathering() {
        this.addChatMessage('system', 'Click on a resource to gather.');
    }
    
    openBank() {
        this.addChatMessage('system', 'Bank opening... (not yet implemented)');
    }
    
    openShop() {
        this.addChatMessage('system', 'Shop opening... (not yet implemented)');
    }
    
    openQuests() {
        this.addChatMessage('system', 'Quest log opening... (not yet implemented)');
    }
    
    openTeleport() {
        this.addChatMessage('system', 'Teleport menu opening... (not yet implemented)');
    }
    
    openSettings() {
        this.addChatMessage('system', 'Settings opening... (not yet implemented)');
    }
    
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Save and logout
            this.gameEngine.emit('logout');
        }
    }
    
    /**
     * Format number with commas
     */
    formatNumber(num) {
        return Math.floor(num).toLocaleString();
    }
    
    /**
     * Update UI (called every frame)
     */
    update(deltaTime) {
        this.updatePlayerStats();
        this.updateSkillsUI();
        this.updateInventory();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
