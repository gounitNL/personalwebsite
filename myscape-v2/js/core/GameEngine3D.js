/**
 * GameEngine3D.js - 3D Game Engine
 * Modified version of GameEngine.js that uses Three.js for 3D rendering
 * Maintains compatibility with all existing game systems
 */

class GameEngine3D {
    constructor() {
        // Core components
        this.canvas = null;
        this.renderer = null; // Renderer3D instance
        this.camera = null; // Camera3D instance
        this.inputHandler = null;
        
        // Game configuration
        this.gameConfig = null;
        
        // Game systems (all existing systems work unchanged)
        this.skillsSystem = null;
        this.inventorySystem = null;
        this.equipmentSystem = null;
        this.combatSystem = null;
        this.damageNumbersSystem = null;
        this.worldSystem = null;
        this.questSystem = null;
        this.npcSystem = null;
        this.shopSystem = null;
        this.bankingSystem = null;
        this.spatialGrid = null;
        this.poolManager = null;
        this.pathfinding = null;
        
        // UI managers
        this.uiManager = null;
        this.contextMenu = null;
        
        // Game state
        this.player = null;
        this.currentArea = null;
        this.entities = [];
        this.isRunning = false;
        this.isPaused = false;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.then = Date.now();
        
        // Event system
        this.eventListeners = {};
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        
        // Debounce timer
        this.pauseDebounceTimer = null;
        
        console.log('🎮 GameEngine3D initialized');
    }

    /**
     * Initialize the 3D game engine
     */
    async init(canvasId) {
        console.log('🚀 Starting 3D game initialization...');
        
        try {
            // Setup canvas
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas with id '${canvasId}' not found`);
            }
            
            this.resizeCanvas();
            
            // Initialize 3D renderer (Three.js)
            console.log('📐 Initializing 3D renderer...');
            this.renderer = new Renderer3D(this.canvas);
            
            // Initialize 3D camera
            console.log('📷 Initializing 3D camera...');
            this.camera = new Camera3D(0, 0, this.canvas.width, this.canvas.height);
            
            // Initialize input handler
            console.log('🖱️ Initializing input handler...');
            this.inputHandler = new InputHandler(this.canvas);
            this.setupInputHandlers();
            
            // Initialize game systems
            console.log('⚙️ Initializing game systems...');
            await this.initializeSystems();
            
            // Create player
            console.log('🧙 Creating player...');
            this.createPlayer();
            
            // Initialize UI components
            if (this.uiManager) {
                console.log('🖥️ Initializing UI components...');
                this.uiManager.initializeComponents();
                this.uiManager.updateSkillsUI();
                this.uiManager.updateInventory();
            }
            
            // Load initial area
            console.log('🗺️ Loading initial area...');
            await this.loadInitialArea();
            
            // Initialize context menu
            console.log('📋 Initializing context menu...');
            this.contextMenu = new ContextMenu(this);
            
            // Setup window event listeners
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Debounced pause/resume
            window.addEventListener('blur', () => {
                clearTimeout(this.pauseDebounceTimer);
                this.pauseDebounceTimer = setTimeout(() => {
                    if (!this.isPaused) {
                        this.pause();
                    }
                }, 200);
            });
            
            window.addEventListener('focus', () => {
                clearTimeout(this.pauseDebounceTimer);
                this.pauseDebounceTimer = setTimeout(() => {
                    if (this.isPaused) {
                        this.resume();
                    }
                }, 200);
            });
            
            console.log('✅ 3D Game initialization complete!');
            console.log('  - Player:', this.player ? `at (${this.player.x}, ${this.player.y})` : 'NOT CREATED');
            console.log('  - Camera:', this.camera ? 'initialized' : 'NOT INITIALIZED');
            console.log('  - Renderer:', this.renderer ? '3D (Three.js)' : 'NOT INITIALIZED');
            console.log('  - World:', this.currentArea ? this.currentArea.name : 'NO AREA LOADED');
            console.log('  - Entities:', this.entities.length);
            
            // Start the game loop
            this.start();
            
        } catch (error) {
            console.error('❌ Failed to initialize 3D game:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    /**
     * Initialize all game systems (same as 2D version)
     */
    async initializeSystems() {
        if (typeof GameConfig === 'undefined') {
            throw new Error('GameConfig is required');
        }
        
        this.gameConfig = GameConfig;
        
        // All systems remain the same as 2D version
        this.skillsSystem = new SkillsSystem(this);
        this.skillsSystem.init(this.gameConfig);
        
        this.inventorySystem = new InventorySystem(this);
        this.inventorySystem.init(this.gameConfig);
        
        this.uiManager = new UIManager(this);
        this.uiManager.init();
        
        this.worldSystem = new WorldSystem(this);
        this.worldSystem.init(GameConfig);
        
        this.combatSystem = new CombatSystem(this);
        this.combatSystem.init(this.gameConfig);
        
        this.damageNumbersSystem = new DamageNumbersSystem(this);
        this.damageNumbersSystem.init();
        
        this.equipmentSystem = new EquipmentSystem(this);
        this.equipmentSystem.init(this.gameConfig);
        
        this.bankingSystem = new BankingSystem(this);
        this.bankingSystem.init(this.gameConfig);
        
        this.npcSystem = new NPCSystem(this);
        this.npcSystem.init(this.gameConfig);
        
        this.questSystem = new QuestSystem(this);
        this.questSystem.init(this.gameConfig);
        
        this.spatialGrid = new SpatialGrid(10);
        this.poolManager = new PoolManager();
        this.pathfinding = new PathFinding(this.worldSystem);
        
        console.log('⚙️ All game systems initialized');
    }

    /**
     * Create player entity
     */
    createPlayer() {
        this.player = new Player({
            x: 25,
            y: 25,
            speed: 5,
            username: window.currentUser?.displayName || 'Player'
        });
        
        this.camera.follow(this.player);
        
        console.log('🧙 Player created at:', this.player.x, this.player.y);
    }

    /**
     * Load initial game area
     */
    async loadInitialArea() {
        if (this.worldSystem) {
            this.currentArea = await this.worldSystem.loadArea('lumbridge');
        } else {
            this.currentArea = {
                name: 'Lumbridge',
                width: 50,
                height: 50,
                tiles: []
            };
            
            for (let y = 0; y < 50; y++) {
                this.currentArea.tiles[y] = [];
                for (let x = 0; x < 50; x++) {
                    this.currentArea.tiles[y][x] = {
                        type: 'grass',
                        walkable: true
                    };
                }
            }
        }
    }

    /**
     * Setup input handlers (modified for 3D)
     */
    setupInputHandlers() {
        // Mouse click - move player (uses raycasting in 3D)
        this.inputHandler.onMouseClick((x, y) => {
            const worldPos = this.renderer.getWorldPositionFromClick(x, y);
            if (worldPos) {
                this.movePlayerTo(worldPos.x, worldPos.y);
            }
        });
        
        // Right click - context menu
        this.inputHandler.onContextMenu((x, y) => {
            const worldPos = this.renderer.getWorldPositionFromClick(x, y);
            if (worldPos) {
                console.log('Right clicked at world position:', worldPos);
                
                if (this.npcSystem && this.worldSystem) {
                    const npc = this.npcSystem.getNPCAt(worldPos.x, worldPos.y, this.worldSystem.currentAreaId);
                    if (npc) {
                        this.showNPCContextMenu(npc, x, y);
                        return;
                    }
                }
            }
        });
        
        // Keyboard input
        this.inputHandler.onKeyPress((key) => {
            this.handleKeyPress(key);
        });
    }

    /**
     * Handle keyboard input
     */
    handleKeyPress(key) {
        switch(key) {
            case 'Escape':
                this.togglePause();
                break;
            
            // Test shortcuts
            case '1':
                this.testAddXP('attack', 100);
                break;
            case '2':
                this.testAddXP('woodcutting', 50);
                break;
            case '3':
                this.testAddXP('mining', 75);
                break;
            case '4':
                this.testAddItem('logs', 1);
                break;
            case '5':
                this.testAddItem('bronze_sword', 1);
                break;
            case '6':
                this.testSpawnEnemy('goblin', 5);
                break;
            case '7':
                this.testPlayerAttack();
                break;
        }
    }

    /**
     * Show NPC context menu
     */
    showNPCContextMenu(npc, screenX, screenY) {
        console.log(`Showing context menu for ${npc.name}`);
        
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) {
            if (npc.actions && npc.actions.length > 0) {
                npc.interact(npc.actions[0]);
            }
            return;
        }
        
        contextMenu.innerHTML = '';
        
        const header = document.createElement('div');
        header.className = 'context-menu-header';
        header.textContent = npc.name;
        contextMenu.appendChild(header);
        
        npc.actions.forEach(action => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = action;
            item.onclick = () => {
                npc.interact(action);
                this.hideContextMenu();
            };
            contextMenu.appendChild(item);
        });
        
        contextMenu.style.left = `${screenX}px`;
        contextMenu.style.top = `${screenY}px`;
        contextMenu.classList.remove('hidden');
        
        const hideOnClick = (e) => {
            if (!contextMenu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', hideOnClick);
            }
        };
        setTimeout(() => document.addEventListener('click', hideOnClick), 10);
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
    }

    /**
     * Move player to target position
     */
    movePlayerTo(targetX, targetY) {
        targetX = Math.max(0, Math.min(this.currentArea.width - 1, targetX));
        targetY = Math.max(0, Math.min(this.currentArea.height - 1, targetY));
        
        this.player.targetX = targetX;
        this.player.targetY = targetY;
        this.player.isMoving = true;
        
        console.log('🚶 Player moving to:', targetX, targetY);
    }

    /**
     * Start game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.then = Date.now();
        
        console.log('▶️ 3D Game loop started');
        
        this.gameLoop();
    }

    /**
     * Stop game loop
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game loop stopped');
    }

    /**
     * Pause game
     */
    pause() {
        this.isPaused = true;
        console.log('⏸️ Game paused');
        this.emit('game_paused');
    }

    /**
     * Resume game
     */
    resume() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.then = Date.now();
        console.log('▶️ Game resumed');
        this.emit('game_resumed');
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        // Update FPS counter
        this.frameCount++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
        
        if (!this.isPaused) {
            this.update(deltaTime);
            this.render(deltaTime);
        }
    }

    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Update player
        if (this.player && this.player.update) {
            this.player.update(deltaTime);
        }
        
        // Update camera
        this.camera.update(deltaTime);
        
        // Update systems
        if (this.skillsSystem) this.skillsSystem.update(deltaTime);
        if (this.inventorySystem) this.inventorySystem.update(deltaTime);
        if (this.uiManager) this.uiManager.update(deltaTime);
        if (this.worldSystem) this.worldSystem.update(deltaTime);
        if (this.combatSystem) this.combatSystem.update(deltaTime);
        if (this.damageNumbersSystem) this.damageNumbersSystem.update(deltaTime);
        if (this.equipmentSystem) this.equipmentSystem.update(deltaTime);
        if (this.bankingSystem) this.bankingSystem.update(deltaTime);
        if (this.npcSystem) this.npcSystem.update(deltaTime);
        
        // Update entities
        this.updateEntities(deltaTime);
    }

    /**
     * Update all entities
     */
    updateEntities(deltaTime) {
        const entitiesToRemove = [];
        
        for (let i = 0; i < this.entities.length; i++) {
            const entity = this.entities[i];
            
            if (!entity) {
                entitiesToRemove.push(i);
                continue;
            }
            
            const oldX = entity.x;
            const oldY = entity.y;
            
            if (entity.update) {
                entity.update(deltaTime);
            }
            
            if (this.spatialGrid && (entity.x !== oldX || entity.y !== oldY)) {
                this.spatialGrid.update(entity, oldX, oldY);
            }
            
            if (entity.isDead || entity.destroyed || entity.markedForRemoval) {
                entitiesToRemove.push(i);
                
                if (this.spatialGrid) {
                    this.spatialGrid.remove(entity);
                }
            }
        }
        
        for (let i = entitiesToRemove.length - 1; i >= 0; i--) {
            this.entities.splice(entitiesToRemove[i], 1);
        }
    }

    /**
     * Render the 3D game
     */
    render(deltaTime) {
        // Render world
        if (this.currentArea) {
            this.renderer.renderWorld(this.currentArea, this.camera);
        }
        
        // Render player
        if (this.player) {
            this.renderer.renderEntity(this.player, this.camera);
        }
        
        // Render entities
        for (const entity of this.entities) {
            if (entity && !entity.isDead && !entity.destroyed) {
                this.renderer.renderEntity(entity, this.camera);
            }
        }
        
        // Render NPCs
        if (this.npcSystem && this.worldSystem) {
            const npcs = this.npcSystem.getNPCsInArea(this.worldSystem.currentAreaId);
            for (const npc of npcs) {
                this.renderer.renderEntity(npc, this.camera);
            }
        }
        
        // Render with Three.js
        this.renderer.render(deltaTime);
        
        // Render debug info (2D overlay)
        this.renderDebugInfo();
    }

    /**
     * Render debug info (2D overlay on 3D canvas)
     */
    renderDebugInfo() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 200, 100);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.currentFps}`, 10, 20);
        ctx.fillText(`Player: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)})`, 10, 35);
        ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, 10, 50);
        ctx.fillText(`Rotation: ${(this.renderer.cameraRotation * 180 / Math.PI).toFixed(0)}°`, 10, 65);
        ctx.fillText(`Area: ${this.currentArea ? this.currentArea.name : 'None'}`, 10, 80);
        ctx.fillText(`Entities: ${this.entities.length}`, 10, 95);
    }

    /**
     * Resize canvas
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        if (this.renderer && this.renderer.resize) {
            this.renderer.resize(width, height);
        }
        
        if (this.camera) {
            this.camera.width = width;
            this.camera.height = height;
        }
        
        console.log('📏 Canvas resized to:', width, 'x', height);
    }

    /**
     * Event system
     */
    emit(eventName, data = {}) {
        if (!this.eventListeners[eventName]) return;
        for (const callback of this.eventListeners[eventName]) {
            callback(data);
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!this.eventListeners[eventName]) return;
        const index = this.eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    /**
     * Show error
     */
    showError(message) {
        console.error('❌', message);
        alert('Error: ' + message);
    }

    /**
     * Test methods (same as 2D version)
     */
    testAddXP(skill, amount = 100) {
        if (!this.player || !this.skillsSystem) return;
        return this.skillsSystem.addXP(this.player, skill, amount);
    }

    testAddItem(itemId, amount = 1) {
        if (!this.inventorySystem || !this.player) return;
        return this.inventorySystem.addItem(this.player, itemId, amount);
    }

    testSpawnEnemy(enemyType, level = 1) {
        if (!this.combatSystem || !this.player) return;
        
        const spawnX = this.player.x + 5;
        const spawnY = this.player.y;
        
        const enemy = new Enemy({
            type: enemyType,
            x: spawnX,
            y: spawnY,
            level: level,
            gameEngine: this
        });
        
        this.entities.push(enemy);
        
        if (this.spatialGrid) {
            this.spatialGrid.insert(enemy);
        }
        
        console.log(`🐺 Spawned ${enemyType} (Lv${level}) at (${spawnX}, ${spawnY})`);
        return enemy;
    }

    testPlayerAttack() {
        if (!this.combatSystem || !this.player) return;
        
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        const searchEntities = this.spatialGrid 
            ? this.spatialGrid.getEntitiesInRadius(this.player.x, this.player.y, 20)
            : this.entities;
        
        for (const entity of searchEntities) {
            if (entity.type === 'enemy') {
                const dx = entity.x - this.player.x;
                const dy = entity.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = entity;
                }
            }
        }
        
        if (!nearestEnemy) {
            console.log('⚠️ No enemies nearby. Press 6 to spawn a goblin.');
            return;
        }
        
        return this.combatSystem.processAttack(this.player, nearestEnemy);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        
        window.removeEventListener('resize', this.resizeCanvas);
        
        if (this.inputHandler) this.inputHandler.destroy();
        if (this.renderer) this.renderer.dispose();
        
        console.log('🗑️ GameEngine3D destroyed');
    }
}

// Make available globally
window.GameEngine3D = GameEngine3D;
