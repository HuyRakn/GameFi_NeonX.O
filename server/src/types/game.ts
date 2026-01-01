/**
 * Game Types (Backend)
 * Shared types for game logic
 */

export type Player = 'X' | 'O';
export type BoardSize = 3 | 4 | 6 | 8;
export type GameStatus = 'ACTIVE' | 'FINISHED' | 'DRAW';
export type GameMode = 'TRAINING' | 'BOT_BATTLE' | 'RANKED_IRON' | 'RANKED_NEON' | 'WHALE_WARS';

export interface Move {
  row: number;
  col: number;
  player: Player;
  timestamp: number;
}

export interface GameState {
  board: (Player | null)[][];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: [number, number][] | null;
  moveHistory: Move[];
  playerXPlacedCount: number;
  playerOPlacedCount: number;
}

export interface GameConfig {
  mode: string;
  boardSize: BoardSize;
  infiniteMode: boolean;
  winCondition: number;
}


