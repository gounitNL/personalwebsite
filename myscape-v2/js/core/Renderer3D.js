/**
 * Renderer3D.js - Three.js 3D Rendering Engine
 * Converts MyScape v2 from 2D isometric to full 3D using Three.js
 * Features: Low-poly OSRS-style graphics, click-to-move with raycasting, camera controls
 */

class Renderer3D {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Three.js core components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        
        // Game world
        this.terrainMesh = null;
        this.entityMeshes = new Map(); // entity.id -> THREE.Mesh
        this.tileMeshes = new Map(); // "x,y" -> THREE.Mesh
        
        // Camera control
        this.cameraDistance = 15;
        this.cameraHeight = 10;
        this.cameraAngle = Math.PI / 4; // 45 degrees
        this.cameraRotation = 0; // Rotation around player (radians)
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        
        // Arrow key camera control
        this.cameraRotationSpeed = 2.0; // radians per second
        this.arrowKeysPressed = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Materials cache
        this.materials = {};
        
        // Geometries cache (for performance)
        this.geometries = {
            tile: null,
            player: null,
            tree: null,
            rock: null,
            npc: null
        };
        
        console.log('🎨 3D Renderer initialized');
        this.init();
    }

    /**
     * Initialize Three.js scene
     */
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 30, 60); // Fog for distant tiles
        
        // Create camera (perspective for 3D)
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            this.canvas.width / this.canvas.height, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        this.updateCameraPosition();
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.canvas.width, this.canvas.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        
        // Initialize materials
        this.initMaterials();
        
        // Initialize geometries
        this.initGeometries();
        
        // Add lights
        this.initLights();
        
        // Setup arrow key controls
        this.setupKeyboardControls();
        
        console.log('✅ Three.js scene initialized');
    }

    /**
     * Initialize materials for different objects
     */
    initMaterials() {
        // Grass tile
        this.materials.grass = new THREE.MeshLambertMaterial({
            color: 0x7CB342,
            flatShading: true
        });
        
        // Dirt tile
        this.materials.dirt = new THREE.MeshLambertMaterial({
            color: 0x8D6E63,
            flatShading: true
        });
        
        // Water tile
        this.materials.water = new THREE.MeshLambertMaterial({
            color: 0x29B6F6,
            flatShading: true,
            transparent: true,
            opacity: 0.8
        });
        
        // Player
        this.materials.player = new THREE.MeshLambertMaterial({
            color: 0x4169E1,
            flatShading: true
        });
        
        // Enemy
        this.materials.enemy = new THREE.MeshLambertMaterial({
            color: 0xE53935,
            flatShading: true
        });
        
        // NPC
        this.materials.npc = new THREE.MeshLambertMaterial({
            color: 0xFFB300,
            flatShading: true
        });
        
        // Tree
        this.materials.tree_trunk = new THREE.MeshLambertMaterial({
            color: 0x5D4037,
            flatShading: true
        });
        
        this.materials.tree_leaves = new THREE.MeshLambertMaterial({
            color: 0x2E7D32,
            flatShading: true
        });
        
        // Rock
        this.materials.rock = new THREE.MeshLambertMaterial({
            color: 0x78909C,
            flatShading: true
        });
        
        // Target indicator (click marker)
        this.materials.target = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.6
        });
    }

    /**
     * Initialize reusable geometries
     */
    initGeometries() {
        // Tile geometry (flat square)
        this.geometries.tile = new THREE.PlaneGeometry(1, 1);
        
        // Player geometry (capsule-like shape)
        this.geometries.player = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
        
        // Tree trunk
        this.geometries.tree_trunk = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 6);
        
        // Tree leaves (cone)
        this.geometries.tree_leaves = new THREE.ConeGeometry(0.4, 0.8, 6);
        
        // Rock (dodecahedron for natural look)
        this.geometries.rock = new THREE.DodecahedronGeometry(0.3, 0);
        
        // NPC (box for now)
        this.geometries.npc = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    }

    /**
     * Initialize lighting
     */
    initLights() {
        // Ambient light (soft global illumination)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 10);
        dirLight.castShadow = true;
        
        // Shadow settings
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        
        this.scene.add(dirLight);
        
        // Hemisphere light (sky/ground color)
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x5D4037, 0.3);
        this.scene.add(hemiLight);
    }

    /**
     * Setup keyboard controls for camera
     */
    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.arrowKeysPressed.left = true;
                    break;
                case 'ArrowRight':
                    this.arrowKeysPressed.right = true;
                    break;
                case 'ArrowUp':
                    this.arrowKeysPressed.up = true;
                    break;
                case 'ArrowDown':
                    this.arrowKeysPressed.down = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.arrowKeysPressed.left = false;
                    break;
                case 'ArrowRight':
                    this.arrowKeysPressed.right = false;
                    break;
                case 'ArrowUp':
                    this.arrowKeysPressed.up = false;
                    break;
                case 'ArrowDown':
                    this.arrowKeysPressed.down = false;
                    break;
            }
        });
    }

    /**
     * Update camera controls based on arrow keys
     */
    updateCameraControls(deltaTime) {
        if (this.arrowKeysPressed.left) {
            this.cameraRotation += this.cameraRotationSpeed * deltaTime;
        }
        if (this.arrowKeysPressed.right) {
            this.cameraRotation -= this.cameraRotationSpeed * deltaTime;
        }
        if (this.arrowKeysPressed.up) {
            this.cameraDistance = Math.max(5, this.cameraDistance - 10 * deltaTime);
        }
        if (this.arrowKeysPressed.down) {
            this.cameraDistance = Math.min(30, this.cameraDistance + 10 * deltaTime);
        }
    }

    /**
     * Update camera position to follow player
     */
    updateCameraPosition() {
        // Calculate camera position based on rotation and distance
        const x = this.cameraTarget.x + Math.cos(this.cameraRotation) * this.cameraDistance;
        const z = this.cameraTarget.z + Math.sin(this.cameraRotation) * this.cameraDistance;
        const y = this.cameraTarget.y + this.cameraHeight;
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTarget);
    }

    /**
     * Set camera target (usually player position)
     */
    setCameraTarget(worldX, worldY) {
        this.cameraTarget.set(worldX, 0, worldY);
    }

    /**
     * Render entire world (tiles)
     */
    renderWorld(worldData, camera) {
        if (!worldData || !worldData.tiles) {
            console.warn('Renderer3D: Invalid worldData');
            return;
        }
        
        // Update camera target based on 2D camera position
        if (camera && camera.x !== undefined && camera.y !== undefined) {
            this.setCameraTarget(camera.x, camera.y);
        }
        
        // Create terrain once (only on first call)
        if (this.tileMeshes.size === 0) {
            this.createTerrain(worldData);
            this.terrainMesh = true; // Mark as created
        }
    }

    /**
     * Create 3D terrain mesh from tile data
     */
    createTerrain(worldData) {
        const width = worldData.width || 50;
        const height = worldData.height || 50;
        
        // Create tile meshes
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = worldData.tiles[y] && worldData.tiles[y][x];
                if (!tile) continue;
                
                const key = `${x},${y}`;
                
                // Skip if already created
                if (this.tileMeshes.has(key)) continue;
                
                // Get material based on tile type
                const material = this.materials[tile.type] || this.materials.grass;
                
                // Create tile mesh
                const tileMesh = new THREE.Mesh(this.geometries.tile, material);
                tileMesh.rotation.x = -Math.PI / 2; // Rotate to horizontal
                tileMesh.position.set(x, 0, y);
                tileMesh.receiveShadow = true;
                
                // Store reference
                this.tileMeshes.set(key, tileMesh);
                this.scene.add(tileMesh);
            }
        }
        
        console.log(`✅ Created ${this.tileMeshes.size} terrain tiles`);
    }

    /**
     * Render entity (player, NPC, resource, etc.)
     */
    renderEntity(entity, camera) {
        if (!entity || entity.x === undefined || entity.y === undefined) {
            return;
        }
        
        const entityId = entity.id || `${entity.type}_${entity.x}_${entity.y}`;
        
        // Get or create mesh for entity
        let mesh = this.entityMeshes.get(entityId);
        
        if (!mesh) {
            mesh = this.createEntityMesh(entity);
            if (mesh) {
                this.entityMeshes.set(entityId, mesh);
                this.scene.add(mesh);
            }
        }
        
        // Update mesh position
        if (mesh) {
            mesh.position.set(entity.x, 0.4, entity.y); // Elevate slightly above ground
            
            // Update visibility based on entity state
            mesh.visible = !entity.isDead && !entity.destroyed;
        }
    }

    /**
     * Create 3D mesh for entity based on type
     */
    createEntityMesh(entity) {
        let mesh;
        
        switch(entity.type) {
            case 'player':
                mesh = new THREE.Mesh(this.geometries.player, this.materials.player);
                mesh.castShadow = true;
                break;
                
            case 'enemy':
                mesh = new THREE.Mesh(this.geometries.player, this.materials.enemy);
                mesh.castShadow = true;
                mesh.scale.set(0.8, 0.8, 0.8); // Slightly smaller
                break;
                
            case 'npc':
                mesh = new THREE.Mesh(this.geometries.npc, this.materials.npc);
                mesh.castShadow = true;
                break;
                
            case 'resource':
                // Check resource subtype
                if (entity.resourceType === 'tree' || entity.name?.toLowerCase().includes('tree')) {
                    mesh = this.createTreeMesh();
                } else if (entity.resourceType === 'rock' || entity.name?.toLowerCase().includes('rock')) {
                    mesh = this.createRockMesh();
                } else {
                    // Generic resource
                    mesh = new THREE.Mesh(this.geometries.rock, this.materials.rock);
                    mesh.castShadow = true;
                }
                break;
                
            default:
                // Generic entity
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(0.4, 0.4, 0.4),
                    this.materials.npc
                );
                mesh.castShadow = true;
                break;
        }
        
        return mesh;
    }

    /**
     * Create tree mesh (trunk + leaves)
     */
    createTreeMesh() {
        const group = new THREE.Group();
        
        // Trunk
        const trunk = new THREE.Mesh(this.geometries.tree_trunk, this.materials.tree_trunk);
        trunk.position.y = 0.4;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Leaves
        const leaves = new THREE.Mesh(this.geometries.tree_leaves, this.materials.tree_leaves);
        leaves.position.y = 1.0;
        leaves.castShadow = true;
        group.add(leaves);
        
        return group;
    }

    /**
     * Create rock mesh
     */
    createRockMesh() {
        const mesh = new THREE.Mesh(this.geometries.rock, this.materials.rock);
        mesh.position.y = 0.15;
        mesh.castShadow = true;
        mesh.rotation.set(
            Math.random() * 0.5,
            Math.random() * Math.PI * 2,
            Math.random() * 0.5
        );
        return mesh;
    }

    /**
     * Handle mouse click for click-to-move
     */
    getWorldPositionFromClick(mouseX, mouseY) {
        // Convert mouse position to normalized device coordinates (-1 to +1)
        this.mouse.x = (mouseX / this.canvas.width) * 2 - 1;
        this.mouse.y = -(mouseY / this.canvas.height) * 2 + 1;
        
        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Find intersection with ground plane (y = 0)
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        this.raycaster.ray.intersectPlane(plane, intersectionPoint);
        
        if (intersectionPoint) {
            return {
                x: Math.floor(intersectionPoint.x),
                y: Math.floor(intersectionPoint.z)
            };
        }
        
        return null;
    }

    /**
     * Main render function
     */
    render(deltaTime) {
        // Update camera controls
        this.updateCameraControls(deltaTime);
        this.updateCameraPosition();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Resize renderer when canvas size changes
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        console.log('📏 3D Renderer resized to:', width, 'x', height);
    }

    /**
     * Clean up entity mesh
     */
    removeEntity(entityId) {
        const mesh = this.entityMeshes.get(entityId);
        if (mesh) {
            this.scene.remove(mesh);
            this.entityMeshes.delete(entityId);
            
            // Dispose geometry and material if needed
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
    }

    /**
     * Clear all meshes
     */
    clear() {
        // Remove all entity meshes
        for (const [id, mesh] of this.entityMeshes) {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
        this.entityMeshes.clear();
        
        // Remove all tile meshes
        for (const [key, mesh] of this.tileMeshes) {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
        this.tileMeshes.clear();
        
        this.terrainMesh = null;
    }

    /**
     * Dispose renderer and clean up resources
     */
    dispose() {
        this.clear();
        
        // Dispose geometries
        for (const key in this.geometries) {
            if (this.geometries[key]) {
                this.geometries[key].dispose();
            }
        }
        
        // Dispose materials
        for (const key in this.materials) {
            if (this.materials[key]) {
                this.materials[key].dispose();
            }
        }
        
        // Dispose renderer
        this.renderer.dispose();
        
        console.log('🗑️ 3D Renderer disposed');
    }
}

// Make available globally
window.Renderer3D = Renderer3D;
