/**
 * Camera3D.js - 3D Camera Controller
 * Manages 3D camera movement, following, and controls
 * Compatible with existing 2D Camera API for easy integration
 */

class Camera3D {
    constructor(x, y, width, height) {
        // Position (world coordinates - x,y in 2D terms, maps to x,z in 3D)
        this.x = x;
        this.y = y;
        
        // Viewport dimensions
        this.width = width;
        this.height = height;
        
        // Target to follow
        this.target = null;
        
        // Smoothing
        this.smoothing = 0.1;
        this.targetX = x;
        this.targetY = y;
        
        // 3D camera properties
        this.distance = 15; // Distance from target
        this.height3D = 10; // Height above target
        this.angle = Math.PI / 4; // Angle looking down
        this.rotation = 0; // Rotation around target
        
        // Camera bounds (optional)
        this.bounds = null;
        
        // Camera shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        
        console.log('📷 3D Camera initialized at:', x, y);
    }

    /**
     * Set target for camera to follow
     */
    follow(target) {
        this.target = target;
        
        if (target) {
            this.x = target.x;
            this.y = target.y;
            this.targetX = this.x;
            this.targetY = this.y;
            
            console.log('📷 3D Camera following:', target.name || 'entity', 'at position:', this.x, this.y);
        }
    }

    /**
     * Update camera position
     */
    update(deltaTime) {
        // Update target position if following an entity
        if (this.target) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }
        
        // Smooth camera movement
        const smoothFactor = 1 - Math.pow(1 - this.smoothing, deltaTime * 60);
        this.x += (this.targetX - this.x) * smoothFactor;
        this.y += (this.targetY - this.y) * smoothFactor;
        
        // Apply bounds if set
        if (this.bounds) {
            this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
            this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));
        }
        
        // Update camera shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            
            const intensity = this.shakeIntensity * (this.shakeDuration / 0.5);
            this.shakeX = (Math.random() - 0.5) * intensity * 2;
            this.shakeY = (Math.random() - 0.5) * intensity * 2;
            
            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
                this.shakeIntensity = 0;
            }
        }
    }

    /**
     * Trigger camera shake
     */
    shake(intensity = 10, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    /**
     * Set camera bounds
     */
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
    }

    /**
     * Clear bounds
     */
    clearBounds() {
        this.bounds = null;
    }

    /**
     * Move camera to position
     */
    moveTo(x, y, instant = false) {
        this.targetX = x;
        this.targetY = y;
        
        if (instant) {
            this.x = x;
            this.y = y;
        }
    }

    /**
     * Center camera on position
     */
    centerOn(worldX, worldY, instant = false) {
        this.moveTo(worldX, worldY, instant);
        this.target = null;
    }

    /**
     * Get camera position with shake
     */
    getX() {
        return this.x + this.shakeX;
    }

    getY() {
        return this.y + this.shakeY;
    }

    /**
     * Get viewport bounds in world coordinates
     */
    getBounds() {
        const tilesWide = 20;
        const tilesHigh = 20;
        
        return {
            left: this.x - tilesWide / 2,
            right: this.x + tilesWide / 2,
            top: this.y - tilesHigh / 2,
            bottom: this.y + tilesHigh / 2
        };
    }

    /**
     * Check if position is visible
     */
    isVisible(worldX, worldY, margin = 2) {
        const bounds = this.getBounds();
        
        return worldX >= bounds.left - margin &&
               worldX <= bounds.right + margin &&
               worldY >= bounds.top - margin &&
               worldY <= bounds.bottom + margin;
    }

    /**
     * Pan camera
     */
    pan(deltaX, deltaY) {
        this.targetX += deltaX;
        this.targetY += deltaY;
        this.target = null;
    }

    /**
     * Get distance to point
     */
    getDistanceToPoint(worldX, worldY) {
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Transition to position
     */
    transitionTo(worldX, worldY, duration = 1.0) {
        const originalSmoothing = this.smoothing;
        this.smoothing = 0.02;
        
        this.targetX = worldX;
        this.targetY = worldY;
        
        setTimeout(() => {
            this.smoothing = originalSmoothing;
        }, duration * 1000);
    }

    /**
     * Set zoom (for 3D, this adjusts distance)
     */
    setZoom(zoom) {
        this.distance = 15 / zoom;
    }

    /**
     * Lock/unlock camera
     */
    lock() {
        this.locked = true;
        this.target = null;
    }

    unlock() {
        this.locked = false;
    }

    isLocked() {
        return this.locked === true;
    }

    /**
     * Reset camera
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.target = null;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.rotation = 0;
        this.distance = 15;
        this.locked = false;
    }

    /**
     * Get debug info
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            target: { x: this.targetX, y: this.targetY },
            following: this.target ? this.target.name : 'none',
            rotation: this.rotation,
            distance: this.distance,
            locked: this.isLocked()
        };
    }
}

// Make available globally
window.Camera3D = Camera3D;
