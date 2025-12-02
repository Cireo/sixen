# Sixen Card Game

A fast, tactical card game where players play numbered cards onto face-card **Stacks** to create collectable sums. Play online in your browser with no installation required!

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![No Dependencies](https://img.shields.io/badge/Dependencies-None-blue) ![Local Storage](https://img.shields.io/badge/Storage-Local-purple)

## ✨ Features

### 🎯 Core Gameplay
- **Multiplayer Mode**: Play with 2-5 players
- **Solitaire Mode**: Play solo and compete for high scores
- **Tactical Strategy**: Manage stacks, plan collections, and outmaneuver opponents
- **Multiple Collection Types**: Six-Six, Seven-Seven, Six-Seven, Zero, and Match collections

### 🎮 Game Options
- **Auto-draw**: Automatically draw cards on your turn
- **Auto-play on new stacks**: Automatically play when new stacks are created
- **Show stack sums**: Display current sum for each stack
- **Hide illegal moves**: Visual feedback for valid plays only
- **Auto-start new stacks**: Automatically create new stacks when needed

### 📚 Interactive Tutorial
- **Comprehensive Tutorial System**: Learn the game with interactive examples
- **Step-by-step Guidance**: Auto-play demonstrations of key concepts
- **Visual Examples**: See game scenarios in action

### 🏆 High Score Tracking
- **Solitaire Leaderboard**: Track your best scores
- **Nearby Scores Display**: See scores around your rank
- **Persistent Storage**: Scores saved locally in your browser

### 🚀 Technical Features
- **No Dependencies**: Pure vanilla JavaScript
- **Responsive Design**: Works on desktop and tablets
- **Local Storage**: Game progress and scores persist between sessions
- **Offline Play**: Works completely offline
- **Clean Architecture**: Well-organized, modular codebase

## 🎲 How to Play

### Basic Rules

1. **Setup**: Each player gets one face card (J, Q, or K) to start a stack
2. **Your Turn**: Draw a number card (A=1 through 10)
3. **Play the Card**: 
   - Play on the **left** side to add to the stack sum
   - Play on the **right** side to subtract from the stack sum
   - Play as a **Match** on a full stack (card value equals stack sum)
4. **Collect Stacks**: Collect when sum = 6, 7, or special conditions are met
5. **Win**: Most face cards collected wins!

### Collection Types

- **Six-Six**: Stack sum becomes 6
- **Seven-Seven**: Stack sum becomes 7
- **Six-Seven**: Play a 7 when a 6 is the top visible card
- **Zero**: Stack sum is 0 and at least one side is at capacity
- **Match**: On a full stack, play a card matching the stack sum

### Stack Capacities

- **Jack (J)**: 1 card per side
- **Queen (Q)**: 2 cards per side
- **King (K)**: 3 cards per side

For detailed rules, see [Player Rules](docs/PLAYER_RULES.md) or [Formal Rules](docs/FORMAL_RULES.md).

## 🛠 Setup & Installation

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sixen.git
   cd sixen
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your web browser
   open index.html  # macOS
   # or double-click index.html file
   ```

3. **Start playing!**
   - No installation required
   - No server setup needed
   - Works offline

### Alternative: Web Server (Optional)

If you prefer running with a web server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server

# Then visit http://localhost:8000
```

## 📁 Project Structure

```
sixen/
├── index.html              # Main game entry point
├── tutorial.html           # Interactive tutorial
├── LICENSE                 # MIT License
├── README.md               # This file
├── DEPLOYMENT.md           # GitHub Pages deployment guide
├── src/
│   ├── js/
│   │   ├── game.js         # Core game logic
│   │   ├── ui.js           # User interface controller
│   │   ├── rendering.js   # Card rendering utilities
│   │   ├── high-scores.js # High score management
│   │   ├── utils.js        # General utilities
│   │   ├── ui-helpers.js   # UI helper functions
│   │   └── tutorial.js     # Tutorial system
│   ├── css/
│   │   ├── styles.css      # Main game styles
│   │   └── tutorial.css    # Tutorial-specific styles
│   ├── assets/
│   │   └── svg-cards.svg   # Card graphics (SVG sprite)
│   └── data/
│       └── tutorial-data.json  # Tutorial content
├── docs/
│   ├── FORMAL_RULES.md     # Formal game rules
│   └── PLAYER_RULES.md     # Player-friendly rules
└── tests/
    └── tutorial-test-utils.js  # Test utilities
```

## 🎨 Game Modes

### Multiplayer Mode
- Play with 2-5 players
- Turn-based gameplay
- Competitive scoring
- Real-time game state updates

### Solitaire Mode
- Single-player experience
- High score tracking
- Challenge yourself to beat your best score
- Nearby scores display shows your ranking

## 🔧 Browser Compatibility

- ✅ **Chrome** 60+
- ✅ **Firefox** 55+  
- ✅ **Safari** 11+
- ✅ **Edge** 79+

**Features used:**
- ES6+ JavaScript (classes, arrow functions, destructuring)
- CSS Grid & Flexbox
- Local Storage API
- CSS Animations & Transitions
- SVG graphics

## 📖 Documentation

- **[Player Rules](docs/PLAYER_RULES.md)**: Concise, player-friendly rules
- **[Formal Rules](docs/FORMAL_RULES.md)**: Complete technical specification
- **[Tutorial](tutorial.html)**: Interactive tutorial with examples
- **[Deployment Guide](DEPLOYMENT.md)**: GitHub Pages setup instructions

## 🚀 Deployment

This game is ready to be deployed to GitHub Pages as a single-page web application. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

After deployment, your app will be available at:
`https://[username].github.io/[repository-name]/`

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Maintain clean, commented code
- Follow existing code style
- Ensure accessibility compliance
- Test across different browsers

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **SVG Card Graphics**: Custom SVG sprite system for card rendering
- **Local Storage API**: For persistent game state and high scores
- **CSS Animations**: For smooth, engaging visual feedback

---

**Made with ❤️ for card game enthusiasts everywhere!**

*Enjoy the tactical challenge of Sixen!* 🎴✨

