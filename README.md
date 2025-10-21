# 🎮 PlayZone - Free Browser Games

A collection of 26 fun, free browser games across 6 categories, including an online multiplayer MMORPG!

## 🌟 Features

- ✅ 100% Free & Open Source
- ✅ No Installation Required
- ✅ Works Offline
- ✅ Mobile Friendly
- ✅ No Ads or Tracking
- ✅ Pure HTML/CSS/JavaScript

## 🎯 Game Categories

### 🧠 Puzzle Games (Updated with Menu System)
- **2048** - Slide tiles to reach 2048
- **Sudoku** - Classic number puzzle
- **Minesweeper** - Find all the mines
- **Sliding Puzzle** - Arrange numbers in order
- **Nonogram** - Reveal hidden pictures

### 📚 Quiz Games
- Multiple Choice Quiz
- True or False
- Timed Challenge
- Personality Quiz
- Category Quiz (Geography, Movies, Sports, Science)

### ✍️ Word Games
- Hangman
- Wordle Clone
- Anagram Scrambler
- Typing Speed Test
- Word Chain

### ⚡ Clicker/Idle Games
- Cookie Clicker
- Idle Farm
- Business Tycoon
- Hero Tapper
- Energy Generator

### 🕹️ Arcade Games
- Flappy Bird
- Breakout
- Dino Runner
- Asteroids
- Simple Platformer

### 🌐 Online Games (NEW!)
- **FantasyQuest MMORPG** - Multiplayer online RPG
  - Real-time multiplayer with Firebase
  - Character progression system
  - Combat, Mining, Woodcutting, Fishing, Crafting skills
  - Monster battles with XP rewards
  - Resource gathering
  - Real-time chat
  - Inventory system
  - See other players in real-time!

## 🚀 How to Play

1. Open `index.html` in your browser
2. Click on any game category
3. Select a game from the menu
4. Enjoy playing!

## 📱 Mobile Support

All games are fully responsive and work great on:
- 📱 Mobile phones
- 📲 Tablets
- 💻 Desktops
- 🖥️ Large screens

## 🛠️ Technical Details

- **No Dependencies** - Pure vanilla JavaScript (except Firebase for online games)
- **Single Page** - Each category is a standalone HTML file
- **Local Storage** - High scores saved automatically
- **Canvas Games** - Arcade games use HTML5 Canvas
- **Touch Support** - Mobile-friendly controls
- **Firebase Integration** - Real-time multiplayer for online games
- **Responsive Design** - Works on all screen sizes

## 🔥 Firebase Setup (for Online Games)

The FantasyQuest MMORPG uses Firebase Realtime Database for multiplayer functionality.

**Note:** The current Firebase configuration in `online.html` uses placeholder credentials. To fully enable multiplayer:

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database with these rules:
```json
{
  "rules": {
    "players": {
      ".read": true,
      ".write": true,
      "$playerId": {
        ".validate": "newData.hasChildren(['name', 'x', 'y', 'level', 'lastActive'])"
      }
    },
    "chat": {
      ".read": true,
      ".write": true,
      "$messageId": {
        ".validate": "newData.hasChildren(['player', 'message', 'timestamp'])"
      }
    }
  }
}
```
3. Copy your Firebase config from Project Settings
4. Replace the `firebaseConfig` object in `online.html` with your credentials

The game will work in single-player mode without Firebase, but multiplayer features require a valid Firebase project.

## 📂 File Structure

```
playzone/
├── index.html          # Main landing page
├── puzzle.html         # Puzzle games (with difficulty levels)
├── quiz.html           # Quiz games (expanded question banks)
├── word.html           # Word games (difficulty modes)
├── clicker.html        # Clicker/Idle games (progression systems)
├── arcade.html         # Arcade games (progressive difficulty)
├── online.html         # Online MMORPG (Firebase multiplayer)
└── README.md           # This file
```

## 🎨 Design

- Modern gradient backgrounds
- Smooth animations
- Card-based UI
- Responsive grid layouts
- Touch-friendly buttons

## 🔄 Recent Updates

### Latest (December 2024)
- ✅ **NEW CATEGORY**: Online Games with MMORPG
- ✅ Real-time multiplayer with Firebase
- ✅ Complete skill progression system
- ✅ Combat and resource gathering mechanics
- ✅ All puzzle games now have difficulty levels
- ✅ Massively expanded quiz question banks (100+ questions)
- ✅ Word games with Easy/Medium/Hard modes
- ✅ Clicker games with deep progression (50+ upgrades)
- ✅ Arcade games with progressive difficulty scaling
- ✅ Menu system for all game categories
- ✅ Full-screen game mode
- ✅ Mobile-responsive design

### Coming Soon
- Crafting system for MMORPG
- Quest system with rewards
- More monster types and bosses
- Player trading system
- Custom themes
- Achievement system
- Leaderboards

## 📝 License

Free to use and modify. Made with ❤️ for gamers everywhere!

## 🤝 Contributing

Feel free to add more games or improve existing ones!

## 🌐 Live Demo

Visit: `https://gounitnl.github.io/personalwebsite/`

---

**Enjoy playing! 🎮**
