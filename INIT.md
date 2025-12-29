# RBL - Rebus Puzzle Game

## Project Overview

RBL is a multiplayer rebus puzzle game built with React and Vite. Players compete to guess phrases, idioms, and expressions from visual puzzle images.

## Tech Stack

- **Framework**: React 18.2
- **Build Tool**: Vite 4.1
- **Language**: JavaScript (ES Modules)

## Project Structure

```
RBL/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite configuration
├── public/
│   └── assets/images/      # Game puzzle images (screenshots)
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main app with login/game routing & decorations
    ├── App.css             # App-specific styles
    ├── index.css           # Global styles & game UI
    ├── components/
    │   ├── Login.jsx       # Social login screen (FB/Instagram)
    │   └── Game.jsx        # Main game component with timer, answer input
    ├── data/
    │   ├── gameData.json   # 59 puzzle entries with answers & difficulty
    │   ├── Answers - Sheet1.csv  # Source CSV data
    │   └── images/         # Additional game images
    ├── assets/             # (empty - for future assets)
    └── utils/              # (empty - for future utilities)
```

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Game Features

- **Social Login**: Mock Facebook/Instagram authentication
- **Rebus Puzzles**: 59 visual word puzzles to solve
- **Timer**: 30-second countdown per puzzle
- **Voice Input**: Speech recognition for answers (Web Speech API)
- **Difficulty Tracking**: Human/machine difficulty ratings
- **VS Mode**: Player vs Player UI layout (not yet fully implemented)

## Key Components

### App.jsx
- Manages login state
- Renders animated background decorations (balloons, confetti)
- Routes between Login and Game screens

### Login.jsx
- Simple social login UI
- Currently uses mock authentication

### Game.jsx
- Displays puzzle image from `/assets/images/`
- 30-second countdown timer
- Text input with Enter-to-submit
- Voice recognition via Web Speech API
- Hint, Give Up, and Send Emoji buttons
- Difficulty indicator with banana slider

## Data Format (gameData.json)

```json
{
  "file": "Screenshot 2025-11-20 at 9.38.43 PM.png",
  "answer": "split decision",
  "human difficulty": "",
  "machine difficulty": ""
}
```

- `file`: Image filename in `/public/assets/images/`
- `answer`: Correct answer(s), comma-separated for multiple valid answers
- `human difficulty`: 1-6 scale (optional)
- `machine difficulty`: 1-5 scale (optional)

## UI Theme

- Purple gradient background (#5c2a9d → #481e82)
- Yellow accent (#f8db34)
- Mobile-first design (max-width: 450px)
- Rounded card-based layout
- Floating balloon and confetti animations

## Future Development Areas

- Implement real social authentication
- Add multiplayer/real-time competition
- Score tracking and leaderboards
- Hint system implementation
- Emoji reactions between players
- More puzzle content
