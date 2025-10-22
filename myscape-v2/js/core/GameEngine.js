/**
 * GameEngine.js - Main Game Loop and Coordinator
 * Manages all game systems, update loop, and event handling
 */

class GameEngine {
    constructor() {
        // Core components
        this.canvas = null;
        this.ctx = null;
        this.renderer = null;
        this.camera = null;
        this.inputHandler = null;
        
        // Game configuration
        this.gameConfig = null;
        
        // Game systems
        this.skillsSystem = null;
        this.inventorySystem = null;
        this.equipmentSystem = null;
        this.combatSystem = null;
        this.worldSystem = null;
        this.questSystem = null;
        this.npcSystem = null;
        this.shopSystem = null;
        this.bankingSystem = null;
        
        // UI managers
        this.uiManager = null;
        
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
        this.fpsInterval = 1000 / this.fps;
        this.then = Date.now();
        
        // Event system
        this.eventListeners = {};
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        
        console.log('🎮 GameEngine initialized');
    }

    /**
     * Initialize the game engine
     * Sets up canvas, systems, and starts the game loop
     */
    async init(canvasId) {
        console.log('🚀 Starting game initialization...');
        
        try {
            // Setup canvas
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas with id '${canvasId}' not found`);
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            
            // Initialize core components
            console.log('📐 Initializing renderer...');
            this.renderer = new Renderer(this.canvas, this.ctx);
            
            console.log('📷 Initializing camera...');
            this.camera = new Camera(0, 0, this.canvas.width, this.canvas.height);
            
            console.log('🖱️ Initializing input handler...');
            this.inputHandler = new InputHandler(this.canvas);
            this.setupInputHandlers();
            
            // Initialize game systems (will be added in later phases)
            console.log('⚙️ Initializing game systems...');
            await this.initializeSystems();
            
            // Create player
            console.log('🧙 Creating player...');
            this.createPlayer();
            
            // Load initial area
            console.log('🗺️ Loading initial area...');
            await this.loadInitialArea();
            
            // Setup window event listeners
            window.addEventListener('resize', () => this.resizeCanvas());
            window.addEventListener('blur', () => this.pause());
            window.addEventListener('focus', () => this.resume());
            
            console.log('✅ Game initialization complete!');
            
            // Start the game loop
            this.start();
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    /**
     * Initialize all game systems
     */
    async initializeSystems() {
        // Load game configuration
        if (typeof GameConfig === 'undefined') {
            console.error('GameConfig not loaded!');
            throw new Error('GameConfig is required');
        }
        
        // Store game config reference
        this.gameConfig = GameConfig;
        
        // Phase 2: Skills and Inventory (COMPLETED)
        console.log('  📊 Initializing Skills System...');
        this.skillsSystem = new SkillsSystem(this);
        this.skillsSystem.init(this.gameConfig);
        
        console.log('  🎒 Initializing Inventory System...');
        this.inventorySystem = new InventorySystem(this);
        this.inventorySystem.init(this.gameConfig);
        
        // Phase 2: UI Manager (COMPLETED)
        console.log('  🖥️ Initializing UI Manager...');
        this.uiManager = new UIManager(this);
        this.uiManager.init();
        
        // Phase 3: World (COMPLETED)
        console.log('  🗺️ Initializing World System...');
        this.worldSystem = new WorldSystem(this);
        this.worldSystem.init(GameConfig);
        
        // Phase 4: Combat (COMPLETED)
        console.log('  ⚔️ Initializing Combat System...');
        this.combatSystem = new CombatSystem(this);
        this.combatSystem.init(this.gameConfig);
        
        // Phase 5: Equipment (TODO)
        // this.equipmentSystem = new EquipmentSystem(this);
        
        // Phase 6: Banking & Shopping (TODO)
        // Systems will be initialized as they're implemented
        // For now, just placeholder for future systems
        
        // Phase 2: Skills and Inventory
        // this.skillsSystem = new SkillsSystem(this.player);
        // this.inventorySystem = new InventorySystem(28);
        
        // Phase 3: World
        // this.worldSystem = new WorldSystem(this);
        
        // Phase 4: Combat
        // this.combatSystem = new CombatSystem(this);
        
        // Phase 5: Equipment
        // this.equipmentSystem = new EquipmentSystem(this);
        
        // Phase 6: Banking & Shopping
        // this.bankingSystem = new BankingSystem(400);
        // this.npcSystem = new NPCSystem(this);
        // this.shopSystem = new ShopSystem(this);
        
        // Phase 7: Quests (TODO)
        // this.questSystem = new QuestSystem(this);
        
        console.log('⚙️ Phase 2 systems initialized successfully');
        // Phase 7: Quests
        // this.questSystem = new QuestSystem(this);
        
        // Phase 8: UI
        // this.uiManager = new UIManager(this);
        
        console.log('⚙️ Systems initialized (placeholders for now)');
    }

    /**
     * Create the player entity
     */
    createPlayer() {
        // Create player using Player.js class (Phase 2 implementation)
        this.player = new Player({
            x: 25,
            y: 25,
            speed: 5,
            username: window.currentUser?.displayName || 'Player'
        });
        
        // Set camera to follow player
        this.camera.follow(this.player);
        
        console.log('🧙 Player created at position:', this.player.x, this.player.y);
        console.log('  Skills:', Object.keys(this.player.skills).length, 'skills initialized');
        console.log('  Inventory:', this.player.inventory.length, 'slots');
    }

    /**
     * Load the initial game area
     */
    async loadInitialArea() {
        // Use WorldSystem to load Lumbridge as starting area
        if (this.worldSystem) {
            this.currentArea = await this.worldSystem.loadArea('lumbridge');
            console.log('🗺️ Initial area loaded:', this.currentArea.name);
        } else {
            // Fallback: Generate simple area
            this.currentArea = {
                name: 'Lumbridge',
                width: 50,
                height: 50,
                tiles: []
            };
            
            // Generate simple tile grid
            for (let y = 0; y < this.currentArea.height; y++) {
                this.currentArea.tiles[y] = [];
                for (let x = 0; x < this.currentArea.width; x++) {
                    this.currentArea.tiles[y][x] = {
                        type: 'grass',
                        walkable: true
                    };
                }
            }
            
            console.log('🗺️ Fallback area loaded:', this.currentArea.name);
        }
    }

    /**
     * Setup input event handlers
     */
    setupInputHandlers() {
        // Mouse click - move player
        this.inputHandler.onMouseClick((x, y) => {
            const worldPos = this.renderer.screenToWorld(x, y, this.camera);
            this.movePlayerTo(worldPos.x, worldPos.y);
        });
        
        // Right click - context menu (placeholder)
        this.inputHandler.onContextMenu((x, y) => {
            const worldPos = this.renderer.screenToWorld(x, y, this.camera);
            console.log('Right clicked at world position:', worldPos);
            // Context menu will be implemented in Phase 8
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
            case ' ': // Spacebar
                // Could be used for quick actions
                break;
            
            // TEST SHORTCUTS (Phase 2 testing)
            case '1': // Test add XP to Attack
                this.testAddXP('attack', 100);
                break;
            case '2': // Test add XP to Woodcutting
                this.testAddXP('woodcutting', 50);
                break;
            case '3': // Test add XP to Mining
                this.testAddXP('mining', 75);
                break;
            case '4': // Test add item (logs)
                this.testAddItem('logs', 1);
                break;
            case '5': // Test add item (bronze sword)
                this.testAddItem('bronze_sword', 1);
                break;
            case '6': // Test spawn enemy (goblin)
                this.testSpawnEnemy('goblin', 5);
                break;
            case '7': // Test player attack
                this.testPlayerAttack();
                break;
            
            // Add more keyboard shortcuts as needed
        }
    }

    /**
     * Move player to target position
     */
    movePlayerTo(targetX, targetY) {
        // Clamp to world bounds
        targetX = Math.max(0, Math.min(this.currentArea.width - 1, targetX));
        targetY = Math.max(0, Math.min(this.currentArea.height - 1, targetY));
        
        this.player.targetX = targetX;
        this.player.targetY = targetY;
        this.player.isMoving = true;
        
        console.log('🚶 Player moving to:', targetX, targetY);
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.then = Date.now();
        
        console.log('▶️ Game loop started');
        
        // Start the main game loop
        this.gameLoop();
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game loop stopped');
    }

    /**
     * Pause the game
     */
    pause() {
        this.isPaused = true;
        console.log('⏸️ Game paused');
        this.emit('game_paused');
    }

    /**
     * Resume the game
     */
    resume() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.then = Date.now(); // Reset timing
        console.log('▶️ Game resumed');
        this.emit('game_resumed');
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * Main game loop - runs at 60 FPS
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
        
        // Calculate delta time
        const now = Date.now();
        const elapsed = now - this.then;
        
        // FPS throttling
        if (elapsed > this.fpsInterval) {
            this.then = now - (elapsed % this.fpsInterval);
            
            // Calculate actual delta time in seconds
            const currentTime = performance.now();
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            // Update FPS counter
            this.frameCount++;
            if (now - this.lastFpsUpdate >= 1000) {
                this.currentFps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }
            
            // Only update and render if not paused
            if (!this.isPaused) {
                this.update(this.deltaTime);
                this.render();
            }
        }
    }

    /**
     * Update all game systems
     */
    update(deltaTime) {
        // Update player (using Player.js update method)
        if (this.player && this.player.update) {
            this.player.update(deltaTime);
        }
        
        // Update camera
        this.camera.update(deltaTime);
        
        // Update Phase 2 systems
        if (this.skillsSystem) this.skillsSystem.update(deltaTime);
        if (this.inventorySystem) this.inventorySystem.update(deltaTime);
        if (this.uiManager) this.uiManager.update(deltaTime);
        
        // Update Phase 3 systems
        if (this.worldSystem) this.worldSystem.update(deltaTime);
        
        // Update Phase 4 systems
        if (this.combatSystem) this.combatSystem.update(deltaTime);
        
        // Update future game systems (Phase 5+)
        // if (this.npcSystem) this.npcSystem.update(deltaTime);
        
        // Update entities
        this.updateEntities(deltaTime);
    }

    /**
     * Update player movement and actions
     */
    updatePlayer(deltaTime) {
        if (!this.player.isMoving) return;
        
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) {
            // Reached destination
            this.player.x = this.player.targetX;
            this.player.y = this.player.targetY;
            this.player.isMoving = false;
            this.emit('player_arrived', { x: this.player.x, y: this.player.y });
        } else {
            // Move towards target
            const moveDistance = this.player.speed * deltaTime;
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            this.player.x += moveX;
            this.player.y += moveY;
            
            // Update direction
            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.player.direction = dy > 0 ? 'down' : 'up';
            }
        }
    }

    /**
     * Update all entities
     */
    updateEntities(deltaTime) {
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render world
        if (this.currentArea) {
            this.renderer.renderWorld(this.currentArea, this.camera, this.entities);
        }
        
        // Render player
        this.renderer.renderEntity(this.player, this.camera);
        
        // Render UI overlays (Phase 2)
        if (this.uiManager) {
            this.uiManager.render(this.ctx);
        }
        
        // Render debug info
        this.renderDebugInfo();
    }

    /**
     * Render debug information
     */
    renderDebugInfo() {
        // Show FPS and debug info in top-left corner
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 200, 80);
        
        this.ctx.fillStyle = '#0F0';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.currentFps}`, 10, 20);
        this.ctx.fillText(`Player: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)})`, 10, 35);
        this.ctx.fillText(`Camera: (${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)})`, 10, 50);
        this.ctx.fillText(`Area: ${this.currentArea ? this.currentArea.name : 'None'}`, 10, 65);
        this.ctx.fillText(`Entities: ${this.entities.length}`, 10, 80);
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.camera) {
            this.camera.width = width;
            this.camera.height = height;
        }
        
        console.log('📏 Canvas resized to:', width, 'x', height);
    }

    /**
     * Event system - Emit event
     */
    emit(eventName, data = {}) {
        if (!this.eventListeners[eventName]) return;
        
        for (const callback of this.eventListeners[eventName]) {
            callback(data);
        }
    }

    /**
     * Event system - Listen to event
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    /**
     * Event system - Remove listener
     */
    off(eventName, callback) {
        if (!this.eventListeners[eventName]) return;
        
        const index = this.eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    /**
     * Show error message to user
     */
    showError(message) {
        console.error('❌', message);
        alert('Error: ' + message);
    }

    /**
     * TEST METHOD: Add XP to player skill
     * @param {string} skill - Skill name
     * @param {number} amount - XP amount
     */
    testAddXP(skill, amount = 100) {
        if (!this.player || !this.skillsSystem) {
            console.error('Player or SkillsSystem not available');
            return;
        }
        
        const result = this.skillsSystem.addXP(this.player, skill, amount);
        console.log(`💫 Added ${amount} XP to ${skill}`);
        
        if (result.levelUp) {
            console.log(`🎉 Level up! ${skill} is now level ${result.newLevel}!`);
        }
        
        return result;
    }
    
    /**
     * TEST METHOD: Add item to inventory
     * @param {string} itemId - Item ID from GameConfig
     * @param {number} amount - Item amount
     */
    testAddItem(itemId, amount = 1) {
        if (!this.inventorySystem || !this.player) {
            console.error('Inventory system or player not available');
            return;
        }
        
        const result = this.inventorySystem.addItem(this.player, itemId, amount);
        
        if (result.success) {
            console.log(`✅ Added ${amount}x ${itemId} to inventory`);
        } else {
            console.log(`⚠️ Could only add ${result.added}/${amount} ${itemId} (inventory full)`);
        }
        
        return result;
    }
    
    /**
     * TEST METHOD: Spawn an enemy near player
     * @param {string} enemyType - Enemy type from GameConfig
     * @param {number} level - Enemy level (optional)
     */
    testSpawnEnemy(enemyType, level = 1) {
        if (!this.combatSystem || !this.player) {
            console.error('Combat system or player not available');
            return;
        }
        
        // Spawn enemy 5 tiles to the right of player
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
        console.log(`🐺 Spawned ${enemyType} (Lv${level}) at (${spawnX}, ${spawnY})`);
        
        return enemy;
    }
    
    /**
     * TEST METHOD: Test player attack on nearest enemy
     */
    testPlayerAttack() {
        if (!this.combatSystem || !this.player) {
            console.error('Combat system or player not available');
            return;
        }
        
        // Find nearest enemy
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        for (const entity of this.entities) {
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
        
        console.log(`⚔️ Attacking ${nearestEnemy.type} (${minDistance.toFixed(1)} tiles away)`);
        
        // Process the attack
        const result = this.combatSystem.processAttack(this.player, nearestEnemy);
        
        if (result.hit) {
            console.log(`💥 Hit for ${result.damage} damage!`);
        } else {
            console.log(`❌ Attack missed!`);
        }
        
        return result;
    }
    
    /**
     * Clean up and destroy the engine
     */
    destroy() {
        this.stop();
        
        // Remove event listeners
        window.removeEventListener('resize', this.resizeCanvas);
        window.removeEventListener('blur', this.pause);
        window.removeEventListener('focus', this.resume);
        
        // Destroy systems
        if (this.inputHandler) this.inputHandler.destroy();
        
        console.log('🗑️ GameEngine destroyed');
    }
}

// Make available globally
window.GameEngine = GameEngine;
