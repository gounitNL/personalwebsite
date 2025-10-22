/**
 * StatsPanel.js - Skills Stats Panel
 * 
 * Displays all 15 skills with levels, XP, and progress bars. Shows skill icons,
 * level numbers, XP progress, and provides hover tooltips with detailed information.
 * Organized by skill categories (Combat, Gathering, Artisan, Support).
 * 
 * @class StatsPanel
 */

class StatsPanel {
    constructor(gameEngine, uiManager) {
        this.gameEngine = gameEngine;
        this.uiManager = uiManager;
        this.player = null;
        this.skillsSystem = null;
        
        // Panel state
        this.visible = true;
        this.container = null;
        
        // Skill display order
        this.skillOrder = [
            // Combat skills
            'attack', 'strength', 'defence', 'hitpoints', 'ranged', 'prayer', 'magic',
            // Gathering skills
            'mining', 'woodcutting', 'fishing', 'hunter',
            // Artisan skills
            'smithing', 'crafting', 'fletching', 'cooking', 'firemaking', 'herblore', 'construction',
            // Support skills
            'agility', 'thieving', 'farming', 'runecraft', 'slayer'
        ];
        
        // Skill display names (capitalize)
        this.skillDisplayNames = {
            attack: 'Attack',
            strength: 'Strength',
            defence: 'Defence',
            hitpoints: 'Hitpoints',
            ranged: 'Ranged',
            prayer: 'Prayer',
            magic: 'Magic',
            mining: 'Mining',
            woodcutting: 'Woodcutting',
            fishing: 'Fishing',
            hunter: 'Hunter',
            smithing: 'Smithing',
            crafting: 'Crafting',
            fletching: 'Fletching',
            cooking: 'Cooking',
            firemaking: 'Firemaking',
            herblore: 'Herblore',
            construction: 'Construction',
            agility: 'Agility',
            thieving: 'Thieving',
            farming: 'Farming',
            runecraft: 'Runecraft',
            slayer: 'Slayer'
        };
        
        // Skill colors for visual variety
        this.skillColors = {
            attack: '#cc0000',
            strength: '#00aa00',
            defence: '#0088ff',
            hitpoints: '#ff0000',
            ranged: '#77ff00',
            prayer: '#ffdd00',
            magic: '#0088ff',
            mining: '#8855ff',
            woodcutting: '#00aa00',
            fishing: '#00aaff',
            hunter: '#aa8855',
            smithing: '#ff8800',
            crafting: '#aa5500',
            fletching: '#00cc00',
            cooking: '#ff00ff',
            firemaking: '#ff8800',
            herblore: '#00ff00',
            construction: '#8855aa',
            agility: '#0066ff',
            thieving: '#666666',
            farming: '#00ff00',
            runecraft: '#ffaa00',
            slayer: '#aa0000'
        };
        
        // Update frequency
        this.updateInterval = 0.5; // Update twice per second
        this.timeSinceUpdate = 0;
    }
    
    /**
     * Initialize the stats panel
     * @param {object} player - Player instance
     * @param {object} skillsSystem - Skills system instance
     */
    init(player, skillsSystem) {
        this.player = player;
        this.skillsSystem = skillsSystem;
        
        // Get container element
        this.container = document.getElementById('stats-container');
        if (!this.container) {
            console.error('Stats container not found');
            return;
        }
        
        // Build the stats UI
        this.buildStatsUI();
        
        console.log('StatsPanel initialized');
    }
    
    /**
     * Build the stats panel HTML structure
     */
    buildStatsUI() {
        if (!this.container) return;
        
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'stats-header';
        header.innerHTML = `
            <h3>Skills</h3>
            <div class="stats-summary">
                <div class="total-level">Total: <span id="total-level">0</span></div>
                <div class="combat-level">Combat: <span id="combat-level-display">3</span></div>
            </div>
        `;
        this.container.appendChild(header);
        
        // Create skills list
        const skillsList = document.createElement('div');
        skillsList.className = 'skills-list';
        
        // Add each skill
        for (const skillName of this.skillOrder) {
            // Skip skills that don't exist in player's skills
            if (!this.player || !this.player.skills[skillName]) {
                continue;
            }
            
            const skillItem = this.createSkillItem(skillName);
            skillsList.appendChild(skillItem);
        }
        
        this.container.appendChild(skillsList);
        
        // Initial update
        this.update();
    }
    
    /**
     * Create a skill item element
     * @param {string} skillName - Name of the skill
     * @returns {HTMLElement} Skill item element
     */
    createSkillItem(skillName) {
        const skill = this.player.skills[skillName];
        const displayName = this.skillDisplayNames[skillName] || skillName;
        const color = this.skillColors[skillName] || '#888888';
        
        // Calculate XP to next level
        const currentXP = skill.xp;
        const currentLevel = skill.level;
        const nextLevelXP = this.skillsSystem.getXPForLevel(currentLevel + 1);
        const currentLevelXP = this.skillsSystem.getXPForLevel(currentLevel);
        const xpProgress = currentXP - currentLevelXP;
        const xpRequired = nextLevelXP - currentLevelXP;
        const progressPercent = currentLevel >= 99 ? 100 : (xpProgress / xpRequired) * 100;
        
        // Create skill item
        const item = document.createElement('div');
        item.className = 'skill-item';
        item.dataset.skill = skillName;
        item.title = this.getSkillTooltip(skillName);
        
        item.innerHTML = `
            <div class="skill-icon" style="background-color: ${color}">
                ${displayName.substring(0, 2).toUpperCase()}
            </div>
            <div class="skill-info">
                <div class="skill-name">${displayName}</div>
                <div class="skill-level">Level: ${currentLevel}</div>
                <div class="skill-progress-bar">
                    <div class="skill-progress-fill" style="width: ${progressPercent}%; background-color: ${color}"></div>
                </div>
                <div class="skill-xp">${this.formatNumber(currentXP)} XP</div>
            </div>
        `;
        
        // Add click listener for details
        item.addEventListener('click', () => {
            this.showSkillDetails(skillName);
        });
        
        return item;
    }
    
    /**
     * Get skill tooltip text
     * @param {string} skillName - Name of the skill
     * @returns {string} Tooltip text
     */
    getSkillTooltip(skillName) {
        if (!this.player || !this.player.skills[skillName]) {
            return '';
        }
        
        const skill = this.player.skills[skillName];
        const displayName = this.skillDisplayNames[skillName] || skillName;
        const currentXP = skill.xp;
        const currentLevel = skill.level;
        
        if (currentLevel >= 99) {
            return `${displayName}\nLevel: ${currentLevel}\nXP: ${this.formatNumber(currentXP)}\nMAX LEVEL`;
        }
        
        const nextLevelXP = this.skillsSystem.getXPForLevel(currentLevel + 1);
        const xpRemaining = nextLevelXP - currentXP;
        
        return `${displayName}\nLevel: ${currentLevel}\nXP: ${this.formatNumber(currentXP)}\nNext level: ${this.formatNumber(xpRemaining)} XP`;
    }
    
    /**
     * Show detailed skill information
     * @param {string} skillName - Name of the skill
     */
    showSkillDetails(skillName) {
        const skill = this.player.skills[skillName];
        const displayName = this.skillDisplayNames[skillName] || skillName;
        const skillConfig = this.skillsSystem.getSkillConfig(skillName);
        
        let detailsHTML = `
            <h3>${displayName}</h3>
            <p>Level: ${skill.level}</p>
            <p>XP: ${this.formatNumber(skill.xp)}</p>
        `;
        
        if (skill.level < 99) {
            const nextLevelXP = this.skillsSystem.getXPForLevel(skill.level + 1);
            const xpRemaining = nextLevelXP - skill.xp;
            detailsHTML += `<p>Next level: ${this.formatNumber(xpRemaining)} XP</p>`;
        } else {
            detailsHTML += `<p><strong>MAX LEVEL</strong></p>`;
        }
        
        if (skillConfig && skillConfig.description) {
            detailsHTML += `<p>${skillConfig.description}</p>`;
        }
        
        // Show modal or chat message with details
        this.uiManager.addChatMessage(detailsHTML.replace(/<[^>]+>/g, ' '), 'system');
    }
    
    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return Math.floor(num).toLocaleString();
    }
    
    /**
     * Update stats panel display
     */
    update() {
        if (!this.player || !this.visible) return;
        
        // Update total level
        const totalLevelEl = document.getElementById('total-level');
        if (totalLevelEl) {
            const totalLevel = this.calculateTotalLevel();
            totalLevelEl.textContent = totalLevel;
        }
        
        // Update combat level
        const combatLevelEl = document.getElementById('combat-level-display');
        if (combatLevelEl && this.player.combatStats) {
            combatLevelEl.textContent = this.player.combatStats.combatLevel || 3;
        }
        
        // Update each skill
        for (const skillName of this.skillOrder) {
            this.updateSkillDisplay(skillName);
        }
    }
    
    /**
     * Update individual skill display
     * @param {string} skillName - Name of the skill
     */
    updateSkillDisplay(skillName) {
        if (!this.player || !this.player.skills[skillName]) return;
        
        const skill = this.player.skills[skillName];
        const skillItem = this.container.querySelector(`[data-skill="${skillName}"]`);
        
        if (!skillItem) return;
        
        // Update level
        const levelEl = skillItem.querySelector('.skill-level');
        if (levelEl) {
            levelEl.textContent = `Level: ${skill.level}`;
        }
        
        // Update XP
        const xpEl = skillItem.querySelector('.skill-xp');
        if (xpEl) {
            xpEl.textContent = `${this.formatNumber(skill.xp)} XP`;
        }
        
        // Update progress bar
        const progressFill = skillItem.querySelector('.skill-progress-fill');
        if (progressFill && skill.level < 99) {
            const currentXP = skill.xp;
            const currentLevel = skill.level;
            const nextLevelXP = this.skillsSystem.getXPForLevel(currentLevel + 1);
            const currentLevelXP = this.skillsSystem.getXPForLevel(currentLevel);
            const xpProgress = currentXP - currentLevelXP;
            const xpRequired = nextLevelXP - currentLevelXP;
            const progressPercent = (xpProgress / xpRequired) * 100;
            
            progressFill.style.width = `${progressPercent}%`;
        } else if (progressFill && skill.level >= 99) {
            progressFill.style.width = '100%';
        }
        
        // Update tooltip
        skillItem.title = this.getSkillTooltip(skillName);
    }
    
    /**
     * Calculate total level across all skills
     * @returns {number} Total level
     */
    calculateTotalLevel() {
        if (!this.player || !this.player.skills) return 0;
        
        let total = 0;
        for (const skillName of this.skillOrder) {
            if (this.player.skills[skillName]) {
                total += this.player.skills[skillName].level;
            }
        }
        
        return total;
    }
    
    /**
     * Show the stats panel
     */
    show() {
        this.visible = true;
        if (this.container) {
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Hide the stats panel
     */
    hide() {
        this.visible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Highlight skill (for level-up animation)
     * @param {string} skillName - Name of the skill
     */
    highlightSkill(skillName) {
        const skillItem = this.container?.querySelector(`[data-skill="${skillName}"]`);
        if (skillItem) {
            skillItem.classList.add('skill-levelup');
            
            // Remove highlight after animation
            setTimeout(() => {
                skillItem.classList.remove('skill-levelup');
            }, 2000);
        }
    }
    
    /**
     * Render method (for canvas rendering if needed)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        // Stats panel is HTML-based, no canvas rendering needed
        // This method is here for interface consistency
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatsPanel;
}
