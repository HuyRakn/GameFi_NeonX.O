/**
 * Game types and interfaces for Neon X.O
 */

export type Player = 'X' | 'O' | null;

export type GameMode = 'TRAINING' | 'BOT_BATTLE' | 'RANKED_IRON' | 'RANKED_NEON' | 'WHALE_WARS';

export type BoardSize = 3 | 4 | 6 | 8;

export type GameStatus = 'WAITING' | 'ACTIVE' | 'FINISHED' | 'DRAW';

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: [number, number][] | null;
  moveHistory: Move[];
  playerXPlacedCount: number;
  playerOPlacedCount: number;
}

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
}

export interface GameConfig {
  mode: GameMode;
  boardSize: BoardSize;
  infiniteMode: boolean;
  winCondition: number; // 3, 4, or 5 in a row
}

export interface BotDifficulty {
  level: 'easy' | 'medium' | 'hard';
  thinkTime: number; // milliseconds
}


