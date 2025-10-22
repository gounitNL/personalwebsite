/**
 * Camera.js - Camera System with Smooth Following
 * Manages viewport, smooth camera movement, and boundaries
 */

class Camera {
    constructor(x, y, width, height) {
        // Camera position (center of viewport in world coordinates)
        this.x = x;
        this.y = y;
        
        // Viewport dimensions
        this.width = width;
        this.height = height;
        
        // Target to follow (usually the player)
        this.target = null;
        
        // Camera smoothing
        this.smoothing = 0.1; // 0 = instant, 1 = no movement
        this.targetX = x;
        this.targetY = y;
        
        // Camera bounds (optional - restricts camera to world bounds)
        this.bounds = null; // { minX, maxX, minY, maxY }
        
        // Camera shake effect
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        
        // Zoom level (for future use)
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        
        // Camera offset (for centering adjustments)
        this.offsetX = 0;
        this.offsetY = 0;
        
        console.log('📷 Camera initialized at:', x, y);
    }

    /**
     * Set the target entity for the camera to follow
     */
    follow(target) {
        this.target = target;
        
        if (target) {
            // Immediately move to target
            this.x = target.x * 32; // Convert world coords to pixel coords
            this.y = target.y * 16;
            this.targetX = this.x;
            this.targetY = this.y;
            
            console.log('📷 Camera following:', target.name || 'entity');
        }
    }

    /**
     * Set camera bounds to restrict movement
     */
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
        console.log('📷 Camera bounds set:', this.bounds);
    }

    /**
     * Clear camera bounds
     */
    clearBounds() {
        this.bounds = null;
    }

    /**
     * Move camera to specific position
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
     * Update camera position
     */
    update(deltaTime) {
        // Update target position if following an entity
        if (this.target) {
            // Convert world coordinates to camera coordinates
            this.targetX = this.target.x * 32; // Tile width / 2 * 2 for isometric
            this.targetY = this.target.y * 16; // Tile height / 2 * 2 for isometric
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
            
            const intensity = this.shakeIntensity * (this.shakeDuration / 0.5); // Fade out over 0.5s
            this.shakeX = (Math.random() - 0.5) * intensity * 2;
            this.shakeY = (Math.random() - 0.5) * intensity * 2;
            
            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
                this.shakeIntensity = 0;
            }
        }
        
        // Smooth zoom (for future use)
        if (this.zoom !== this.targetZoom) {
            const zoomSpeed = 0.05;
            this.zoom += (this.targetZoom - this.zoom) * zoomSpeed;
            
            if (Math.abs(this.zoom - this.targetZoom) < 0.01) {
                this.zoom = this.targetZoom;
            }
        }
    }

    /**
     * Trigger camera shake effect
     */
    shake(intensity = 10, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.targetZoom = Math.max(0.5, Math.min(2.0, zoom)); // Clamp between 0.5x and 2x
    }

    /**
     * Get camera position with shake applied
     */
    getX() {
        return this.x + this.shakeX + this.offsetX;
    }

    getY() {
        return this.y + this.shakeY + this.offsetY;
    }

    /**
     * Get viewport bounds in world coordinates
     */
    getBounds() {
        const halfWidth = (this.width / 2) / this.zoom;
        const halfHeight = (this.height / 2) / this.zoom;
        
        return {
            left: (this.x - halfWidth) / 32,
            right: (this.x + halfWidth) / 32,
            top: (this.y - halfHeight) / 16,
            bottom: (this.y + halfHeight) / 16
        };
    }

    /**
     * Check if a world position is visible
     */
    isVisible(worldX, worldY, margin = 2) {
        const bounds = this.getBounds();
        
        return worldX >= bounds.left - margin &&
               worldX <= bounds.right + margin &&
               worldY >= bounds.top - margin &&
               worldY <= bounds.bottom + margin;
    }

    /**
     * Check if a world rectangle is visible
     */
    isRectVisible(worldX, worldY, width, height, margin = 0) {
        const bounds = this.getBounds();
        
        return worldX + width >= bounds.left - margin &&
               worldX <= bounds.right + margin &&
               worldY + height >= bounds.top - margin &&
               worldY <= bounds.bottom + margin;
    }

    /**
     * Pan camera by offset
     */
    pan(deltaX, deltaY) {
        this.targetX += deltaX;
        this.targetY += deltaY;
        
        // Stop following target when manually panning
        this.target = null;
    }

    /**
     * Center camera on position
     */
    centerOn(worldX, worldY, instant = false) {
        this.moveTo(worldX * 32, worldY * 16, instant);
        
        // Stop following target
        this.target = null;
    }

    /**
     * Get distance from camera center to point
     */
    getDistanceToPoint(worldX, worldY) {
        const camWorldX = this.x / 32;
        const camWorldY = this.y / 16;
        
        const dx = worldX - camWorldX;
        const dy = worldY - camWorldY;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Transition camera to new position
     */
    transitionTo(worldX, worldY, duration = 1.0) {
        // Store original smoothing
        const originalSmoothing = this.smoothing;
        
        // Set slower smoothing for transition
        this.smoothing = 0.02;
        
        // Set target
        this.targetX = worldX * 32;
        this.targetY = worldY * 16;
        
        // Restore smoothing after transition
        setTimeout(() => {
            this.smoothing = originalSmoothing;
        }, duration * 1000);
    }

    /**
     * Lock camera (disable following and movement)
     */
    lock() {
        this.locked = true;
        this.target = null;
    }

    /**
     * Unlock camera
     */
    unlock() {
        this.locked = false;
    }

    /**
     * Check if camera is locked
     */
    isLocked() {
        return this.locked === true;
    }

    /**
     * Reset camera to default state
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
        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.locked = false;
        
        console.log('📷 Camera reset');
    }

    /**
     * Get camera info for debugging
     */
    getDebugInfo() {
        return {
            position: { x: this.x, y: this.y },
            target: { x: this.targetX, y: this.targetY },
            following: this.target ? this.target.name : 'none',
            zoom: this.zoom,
            shake: this.shakeIntensity > 0,
            locked: this.isLocked()
        };
    }
}

// Make available globally
window.Camera = Camera;
