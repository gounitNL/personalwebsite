# MyScape v2 - Banking System Test Guide

## Task 6.6: Test Complete Banking Functionality

This document provides comprehensive testing procedures for verifying the banking system functionality in MyScape v2.

---

## 🎯 Testing Objectives

1. Verify bank interface opens and closes correctly
2. Confirm deposit operations work properly
3. Validate withdraw operations function correctly
4. Test item stacking in bank
5. Verify bank tab organization
6. Check bank-inventory integration
7. Test save/load persistence of bank data
8. Validate quantity selectors (1, 5, 10, All)
9. Test bank with different item types

---

## 🧪 Test Setup

### Prerequisites
1. Open MyScape v2 in browser
2. Click "Play Demo Mode" button
3. Wait for game to fully initialize
4. Open browser console (F12) to see debug logs

### Initial Setup
- Player starts in Lumbridge at (25, 25)
- Empty bank (450 slots across 9 tabs)
- Empty inventory (28 slots)
- Banker NPC at position (30, 22) in Lumbridge

---

## 🏦 Test 1: Bank Interface

### Test 1.1: Open Bank
**Steps**:
1. Navigate player to Banker NPC (30, 22)
2. Right-click Banker NPC
3. Select "Bank" from context menu

**Expected Results**:
- ✅ Bank modal opens
- ✅ Console shows: `🏦 Bank opened`
- ✅ Bank interface displays with 9 tabs
- ✅ Current tab highlighted (Tab 0 - Main)
- ✅ Empty slots visible (50 slots per tab)
- ✅ Deposit/Withdraw buttons visible
- ✅ Inventory panel visible

**Console Output**:
```
🏦 Bank opened
```

---

### Test 1.2: Close Bank
**Steps**:
1. With bank open, click "Close" button
2. OR press ESC key
3. OR click outside modal

**Expected Results**:
- ✅ Bank modal closes
- ✅ Console shows: `🏦 Bank closed`
- ✅ Player can move again
- ✅ Game continues normally

**Console Output**:
```
🏦 Bank closed
```

---

### Test 1.3: Bank Tabs
**Steps**:
1. Open bank
2. Click different tab buttons (0-8)
3. Observe tab contents

**Expected Results**:
- ✅ Each tab switches correctly
- ✅ Tab 0 labeled "Main" with 📦 icon
- ✅ Tabs 1-8 labeled "Tab 1" through "Tab 8"
- ✅ Each tab has unique icon (⚔️, 🛡️, ⛏️, 🪓, 🎣, 🔨, ✨, 💎)
- ✅ Tab contents preserved when switching
- ✅ Current tab highlighted

---

## 💰 Test 2: Deposit Operations

### Test 2.1: Deposit Single Item
**Steps**:
1. Gather copper ore (1 item)
2. Open bank
3. Click copper ore in inventory
4. Click "Deposit" button

**Expected Results**:
- ✅ Copper ore removed from inventory
- ✅ Copper ore appears in bank slot
- ✅ Console shows: `💰 Deposited 1x Copper ore`
- ✅ Inventory slot becomes empty
- ✅ Bank slot shows copper ore icon
- ✅ Quantity shows "1"

**Console Output**:
```
💰 Deposited 1x Copper ore
```

---

### Test 2.2: Deposit Multiple Items (Stackable)
**Steps**:
1. Gather 10 copper ore (stackable item)
2. Open bank
3. Click copper ore stack in inventory
4. Select "Deposit All"

**Expected Results**:
- ✅ All 10 copper ore deposited
- ✅ Inventory slot becomes empty
- ✅ Bank shows single slot with "10" quantity
- ✅ Console shows: `💰 Deposited 10x Copper ore`
- ✅ Items stack correctly in bank

---

### Test 2.3: Deposit Partial Quantity
**Steps**:
1. Have 10 copper ore in inventory
2. Open bank
3. Click copper ore
4. Select "Deposit 5"

**Expected Results**:
- ✅ 5 copper ore deposited to bank
- ✅ 5 copper ore remain in inventory
- ✅ Bank shows 5 quantity
- ✅ Inventory shows 5 quantity
- ✅ Console shows: `💰 Deposited 5x Copper ore`

---

### Test 2.4: Deposit to Existing Stack
**Setup**: Already have 5 copper ore in bank

**Steps**:
1. Gather 5 more copper ore
2. Open bank
3. Deposit the 5 new copper ore

**Expected Results**:
- ✅ New copper ore adds to existing stack
- ✅ Bank slot now shows "10" quantity
- ✅ Single bank slot used (not two separate slots)
- ✅ Console shows: `💰 Deposited 5x Copper ore`

---

### Test 2.5: Deposit Non-Stackable Items
**Steps**:
1. Obtain 3 bronze swords (non-stackable weapons)
2. Open bank
3. Deposit all 3 swords

**Expected Results**:
- ✅ Each sword occupies separate bank slot
- ✅ 3 bank slots used
- ✅ Each slot shows "1" quantity
- ✅ Swords don't stack together
- ✅ Console shows 3 separate deposit messages

---

### Test 2.6: Deposit with Full Bank Tab
**Setup**: Fill current bank tab with 50 items

**Steps**:
1. Have full bank tab (50/50 slots)
2. Try to deposit another item

**Expected Results**:
- ✅ Deposit fails
- ✅ Message: "Bank tab is full"
- ✅ Item remains in inventory
- ✅ No bank changes
- ✅ Console shows error message

---

## 📤 Test 3: Withdraw Operations

### Test 3.1: Withdraw Single Item
**Setup**: Have copper ore in bank

**Steps**:
1. Open bank
2. Click copper ore in bank
3. Click "Withdraw 1" button

**Expected Results**:
- ✅ 1 copper ore added to inventory
- ✅ Bank quantity decreases by 1
- ✅ If bank had 1, slot becomes empty
- ✅ Console shows: `💎 Withdrew 1x Copper ore`
- ✅ Inventory updates immediately

**Console Output**:
```
💎 Withdrew 1x Copper ore
```

---

### Test 3.2: Withdraw All Items
**Setup**: Have 10 copper ore in bank

**Steps**:
1. Open bank
2. Click copper ore stack
3. Select "Withdraw All"

**Expected Results**:
- ✅ All 10 copper ore added to inventory
- ✅ Bank slot becomes empty
- ✅ Inventory shows 10 quantity
- ✅ Console shows: `💎 Withdrew 10x Copper ore`

---

### Test 3.3: Withdraw Partial Quantity
**Setup**: Have 20 copper ore in bank

**Steps**:
1. Open bank
2. Click copper ore
3. Select "Withdraw 5"

**Expected Results**:
- ✅ 5 copper ore added to inventory
- ✅ 15 copper ore remain in bank
- ✅ Bank shows "15" quantity
- ✅ Inventory shows "5" quantity
- ✅ Console shows: `💎 Withdrew 5x Copper ore`

---

### Test 3.4: Withdraw to Existing Inventory Stack
**Setup**: 
- 5 copper ore in inventory
- 10 copper ore in bank

**Steps**:
1. Open bank
2. Withdraw 5 copper ore from bank

**Expected Results**:
- ✅ Copper ore stacks with inventory
- ✅ Inventory shows "10" quantity
- ✅ Single inventory slot used
- ✅ Bank shows "5" quantity remaining

---

### Test 3.5: Withdraw with Full Inventory
**Setup**: Full inventory (28/28 slots)

**Steps**:
1. Open bank
2. Try to withdraw any item

**Expected Results**:
- ✅ Withdraw fails
- ✅ Message: "Your inventory is full"
- ✅ Item remains in bank
- ✅ No inventory changes
- ✅ Console shows error message

---

### Test 3.6: Withdraw Non-Stackable Item
**Setup**: Bronze sword in bank

**Steps**:
1. Open bank
2. Click bronze sword
3. Withdraw it

**Expected Results**:
- ✅ Sword added to inventory
- ✅ Occupies separate inventory slot
- ✅ Bank slot becomes empty
- ✅ Sword shown in inventory

---

## 🔄 Test 4: Bank-Inventory Integration

### Test 4.1: Deposit-Withdraw Cycle
**Steps**:
1. Start with 10 copper ore in inventory
2. Deposit all to bank
3. Immediately withdraw all back to inventory

**Expected Results**:
- ✅ Copper ore moves to bank correctly
- ✅ Copper ore returns to inventory correctly
- ✅ Quantity preserved (10)
- ✅ No items lost
- ✅ Both operations successful

---

### Test 4.2: Multiple Item Types
**Setup**: Have copper ore, tin ore, logs in inventory

**Steps**:
1. Open bank
2. Deposit each item type

**Expected Results**:
- ✅ Each item type in separate bank slot
- ✅ All items deposited correctly
- ✅ Bank shows 3 different items
- ✅ Can withdraw each individually

---

### Test 4.3: Cross-Tab Operations
**Steps**:
1. Deposit copper ore to Tab 0
2. Switch to Tab 1
3. Deposit tin ore to Tab 1
4. Switch back to Tab 0
5. Verify copper ore still there

**Expected Results**:
- ✅ Tab 0 shows copper ore
- ✅ Tab 1 shows tin ore
- ✅ Items stay in their tabs
- ✅ Switching tabs doesn't lose items
- ✅ Each tab independent

---

## 🎛️ Test 5: Quantity Selectors

### Test 5.1: Deposit Quantity Options
**Setup**: Have 20 copper ore in inventory

**Steps**:
1. Open bank
2. Click copper ore
3. Test each deposit option:
   - Deposit 1
   - Deposit 5
   - Deposit 10
   - Deposit All

**Expected Results**:
- ✅ "Deposit 1" deposits 1 item
- ✅ "Deposit 5" deposits 5 items
- ✅ "Deposit 10" deposits 10 items
- ✅ "Deposit All" deposits all remaining
- ✅ Correct quantities transferred each time

---

### Test 5.2: Withdraw Quantity Options
**Setup**: Have 20 copper ore in bank

**Steps**:
1. Open bank
2. Click copper ore
3. Test each withdraw option:
   - Withdraw 1
   - Withdraw 5
   - Withdraw 10
   - Withdraw All

**Expected Results**:
- ✅ "Withdraw 1" withdraws 1 item
- ✅ "Withdraw 5" withdraws 5 items
- ✅ "Withdraw 10" withdraws 10 items
- ✅ "Withdraw All" withdraws all
- ✅ Correct quantities transferred

---

## 💾 Test 6: Save/Load Persistence

### Test 6.1: Bank Data Persistence
**Steps**:
1. Deposit several items to bank
2. Close bank
3. Save game (manual save or wait for auto-save)
4. Reload page
5. Load game
6. Open bank

**Expected Results**:
- ✅ All banked items still present
- ✅ Quantities preserved
- ✅ Items in correct tabs
- ✅ Bank state fully restored
- ✅ No data lost

---

### Test 6.2: Cross-Session Persistence
**Steps**:
1. Bank items in Tab 0, 1, and 2
2. Close game completely
3. Reopen game later
4. Load save
5. Check all three tabs

**Expected Results**:
- ✅ Tab 0 items present
- ✅ Tab 1 items present
- ✅ Tab 2 items present
- ✅ All quantities correct
- ✅ Full bank state restored

---

## 🔍 Test 7: Edge Cases

### Test 7.1: Deposit at Capacity
**Setup**: Bank tab has 49/50 slots filled

**Steps**:
1. Deposit 2 different non-stackable items

**Expected Results**:
- ✅ First item deposits (50/50)
- ✅ Second deposit fails (tab full)
- ✅ Appropriate error message
- ✅ Second item stays in inventory

---

### Test 7.2: Withdraw Maximum Stack
**Setup**: Have max stack size in bank (e.g., 2147483647 if supported)

**Steps**:
1. Withdraw "All" from max stack

**Expected Results**:
- ✅ Entire stack withdraws (or inventory limit)
- ✅ No overflow errors
- ✅ Quantity handled correctly
- ✅ Game remains stable

---

### Test 7.3: Empty Bank Operations
**Setup**: Completely empty bank

**Steps**:
1. Try to withdraw from empty slot
2. Try to search in empty bank

**Expected Results**:
- ✅ Withdraw does nothing (graceful)
- ✅ No errors thrown
- ✅ Bank remains functional
- ✅ Can still deposit items

---

### Test 7.4: Bank While Moving
**Steps**:
1. Open bank
2. Try to move player while bank is open

**Expected Results**:
- ✅ Player cannot move with bank open
- ✅ OR bank closes if player moves
- ✅ Consistent behavior
- ✅ No stuck states

---

## 🎮 Test 8: Banker NPC Interaction

### Test 8.1: Banker Right-Click Menu
**Steps**:
1. Approach Banker NPC
2. Right-click Banker
3. View context menu

**Expected Results**:
- ✅ Context menu appears
- ✅ "Bank" option visible
- ✅ "Talk-to" option visible (if dialogue implemented)
- ✅ Menu positioned correctly

---

### Test 8.2: Opening Bank from Distance
**Steps**:
1. Move far from Banker
2. Try to open bank

**Expected Results**:
- ✅ Bank doesn't open (too far)
- ✅ OR player walks to Banker first
- ✅ Message: "You're too far away"
- ✅ Appropriate feedback

---

### Test 8.3: Multiple Bankers
**Steps**:
1. Open bank with Lumbridge Banker
2. Close bank
3. Travel to Varrock
4. Open bank with Varrock Banker

**Expected Results**:
- ✅ Same bank contents at both locations
- ✅ Bank is shared across NPCs
- ✅ All items accessible
- ✅ Consistent experience

---

## 🧪 Test 9: Integration Tests

### Test 9.1: Bank After Combat
**Steps**:
1. Kill enemy and get loot
2. Bank the loot items

**Expected Results**:
- ✅ Loot can be banked
- ✅ Items transfer correctly
- ✅ Combat-earned items work same as gathered

---

### Test 9.2: Bank After Gathering
**Steps**:
1. Mine 20 copper ore
2. Chop 15 logs
3. Fish 10 shrimp
4. Bank all gathered items

**Expected Results**:
- ✅ All resource types can be banked
- ✅ Each type in separate slot
- ✅ Quantities correct
- ✅ Mixed item types handled

---

### Test 9.3: Bank Equipment
**Steps**:
1. Equip bronze sword
2. Unequip to inventory
3. Bank the bronze sword

**Expected Results**:
- ✅ Equipment can be banked
- ✅ Unequip first, then bank
- ✅ Item stats preserved
- ✅ Can withdraw and re-equip

---

## 📊 Test Completion Checklist

### Bank Interface
- [ ] Bank opens correctly
- [ ] Bank closes correctly
- [ ] All 9 tabs accessible
- [ ] Tab switching works
- [ ] UI responsive

### Deposit Operations
- [ ] Single item deposit
- [ ] Multiple item deposit
- [ ] Partial quantity deposit
- [ ] Stackable items stack
- [ ] Non-stackable items separate
- [ ] Full tab handling

### Withdraw Operations
- [ ] Single item withdraw
- [ ] Multiple item withdraw
- [ ] Partial quantity withdraw
- [ ] Full inventory handling
- [ ] Stack consolidation

### Quantity Selectors
- [ ] Deposit 1 works
- [ ] Deposit 5 works
- [ ] Deposit 10 works
- [ ] Deposit All works
- [ ] Withdraw 1 works
- [ ] Withdraw 5 works
- [ ] Withdraw 10 works
- [ ] Withdraw All works

### Persistence
- [ ] Bank data saves
- [ ] Bank data loads
- [ ] Cross-session persistence
- [ ] No data loss

### Integration
- [ ] Works with inventory
- [ ] Works with equipment
- [ ] Works with combat loot
- [ ] Works with gathered resources
- [ ] Works across different NPCs

### Edge Cases
- [ ] Full bank tab handled
- [ ] Full inventory handled
- [ ] Empty bank handled
- [ ] Maximum stack sizes
- [ ] Distance restrictions

---

## 🐛 Known Issues to Watch For

1. **Items disappearing** - Check if deposit/withdraw fails silently
2. **Duplicate items** - Verify no item duplication on transactions
3. **Quantity errors** - Ensure math is correct for partial amounts
4. **Tab data loss** - Verify switching tabs doesn't lose items
5. **Save/load corruption** - Check bank state after reload
6. **Stack overflow** - Test with very large quantities
7. **Concurrent operations** - Test rapid deposit/withdraw

---

## 🎯 Success Criteria

**Task 6.6 is complete when**:
- ✅ All deposit operations work correctly
- ✅ All withdraw operations work correctly
- ✅ Bank tabs function properly
- ✅ Quantity selectors work
- ✅ Bank-inventory integration seamless
- ✅ Save/load preserves bank data
- ✅ Edge cases handled gracefully
- ✅ No critical bugs found

---

## 🔧 Debug Console Commands

```javascript
// Check bank contents
console.log(gameEngine.bankingSystem.tabs);

// Check current tab
console.log(gameEngine.bankingSystem.currentTab);

// Check if bank is open
console.log(gameEngine.bankingSystem.isOpen);

// Get total items in bank
let totalItems = 0;
gameEngine.bankingSystem.tabs.forEach(tab => {
    totalItems += tab.items.length;
});
console.log('Total items in bank:', totalItems);

// Find specific item in bank
gameEngine.bankingSystem.findItemInBank('copper_ore');

// Check bank capacity
console.log('Total slots:', gameEngine.bankingSystem.totalSlots);
console.log('Slots per tab:', gameEngine.bankingSystem.slotsPerTab);
```

---

**Test Guide Version**: 1.0  
**Last Updated**: 2025-10-25  
**Status**: Ready for execution  
**Estimated Test Time**: 45-60 minutes for complete suite
