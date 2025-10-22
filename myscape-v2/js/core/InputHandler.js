/**
 * InputHandler.js - User Input Management
 * Handles mouse, keyboard, and touch input events
 */

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Mouse state
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.mouseButton = null;
        
        // Keyboard state
        this.keys = {};
        
        // Touch state
        this.touches = [];
        
        // Event callbacks
        this.clickCallbacks = [];
        this.contextMenuCallbacks = [];
        this.mouseMoveCallbacks = [];
        this.keyPressCallbacks = [];
        this.keyDownCallbacks = [];
        this.keyUpCallbacks = [];
        
        // Double-click detection
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300; // ms
        
        // Drag detection
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.isDragging = false;
        this.dragThreshold = 5; // pixels
        
        this.init();
        
        console.log('🖱️ InputHandler initialized');
    }

    /**
     * Initialize event listeners
     */
    init() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Touch events (for mobile support)
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent right-click context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.mouseDown = true;
        this.mouseButton = e.button;
        
        // Track drag start position
        this.dragStartX = this.mouseX;
        this.dragStartY = this.mouseY;
        this.isDragging = false;
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Only trigger click if not dragging
        if (!this.isDragging && this.mouseButton === 0) { // Left click
            const now = Date.now();
            const isDoubleClick = (now - this.lastClickTime) < this.doubleClickThreshold;
            
            // Trigger click callbacks
            for (const callback of this.clickCallbacks) {
                callback(this.mouseX, this.mouseY, isDoubleClick);
            }
            
            this.lastClickTime = now;
        }
        
        this.mouseDown = false;
        this.mouseButton = null;
        this.isDragging = false;
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        // Check for drag
        if (this.mouseDown) {
            const dx = this.mouseX - this.dragStartX;
            const dy = this.mouseY - this.dragStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.dragThreshold) {
                this.isDragging = true;
            }
        }
        
        // Trigger mouse move callbacks
        for (const callback of this.mouseMoveCallbacks) {
            callback(this.mouseX, this.mouseY, this.isDragging);
        }
    }

    /**
     * Handle right-click context menu
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Trigger context menu callbacks
        for (const callback of this.contextMenuCallbacks) {
            callback(x, y);
        }
    }

    /**
     * Handle mouse wheel event
     */
    handleWheel(e) {
        e.preventDefault();
        
        // Can be used for zooming in Phase 8
        const delta = e.deltaY;
        // Emit wheel event if needed
    }

    /**
     * Handle key down event
     */
    handleKeyDown(e) {
        this.keys[e.key] = true;
        
        // Trigger key down callbacks
        for (const callback of this.keyDownCallbacks) {
            callback(e.key, e);
        }
        
        // Don't trigger key press for modifier keys
        if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
            for (const callback of this.keyPressCallbacks) {
                callback(e.key, e);
            }
        }
    }

    /**
     * Handle key up event
     */
    handleKeyUp(e) {
        this.keys[e.key] = false;
        
        // Trigger key up callbacks
        for (const callback of this.keyUpCallbacks) {
            callback(e.key, e);
        }
    }

    /**
     * Handle touch start event
     */
    handleTouchStart(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        this.touches = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        }));
        
        // Treat first touch as mouse down
        if (this.touches.length > 0) {
            this.mouseX = this.touches[0].x;
            this.mouseY = this.touches[0].y;
            this.mouseDown = true;
            this.dragStartX = this.mouseX;
            this.dragStartY = this.mouseY;
        }
    }

    /**
     * Handle touch move event
     */
    handleTouchMove(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        this.touches = Array.from(e.touches).map(touch => ({
            id: touch.identifier,
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        }));
        
        // Update mouse position from first touch
        if (this.touches.length > 0) {
            this.mouseX = this.touches[0].x;
            this.mouseY = this.touches[0].y;
            
            // Check for drag
            const dx = this.mouseX - this.dragStartX;
            const dy = this.mouseY - this.dragStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.dragThreshold) {
                this.isDragging = true;
            }
        }
    }

    /**
     * Handle touch end event
     */
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Treat as mouse up (click)
        if (!this.isDragging && this.touches.length === 1) {
            for (const callback of this.clickCallbacks) {
                callback(this.mouseX, this.mouseY, false);
            }
        }
        
        this.mouseDown = false;
        this.isDragging = false;
        this.touches = [];
    }

    /**
     * Register click callback
     */
    onMouseClick(callback) {
        this.clickCallbacks.push(callback);
    }

    /**
     * Register context menu callback
     */
    onContextMenu(callback) {
        this.contextMenuCallbacks.push(callback);
    }

    /**
     * Register mouse move callback
     */
    onMouseMove(callback) {
        this.mouseMoveCallbacks.push(callback);
    }

    /**
     * Register key press callback
     */
    onKeyPress(callback) {
        this.keyPressCallbacks.push(callback);
    }

    /**
     * Register key down callback
     */
    onKeyDown(callback) {
        this.keyDownCallbacks.push(callback);
    }

    /**
     * Register key up callback
     */
    onKeyUp(callback) {
        this.keyUpCallbacks.push(callback);
    }

    /**
     * Check if a key is currently pressed
     */
    isKeyDown(key) {
        return this.keys[key] === true;
    }

    /**
     * Check if any of the specified keys are pressed
     */
    isAnyKeyDown(...keys) {
        return keys.some(key => this.keys[key] === true);
    }

    /**
     * Get current mouse position
     */
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * Get mouse position in world coordinates
     */
    getMouseWorldPosition(camera, renderer) {
        if (!camera || !renderer) {
            console.warn('Camera or renderer not provided for world position conversion');
            return { x: 0, y: 0 };
        }
        
        return renderer.screenToWorld(this.mouseX, this.mouseY, camera);
    }

    /**
     * Check if mouse is over a specific area
     */
    isMouseOver(x, y, width, height) {
        return this.mouseX >= x &&
               this.mouseX <= x + width &&
               this.mouseY >= y &&
               this.mouseY <= y + height;
    }

    /**
     * Set cursor style
     */
    setCursor(cursor) {
        this.canvas.style.cursor = cursor;
    }

    /**
     * Reset cursor to default
     */
    resetCursor() {
        this.canvas.style.cursor = 'crosshair';
    }

    /**
     * Enable/disable input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            // Clear all input state
            this.keys = {};
            this.mouseDown = false;
            this.isDragging = false;
        }
    }

    /**
     * Clean up and remove event listeners
     */
    destroy() {
        // Remove mouse listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        
        // Remove keyboard listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Remove touch listeners
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        
        console.log('🖱️ InputHandler destroyed');
    }
}

// Make available globally
window.InputHandler = InputHandler;
