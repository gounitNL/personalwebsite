# MyScape v2 Testing Guide

## Task 3.5: Test Gathering Resources and XP

This document provides comprehensive testing procedures for verifying resource gathering and XP gain functionality in MyScape v2.

---

## 🎯 Testing Objectives

1. Verify resource nodes spawn correctly in each area
2. Confirm player can interact with resources (mining, woodcutting, fishing)
3. Validate XP is gained and UI updates in real-time
4. Check level-up notifications appear when thresholds are crossed
5. Verify items are added to inventory correctly
6. Confirm resources respawn after depletion
7. Test all gathering skills: Mining, Woodcutting, Fishing

---

## 🧪 Test Setup

### Prerequisites
1. Open MyScape v2 in browser
2. Click "Play Demo Mode" button
3. Wait for game to fully initialize
4. Open browser console (F12) to see debug logs

### Initial Player State
- Starting position: Lumbridge (25, 25)
- All skills at level 1 with 0 XP
- Empty inventory (28 slots)
- No items equipped

---

## ⛏️ Test 1: Mining Resources

### Test 1.1: Copper Ore Mining
**Location**: Lumbridge (copper rocks near starting area)

**Steps**:
1. Move player to copper rock location
2. Right-click copper rock → Select "Mine"
3. Wait for mining action to complete

**Expected Results**:
- ✅ Mining animation plays
- ✅ Progress bar shows harvest progress
- ✅ After completion: "You receive copper ore" message
- ✅ Copper ore appears in inventory slot
- ✅ Mining XP increases (check skills panel)
- ✅ Skills panel shows updated Mining level/XP
- ✅ XP gain appears as floating text (if implemented)
- ✅ Console shows: `SkillsSystem: Added X XP to mining`

**Test Data**:
- Item received: Copper ore
- XP gained: ~17.5 XP per copper ore
- Required level: 1
- Harvest time: ~3 seconds

### Test 1.2: Multiple Mining Actions
**Steps**:
1. Mine 5 copper rocks in succession
2. Watch inventory fill up
3. Observe XP accumulation

**Expected Results**:
- ✅ Each mining action grants XP
- ✅ XP bar progresses toward level 2
- ✅ Inventory shows 5x copper ore (stacked)
- ✅ Skills panel updates after each action
- ✅ No duplicate items in separate slots

### Test 1.3: Level-Up Test
**Steps**:
1. Continue mining until Mining level 2 is reached (83 XP total)
2. Watch for level-up notification

**Expected Results**:
- ✅ Level-up notification appears: "Congratulations! Your Mining level is now 2!"
- ✅ Skills panel shows "Level 2"
- ✅ Chat message: "Level up! You are now level 2 Mining."
- ✅ Console shows: `SkillsSystem: Level up! mining 1 → 2`

### Test 1.4: Higher Level Ores
**Test different ore types** (after leveling up):

| Ore Type | Required Level | XP Reward | Test Location |
|----------|---------------|-----------|---------------|
| Copper   | 1             | 17.5      | Lumbridge     |
| Tin      | 1             | 17.5      | Lumbridge     |
| Iron     | 15            | 35        | Varrock       |
| Coal     | 30            | 50        | Mining Guild  |
| Gold     | 40            | 65        | Crafting Guild|

**Note**: Use debug commands to boost Mining level for testing higher-tier ores.

---

## 🪓 Test 2: Woodcutting Resources

### Test 2.1: Normal Tree Chopping
**Location**: Lumbridge (trees near starting area)

**Steps**:
1. Move player to normal tree
2. Right-click tree → Select "Chop"
3. Wait for woodcutting action to complete

**Expected Results**:
- ✅ Woodcutting animation plays
- ✅ Progress bar shows chopping progress
- ✅ After completion: "You receive logs" message
- ✅ Logs appear in inventory
- ✅ Woodcutting XP increases
- ✅ Skills panel updates in real-time
- ✅ Console shows: `SkillsSystem: Added X XP to woodcutting`

**Test Data**:
- Item received: Logs
- XP gained: ~25 XP per log
- Required level: 1
- Harvest time: ~3 seconds

### Test 2.2: Different Tree Types
**Test progression through tree types**:

| Tree Type | Required Level | XP Reward | Test Location |
|-----------|---------------|-----------|---------------|
| Tree      | 1             | 25        | Lumbridge     |
| Oak       | 15            | 37.5      | Varrock       |
| Willow    | 30            | 67.5      | Draynor       |
| Maple     | 45            | 100       | Seers Village |
| Yew       | 60            | 175       | Edgeville     |

---

## 🎣 Test 3: Fishing Resources

### Test 3.1: Shrimp Fishing
**Location**: Lumbridge (fishing spots near river)

**Steps**:
1. Move player to fishing spot
2. Right-click fishing spot → Select "Fish"
3. Wait for fishing action to complete

**Expected Results**:
- ✅ Fishing animation plays
- ✅ Progress bar shows fishing progress
- ✅ After completion: "You receive raw shrimp" message
- ✅ Raw shrimp appears in inventory
- ✅ Fishing XP increases
- ✅ Skills panel updates
- ✅ Console shows: `SkillsSystem: Added X XP to fishing`

**Test Data**:
- Item received: Raw shrimp
- XP gained: ~10 XP per shrimp
- Required level: 1
- Harvest time: ~2 seconds

### Test 3.2: Different Fish Types
**Test fishing progression**:

| Fish Type    | Required Level | XP Reward | Test Location |
|--------------|---------------|-----------|---------------|
| Shrimp       | 1             | 10        | Lumbridge     |
| Sardine      | 5             | 20        | Lumbridge     |
| Trout        | 20            | 50        | Barbarian     |
| Salmon       | 30            | 70        | Barbarian     |
| Lobster      | 40            | 90        | Fishing Guild |
| Swordfish    | 50            | 100       | Fishing Guild |
| Shark        | 76            | 110       | Fishing Guild |

---

## 🧪 Test 4: Resource Respawn

### Test 4.1: Resource Depletion
**Steps**:
1. Harvest a resource completely (watch harvest count)
2. Observe resource state after max harvests reached

**Expected Results**:
- ✅ Resource changes appearance (depleted state)
- ✅ Cannot interact with depleted resource
- ✅ Console shows: `Resource depleted: [name]`

### Test 4.2: Resource Regeneration
**Steps**:
1. Wait for respawn timer (check respawnTime in config)
2. Observe resource respawn

**Expected Results**:
- ✅ Resource returns to harvestable state
- ✅ Visual indicator changes (active state)
- ✅ Can interact with resource again
- ✅ Console shows: `Resource respawned: [name]`

---

## 🧪 Test 5: Inventory Management

### Test 5.1: Inventory Full
**Steps**:
1. Fill inventory with 28 items
2. Attempt to gather another resource

**Expected Results**:
- ✅ Cannot start gathering action
- ✅ Message: "Your inventory is full."
- ✅ Resource is not harvested
- ✅ No XP gained

### Test 5.2: Item Stacking
**Steps**:
1. Gather multiple identical items (e.g., 10 copper ore)
2. Check inventory slots

**Expected Results**:
- ✅ Items stack in single slot
- ✅ Quantity counter shows correct amount
- ✅ Only one inventory slot used for stacked items

---

## 🧪 Test 6: Skill Level Requirements

### Test 6.1: Insufficient Level
**Steps**:
1. Find a resource requiring higher level (e.g., iron ore, level 15)
2. Attempt to gather with level 1 Mining

**Expected Results**:
- ✅ Cannot start gathering
- ✅ Message: "You need level 15 Mining to gather this."
- ✅ No interaction occurs
- ✅ No XP gained

### Test 6.2: Level Requirement Met
**Steps**:
1. Level up to meet requirement (or use debug commands)
2. Attempt to gather same resource

**Expected Results**:
- ✅ Can start gathering
- ✅ Resource harvests successfully
- ✅ XP gained and UI updates

---

## 🧪 Test 7: UI Updates

### Test 7.1: Real-Time XP Bar
**Steps**:
1. Open Skills panel
2. Gather resources while watching skills panel

**Expected Results**:
- ✅ XP bar fills progressively
- ✅ XP number updates after each gather
- ✅ Level number updates on level-up
- ✅ Progress percentage visible

### Test 7.2: Notifications
**Steps**:
1. Gather resources and level up
2. Watch for notification popups

**Expected Results**:
- ✅ Level-up notification displays
- ✅ Notification shows skill name and new level
- ✅ Notification auto-closes after 5 seconds
- ✅ Chat message accompanies notification

### Test 7.3: Chat Messages
**Steps**:
1. Gather various resources
2. Monitor chat panel

**Expected Results**:
- ✅ System messages for each action
- ✅ "You receive [item]" messages
- ✅ Level-up messages in chat
- ✅ XP gain messages (optional)

---

## 🐛 Bug Checks

### Common Issues to Watch For:
1. ❌ XP not updating in UI
2. ❌ Level-ups not triggering notifications
3. ❌ Items not added to inventory
4. ❌ Resources not respawning
5. ❌ Wrong XP amounts granted
6. ❌ Skill requirements not enforced
7. ❌ Animation not playing
8. ❌ Player can harvest while moving
9. ❌ Multiple players can harvest same resource

---

## 🎮 Debug Console Commands

Use these commands in browser console for testing:

```javascript
// Check player skills
console.log(gameEngine.player.skills);

// Check Mining skill specifically
console.log(gameEngine.player.skills.mining);

// Manually add XP (for testing level-ups)
gameEngine.player.addXP('mining', 1000);

// Check inventory
console.log(gameEngine.player.inventory);

// Find resources in current area
console.log(gameEngine.entities.filter(e => e.type === 'resource'));

// Get player position
console.log('Player:', gameEngine.player.x, gameEngine.player.y);
```

---

## ✅ Test Completion Checklist

### Mining Tests
- [ ] Copper ore mining works
- [ ] Multiple mining actions accumulate XP
- [ ] Mining level-up notification appears
- [ ] Different ore types require correct levels
- [ ] XP amounts match configuration

### Woodcutting Tests
- [ ] Tree chopping works
- [ ] Logs added to inventory
- [ ] Woodcutting XP updates in UI
- [ ] Different tree types work correctly
- [ ] Level requirements enforced

### Fishing Tests
- [ ] Fishing spot interaction works
- [ ] Fish added to inventory
- [ ] Fishing XP gained correctly
- [ ] Different fish types available
- [ ] Level requirements work

### System Tests
- [ ] Resources respawn correctly
- [ ] Inventory full check works
- [ ] Item stacking works
- [ ] Level requirements enforced
- [ ] UI updates in real-time
- [ ] Notifications appear on level-up
- [ ] Chat messages display correctly

---

## 📊 Expected Results Summary

**After completing all tests, you should confirm**:
1. ✅ All gathering skills (Mining, Woodcutting, Fishing) work correctly
2. ✅ XP is gained and UI updates in real-time
3. ✅ Level-up notifications appear at correct thresholds
4. ✅ Items are correctly added to inventory
5. ✅ Resources respawn after depletion
6. ✅ Level requirements are enforced
7. ✅ Event-driven architecture working (thanks to Task 2.5 fix)

---

## 🔗 Related Documentation

- **Task 2.5**: Player XP integration with SkillsSystem (COMPLETE)
- **Task 3.1**: WorldSystem.js for area management (COMPLETE)
- **Task 3.2**: Resource.js for gatherable nodes (COMPLETE)
- **Task 3.3**: Area transitions and portals (COMPLETE)
- **Task 3.4**: Resource spawning per area (COMPLETE)
- **Task 3.5**: Test gathering resources and XP (THIS DOCUMENT)

---

**Test Status**: Ready for execution
**Prerequisites**: PR #40 merged (Task 2.5 - Skills-UI integration)
**Estimated Test Time**: 30-45 minutes for complete test suite

---

*Last Updated: 2025-10-25*
*Version: 1.0*
*Status: Task 3.5 Testing Guide*
