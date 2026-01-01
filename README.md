# Neon X.O - Competitive Tic-Tac-Toe on Solana Seeker

A professional competitive Tic-Tac-Toe game built with React Native (Expo) for Solana Seeker devices, featuring Web3 integration and skill-based gameplay.

## 🚀 Quick Start

### 1. Setup Environment

```powershell
# Run setup script
powershell -ExecutionPolicy Bypass -File setup-env.ps1
```

Hoặc tạo thủ công file `.env.local` và `server/.env.local` (xem SETUP_ENV.md)

### 2. Install Dependencies

```bash
# Root directory
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Start Development

```bash
# Start both backend and frontend
npm run dev

# Or separately:
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm start
```

### 4. Run on Android

```bash
npm run android
```

## 📋 Features

### ✅ Completed

- **Core Game Engine**: 3x3 Infinite, 6x6, 8x8 boards
- **Bot AI**: Minimax for 3x3, Heuristic for larger boards
- **UI/UX**: Neon Noir theme with smooth animations
- **Offline Modes**: Training (3x3 Infinite), Bot Battle (6x6)
- **Multiplayer**: Real-time PVP with Socket.io
- **Matchmaking**: Queue system for ranked modes
- **Room System**: Create/Join rooms for custom games
- **Backend**: NestJS + MongoDB + Socket.io
- **Database**: User profiles, game history, room management

### ⏳ Coming Soon

- Solana wallet integration
- Payment system (Entry fees, prizes)
- Leaderboard
- ELO ranking system

## 🎮 Game Modes

| Mode | Board | Win Condition | Entry Fee | Prize |
|------|-------|---------------|-----------|-------|
| Training | 3x3 Infinite | 3-in-a-row | Free | - |
| Bot Battle | 6x6 | 4-in-a-row | Free | - |
| Ranked Iron | 3x3 Infinite | 3-in-a-row | 0.05 SOL | 0.09 SOL |
| Ranked Neon | 6x6 | 4-in-a-row | 0.5 SOL | 0.95 SOL |
| Whale Wars | 8x8 | 5-in-a-row | 5.0 SOL | 9.8 SOL |

## 🏗️ Architecture

### Frontend
- **Framework**: React Native (Expo) ~54.0.30
- **UI**: NativeWind v4 (Tailwind CSS)
- **Animation**: React Native Reanimated 4.1.1
- **State**: React Hooks + Context
- **Real-time**: Socket.io Client 4.7.5

### Backend
- **Framework**: NestJS 10.3.0
- **Database**: MongoDB (Mongoose 8.0.0)
- **Real-time**: Socket.io 4.7.5
- **Language**: TypeScript 5.3.3

## 📁 Project Structure

```
neon-xo/
├── src/
│   ├── components/      # UI Components (NeonGrid, NeonButton, GameBoard)
│   ├── engines/          # Game Logic (TicTacToeEngine, BotAI)
│   ├── hooks/            # Custom Hooks (useSocket)
│   ├── screens/          # App Screens (Home, Game, MultiplayerGame)
│   ├── types/            # TypeScript Types
│   └── utils/            # Utilities
├── server/               # NestJS Backend
│   ├── src/
│   │   ├── models/       # MongoDB Schemas (User, Game, Room)
│   │   ├── modules/      # NestJS Modules (Game)
│   │   └── database/     # Database Setup
│   └── package.json
├── App.tsx
└── package.json
```

## 🔧 Configuration

### Environment Variables

**Root `.env.local`**:
```
MONGODB_URI=mongodb+srv://...
PORT=3000
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

**Server `server/.env.local`**:
```
MONGODB_URI=mongodb+srv://...
PORT=3000
```

## 🎯 How to Play

### Offline Modes

1. **Training**: Practice with 3x3 Infinite mode (max 3 pieces)
2. **Bot Battle**: Challenge AI on 6x6 board

### Multiplayer Modes

1. Enter your Player ID (wallet address or custom ID)
2. Select a ranked mode (Iron, Neon, or Whale Wars)
3. System will find an opponent automatically
4. Play in real-time!

### Custom Rooms

1. Enter Player ID
2. Enter Room ID to join existing room
3. Or create a new room in Training mode

## 🐛 Troubleshooting

### Backend không kết nối MongoDB
- Kiểm tra `.env.local` trong `server/` có đúng MongoDB URI
- Đảm bảo MongoDB Atlas cho phép kết nối từ IP của bạn

### Socket.io không kết nối
- Kiểm tra backend đang chạy trên port 3000
- Kiểm tra `EXPO_PUBLIC_SOCKET_URL` trong `.env.local`

### Android build fails
- Chạy `npx expo install --fix` để fix dependencies
- Clear cache: `npx expo start -c`

## 📝 Development Notes

- Backend sử dụng NestJS với Socket.io
- Frontend sử dụng Expo 54 với React Native 0.81.5
- Database: MongoDB (Mongoose) - Free tier
- Real-time: Socket.io với connection state recovery
- Bot AI chạy client-side cho offline modes

## 📄 License

MIT
