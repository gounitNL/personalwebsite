# How to Test MyScape Phase 4 - Combat System

## 🎮 Access the Game

### Method 1: Via Main Page
1. **Go to main page:** https://8000-iaezhivykv7nk2d23uapr-0e616f0a.sandbox.novita.ai
2. **Scroll down** to "Online Games" section
3. **Click** "⛏️ MyScape Enhanced" button
4. This will take you to the Phase 4 version with combat system

### Method 2: Direct Link
- **Direct URL:** https://8000-iaezhivykv7nk2d23uapr-0e616f0a.sandbox.novita.ai/myscape-v2/index.html

---

## 🔐 Login / Register

### For Testing (Quick Start)
You can use Firebase authentication:
- **Email:** test@test.com
- **Password:** test123

OR create a new account:
1. Click "Register"
2. Enter username, email, and password (min 6 chars)
3. Click "Create Account"

---

## ⚔️ Testing Combat System

### Once Logged In:

1. **Open Browser Console** (Press F12, then click "Console" tab)
   - This is where you'll see combat feedback

2. **Spawn an Enemy**
   - Press the **`6`** key on your keyboard
   - You'll see: `🐺 Spawned goblin (Lv5) at (30, 25)`
   - A Goblin will appear near your player

3. **Attack the Enemy**
   - Press the **`7`** key on your keyboard
   - You'll see combat results in console:
     ```
     ⚔️ Attacking goblin (5.0 tiles away)
     💥 Hit for 8 damage!
     💫 Added 32 XP to attack
     💫 Added 10 XP to hitpoints
     ```
   - OR if you miss:
     ```
     ❌ Attack missed!
     ```

4. **Keep Attacking**
   - Press **`7`** multiple times to attack repeatedly
   - Watch enemy HP decrease
   - When enemy dies, you'll see:
     ```
     💀 Enemy goblin has died!
     💰 Dropped 15 coins at (30, 25)
     📦 Dropped bones at (30, 25)
     ```
   - Enemy will respawn after 30 seconds

### Additional Keyboard Shortcuts:

| Key | Action | Description |
|-----|--------|-------------|
| **1** | Add Attack XP | Test skill leveling (100 XP) |
| **2** | Add Woodcutting XP | Test skill leveling (50 XP) |
| **3** | Add Mining XP | Test skill leveling (75 XP) |
| **4** | Add Logs | Test inventory system |
| **5** | Add Bronze Sword | Test inventory system |
| **6** | Spawn Goblin | Spawn enemy (Level 5) |
| **7** | Attack | Attack nearest enemy |

---

## 📊 What to Look For

### ✅ Phase 2 Features (Skills & Inventory)
- **Skills Panel** (left sidebar): 15 skills with XP bars
- **Inventory Panel** (left sidebar): 28 slots
- **Stats Display** (top bar): Combat level, total level

### ✅ Phase 3 Features (World & Resources)
- **Lumbridge Area**: 50x50 tile world
- **Resources**: Trees, rocks, fishing spots (visible on map)
- **Portals**: Area transitions
- **Isometric View**: Diamond-shaped tiles

### ✅ Phase 4 Features (Combat System) - NEW!
- **Enemy AI**: Goblins wander around, detect player, chase, attack
- **Combat Mechanics**: Hit/miss calculation, damage, XP gains
- **Loot System**: Coins and items drop when enemies die
- **Respawn System**: Enemies respawn after 30 seconds
- **XP Distribution**: Attack, Strength, Defence, and Hitpoints gain XP

---

## 🐛 Known Issues (Normal Behavior)

1. **No Damage Numbers Yet**: Damage numbers don't appear on screen (Task 4.5 - not implemented yet)
2. **No Health Bars**: Enemy health bars above sprites not added yet (Task 4.5)
3. **No Attack Animation**: Player/enemy attack animations not implemented yet
4. **Console Required**: Must use browser console to see combat feedback (UI in Task 4.5)

---

## 🎯 What's Working (Validation Checklist)

### Core Combat
- [x] Enemy spawning with **`6`** key
- [x] Player attacks with **`7`** key
- [x] Hit/miss calculation (RuneScape formula)
- [x] Damage calculation (0 to max hit)
- [x] XP distribution (Attack, Strength, Defence, Hitpoints)
- [x] Enemy death and loot drops
- [x] Enemy respawn after 30 seconds

### Enemy AI
- [x] Idle state (standing still)
- [x] Wandering (random movement in 3-tile radius)
- [x] Chasing (detects player within 5 tiles)
- [x] Attacking (performs attacks when in range)
- [x] Fleeing (retreats when HP below 20%)

### Integration
- [x] All systems initialized correctly
- [x] Game loop updates combat system
- [x] WorldSystem spawns real Enemy instances
- [x] Skills gain XP from combat
- [x] Inventory can receive loot drops

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Combat
1. Press **`6`** to spawn goblin
2. Press **`7`** multiple times to attack
3. **Expected**: See hit/miss messages, damage values, XP gains
4. **Expected**: Goblin eventually dies, drops loot

### Scenario 2: Multiple Enemies
1. Press **`6`** three times to spawn 3 goblins
2. Press **`7`** repeatedly
3. **Expected**: Attacks target nearest enemy
4. **Expected**: Can defeat multiple enemies

### Scenario 3: XP Leveling
1. Press **`1`** multiple times (adds Attack XP)
2. Watch Skills Panel on left
3. **Expected**: Attack skill bar fills up
4. **Expected**: Eventually level up with notification

### Scenario 4: Inventory & Loot
1. Spawn and kill a goblin
2. Check Inventory Panel (left sidebar)
3. **Expected**: Coins and bones appear in inventory
4. **Expected**: Inventory slots fill up

---

## 📱 Browser Compatibility

**Tested and Working:**
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari

**Requirements:**
- Modern browser with ES6+ support
- JavaScript enabled
- LocalStorage enabled (for Firebase auth)

---

## 🚀 Next Steps (Phase 4 Task 4.5)

The following features will be added in Task 4.5:
- [ ] Floating damage numbers above enemies
- [ ] Health bars above enemy sprites
- [ ] Combat state indicator (crossed swords icon)
- [ ] Combat log in chat panel
- [ ] XP drop visualization
- [ ] Hit/miss visual indicators

---

## 🔗 Useful Resources

- **Testing Documentation**: See `PHASE4_TESTING.md` in project root
- **Pull Request**: PR #24 on GitHub
- **Interactive Test Suite**: `myscape-v2/test-combat.html`

---

## ❓ Troubleshooting

### "Game looks the same / no new features"
- **Solution**: Make sure you're accessing via the main page's "MyScape Enhanced" button
- **Not**: `myscape.html` (old version)
- **Yes**: `myscape-v2/index.html` (new Phase 4 version)

### "Keyboard shortcuts not working"
- **Solution**: Click on the game canvas area first to focus
- Make sure browser console is open (F12)

### "No enemies spawning"
- **Solution**: Check browser console for errors
- Try refreshing the page and logging in again

### "Can't see combat results"
- **Solution**: Open browser console (F12 → Console tab)
- Combat feedback is currently console-only (UI in Task 4.5)

---

**Last Updated:** 2025-10-22  
**Phase:** 4 - Combat System (80% Complete)  
**Status:** Ready for Testing ✅
