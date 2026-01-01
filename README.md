# Neon X.O - Competitive Tic-Tac-Toe on Solana Seeker

A professional competitive Tic-Tac-Toe game built with React Native (Expo) for Solana Seeker devices, featuring Web3 integration, real-time multiplayer, and skill-based gameplay with entry fees and rewards.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Root directory
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Setup Environment Variables

Create `.env.local` in root directory:
```
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_TREASURY_WALLET=your_treasury_wallet_address
EXPO_PUBLIC_DEV_WALLET=your_dev_wallet_address
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

Create `server/.env.local`:
```
MONGODB_URI=mongodb+srv://...
PORT=3000
TREASURY_WALLET=your_treasury_wallet_address
TREASURY_PRIVATE_KEY=your_treasury_private_key_base58
DEV_WALLET=your_dev_wallet_address
SOLANA_RPC_URL=https://api.devnet.solana.com
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

- **Core Game Engine**: 3x3 Infinite, 6x6, 8x8 boards with win detection
- **Bot AI**: Minimax for 3x3, Heuristic for larger boards
- **UI/UX**: Neon Noir theme with smooth animations
- **Offline Modes**: Training (3x3 Infinite), Bot Battle (6x6)
- **Multiplayer**: Real-time PVP with Socket.io
- **Matchmaking**: Queue system for ranked modes
- **Room System**: Create/Join rooms for custom games
- **Web3 Integration**: Solana Mobile Wallet Adapter support
- **Payment System**: Entry fees, automatic refunds, winner payouts
- **Backend**: NestJS + MongoDB + Socket.io
- **Database**: User profiles, game history, room management
- **Escrow Service**: Secure payment handling with refund mechanism

## 🎮 Game Modes

| Mode | Board | Win Condition | Entry Fee | Prize Pool |
|------|-------|---------------|-----------|------------|
| Training | 3x3 Infinite | 3-in-a-row | Free | - |
| Bot Battle | 6x6 | 4-in-a-row | Free | - |
| Ranked Iron | 3x3 Infinite | 3-in-a-row | 0.00099 SOL | 90% of pot |
| Ranked Neon | 6x6 | 4-in-a-row | 0.00199 SOL | 90% of pot |
| Whale Wars | 8x8 | 5-in-a-row | 0.00299 SOL | 90% of pot |

**Note**: Winner receives 90% of total pot, 10% goes to platform fee.

## 🏗️ Architecture

### Frontend
- **Framework**: React Native (Expo) ~54.0.30
- **UI**: NativeWind v4 (Tailwind CSS)
- **Animation**: React Native Reanimated 4.1.1
- **State**: React Hooks + Context API
- **Real-time**: Socket.io Client 4.7.5
- **Web3**: @solana/web3.js 1.91.8, @solana-mobile/mobile-wallet-adapter-protocol-web3js 2.2.5
- **Storage**: expo-secure-store for wallet sessions

### Backend
- **Framework**: NestJS 10.3.0
- **Database**: MongoDB (Mongoose 8.0.0)
- **Real-time**: Socket.io 4.7.5
- **Web3**: @solana/web3.js 1.91.8 for payment verification
- **Language**: TypeScript 5.3.3

## 📁 Project Structure

```
neon-xo/
├── src/
│   ├── components/      # UI Components (NeonGrid, NeonButton, GameBoard, Modals)
│   ├── engines/          # Game Logic (TicTacToeEngine, BotAI)
│   ├── hooks/            # Custom Hooks (useSocket, useMobileWallet, useGameTransactions)
│   ├── screens/          # App Screens (Home, Game, MultiplayerGame)
│   ├── contexts/         # React Contexts (WalletContext)
│   ├── types/            # TypeScript Types
│   └── utils/            # Utilities (getBackendUrl)
├── server/               # NestJS Backend
│   ├── src/
│   │   ├── models/       # MongoDB Schemas (User, Game, Room)
│   │   ├── modules/      # NestJS Modules (Game with EscrowService)
│   │   ├── database/      # Database Setup
│   │   └── engines/      # Server-side Game Engine
│   └── package.json
├── android/              # Android native project
├── App.tsx
└── package.json
```

## 🔧 Configuration

### Environment Variables

**Root `.env.local`** (Frontend):
```
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_TREASURY_WALLET=your_treasury_wallet_address
EXPO_PUBLIC_DEV_WALLET=your_dev_wallet_address
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

**Server `server/.env.local`** (Backend):
```
MONGODB_URI=mongodb+srv://...
PORT=3000
TREASURY_WALLET=your_treasury_wallet_address
TREASURY_PRIVATE_KEY=your_treasury_private_key_base58
DEV_WALLET=your_dev_wallet_address
SOLANA_RPC_URL=https://api.devnet.solana.com
```

**Important**: 
- Never commit `.env.local` files to git
- `TREASURY_PRIVATE_KEY` should only be in backend, never in frontend
- Use `EXPO_PUBLIC_*` prefix for frontend environment variables

## 📱 Building APK for Production

### 1. Generate Release Keystore

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Keystore Passwords

Add to `android/gradle.properties`:
```
KEYSTORE_PASSWORD=your_keystore_password
KEY_PASSWORD=your_key_password
```

Or use environment variables:
```powershell
$env:KEYSTORE_PASSWORD="your_keystore_password"
$env:KEY_PASSWORD="your_key_password"
```

### 3. Build APK

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 4. Build AAB (for Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

**Important**: 
- Never commit `release.keystore` or passwords to git
- Backup keystore and passwords securely
- If keystore is lost, you cannot update the app on Play Store

## 🎯 How to Play

### Offline Modes

1. **Training**: Practice with 3x3 Infinite mode (max 3 pieces per player)
2. **Bot Battle**: Challenge AI on 6x6 board

### Multiplayer Modes

1. Connect your Solana wallet (Solana Mobile Wallet Adapter)
2. Select a ranked mode (Iron, Neon, or Whale Wars)
3. System will find an opponent automatically
4. Pay entry fee when match is found
5. Play in real-time!
6. Winner receives 90% of the pot

### Custom Rooms

1. Connect wallet
2. Enter Room ID to join existing room
3. Or create a new room in Training mode

### Payment Flow

- Entry fee is only charged when a match is found
- If opponent disconnects before game starts, automatic refund is processed
- Winner receives 90% of total pot after game ends
- Platform fee: 10% (split between treasury and dev wallet)

## 🐛 Troubleshooting

### Backend không kết nối MongoDB
- Kiểm tra `.env.local` trong `server/` có đúng MongoDB URI
- Đảm bảo MongoDB Atlas cho phép kết nối từ IP của bạn

### Socket.io không kết nối
- Kiểm tra backend đang chạy trên port 3000
- Kiểm tra `EXPO_PUBLIC_SOCKET_URL` trong `.env.local`
- For Android emulator, use `http://10.0.2.2:3000` instead of `localhost`

### Wallet connection fails
- Ensure Solana Mobile Wallet Adapter is installed
- Check `EXPO_PUBLIC_SOLANA_RPC_URL` is correct
- Verify wallet app is running

### Android build fails
- Run `npx expo install --fix` to fix dependencies
- Clear cache: `npx expo start -c`
- Check Android SDK is installed and `ANDROID_HOME` is set
- Verify `android/local.properties` has correct SDK path

### Payment verification fails
- Check backend has correct `TREASURY_PRIVATE_KEY`
- Verify RPC URL is accessible
- Check transaction signatures are valid

## 📝 Development Notes

- Backend sử dụng NestJS với Socket.io cho real-time communication
- Frontend sử dụng Expo 54 với React Native 0.81.5
- Database: MongoDB (Mongoose) - Free tier
- Real-time: Socket.io với connection state recovery
- Bot AI chạy client-side cho offline modes
- Payment system: Backend escrow service handles all payments (no smart contracts)
- Wallet: Solana Mobile Wallet Adapter for seamless wallet integration
- Security: Private keys only on backend, secure session storage on frontend

## 📄 License

MIT
