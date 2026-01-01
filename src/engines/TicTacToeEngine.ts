/**
 * Core Tic-Tac-Toe Game Engine
 * Handles game logic for all board sizes and game modes
 */

import { Player, GameState, Move, GameConfig, BoardSize } from '../types/game';

export class TicTacToeEngine {
  private board: Player[][];
  private boardSize: BoardSize;
  private winCondition: number;
  private infiniteMode: boolean;
  private playerXPlacedCount: number = 0;
  private playerOPlacedCount: number = 0;
  private moveHistory: Move[] = [];
  private placedOrder: Array<{ player: Player; row: number; col: number }> = [];

  /**
   * Initialize game engine
   * @param config - Game configuration
   */
  constructor(config: GameConfig) {
    this.boardSize = config.boardSize;
    this.winCondition = config.winCondition;
    this.infiniteMode = config.infiniteMode;
    this.board = this.createEmptyBoard();
  }

  /**
   * Create empty board
   * @returns Empty board matrix
   */
  private createEmptyBoard(): Player[][] {
    return Array(this.boardSize)
      .fill(null)
      .map(() => Array(this.boardSize).fill(null));
  }

  /**
   * Get current game state
   * @returns Current game state
   */
  getState(): GameState {
    return {
      board: this.board.map(row => [...row]),
      currentPlayer: this.getCurrentPlayer(),
      status: this.getGameStatus(),
      winner: this.getWinner(),
      winningLine: this.getWinningLine(),
      moveHistory: [...this.moveHistory],
      playerXPlacedCount: this.playerXPlacedCount,
      playerOPlacedCount: this.playerOPlacedCount,
    };
  }

  /**
   * Get current player based on move history
   * @returns Current player (X or O)
   */
  private getCurrentPlayer(): Player {
    return this.moveHistory.length % 2 === 0 ? 'X' : 'O';
  }

  /**
   * Make a move on the board
   * @param row - Row index
   * @param col - Column index
   * @param player - Player making the move
   * @returns True if move is valid and executed
   */
  makeMove(row: number, col: number, player: Player): boolean {
    if (!this.isValidMove(row, col, player)) {
      return false;
    }

    // Handle infinite mode: remove oldest piece if limit reached
    if (this.infiniteMode) {
      const maxPieces = this.boardSize === 3 ? 3 : 4;
      const playerCount = player === 'X' ? this.playerXPlacedCount : this.playerOPlacedCount;

      if (playerCount >= maxPieces) {
        this.removeOldestPiece(player);
      }
    }

    // Place new piece
    this.board[row][col] = player;
    
    if (player === 'X') {
      this.playerXPlacedCount++;
    } else {
      this.playerOPlacedCount++;
    }

    // Track placement order for infinite mode
    this.placedOrder.push({ player, row, col });

    // Record move
    const move: Move = {
      row,
      col,
      player,
      timestamp: Date.now(),
    };
    this.moveHistory.push(move);

    return true;
  }

  /**
   * Check if move is valid
   * @param row - Row index
   * @param col - Column index
   * @param player - Player making the move
   * @returns True if move is valid
   */
  private isValidMove(row: number, col: number, player: Player): boolean {
    // Check bounds
    if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
      return false;
    }

    // Check if cell is empty (unless infinite mode allows overwrite)
    if (!this.infiniteMode && this.board[row][col] !== null) {
      return false;
    }

    // Check if it's player's turn
    const currentPlayer = this.getCurrentPlayer();
    if (player !== currentPlayer) {
      return false;
    }

    return true;
  }

  /**
   * Remove oldest piece for infinite mode
   * @param player - Player whose oldest piece to remove
   */
  private removeOldestPiece(player: Player): void {
    // Find oldest piece of this player
    for (const placed of this.placedOrder) {
      if (placed.player === player) {
        this.board[placed.row][placed.col] = null;
        this.placedOrder = this.placedOrder.filter(
          p => !(p.row === placed.row && p.col === placed.col && p.player === player)
        );
        
        if (player === 'X') {
          this.playerXPlacedCount--;
        } else {
          this.playerOPlacedCount--;
        }
        break;
      }
    }
  }

  /**
   * Check if game is won
   * @returns Winner player or null
   */
  private getWinner(): Player | null {
    // Check all directions for win condition
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const player = this.board[row][col];
        if (player === null) continue;

        // Check horizontal
        if (this.checkDirection(row, col, 0, 1, player)) {
          return player;
        }

        // Check vertical
        if (this.checkDirection(row, col, 1, 0, player)) {
          return player;
        }

        // Check diagonal \
        if (this.checkDirection(row, col, 1, 1, player)) {
          return player;
        }

        // Check diagonal /
        if (this.checkDirection(row, col, 1, -1, player)) {
          return player;
        }
      }
    }

    return null;
  }

  /**
   * Check if there's a win in a specific direction
   * @param startRow - Starting row
   * @param startCol - Starting column
   * @param deltaRow - Row direction
   * @param deltaCol - Column direction
   * @param player - Player to check
   * @returns True if win condition met
   */
  private checkDirection(
    startRow: number,
    startCol: number,
    deltaRow: number,
    deltaCol: number,
    player: Player
  ): boolean {
    let count = 0;

    for (let i = 0; i < this.winCondition; i++) {
      const row = startRow + deltaRow * i;
      const col = startCol + deltaCol * i;

      if (
        row >= 0 &&
        row < this.boardSize &&
        col >= 0 &&
        col < this.boardSize &&
        this.board[row][col] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    return count === this.winCondition;
  }

  /**
   * Get winning line coordinates
   * @returns Array of [row, col] coordinates or null
   */
  private getWinningLine(): [number, number][] | null {
    const winner = this.getWinner();
    if (!winner) return null;

    // Find winning line
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const player = this.board[row][col];
        if (player !== winner) continue;

        // Check all directions
        const directions = [
          [0, 1], // horizontal
          [1, 0], // vertical
          [1, 1], // diagonal \
          [1, -1], // diagonal /
        ];

        for (const [deltaRow, deltaCol] of directions) {
          const line = this.getWinningLineInDirection(row, col, deltaRow, deltaCol, winner);
          if (line) {
            return line;
          }
        }
      }
    }

    return null;
  }

  /**
   * Get winning line in specific direction
   * @param startRow - Starting row
   * @param startCol - Starting column
   * @param deltaRow - Row direction
   * @param deltaCol - Column direction
   * @param player - Player to check
   * @returns Array of coordinates or null
   */
  private getWinningLineInDirection(
    startRow: number,
    startCol: number,
    deltaRow: number,
    deltaCol: number,
    player: Player
  ): [number, number][] | null {
    const line: [number, number][] = [];

    for (let i = 0; i < this.winCondition; i++) {
      const row = startRow + deltaRow * i;
      const col = startCol + deltaCol * i;

      if (
        row >= 0 &&
        row < this.boardSize &&
        col >= 0 &&
        col < this.boardSize &&
        this.board[row][col] === player
      ) {
        line.push([row, col]);
      } else {
        return null;
      }
    }

    return line.length === this.winCondition ? line : null;
  }

  /**
   * Check if game is draw
   * @returns True if game is draw
   */
  private isDraw(): boolean {
    if (this.getWinner() !== null) {
      return false;
    }

    // In infinite mode, draw is impossible
    if (this.infiniteMode) {
      return false;
    }

    // Check if board is full
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] === null) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get game status
   * @returns Current game status
   */
  private getGameStatus(): GameState['status'] {
    if (this.getWinner() !== null) {
      return 'FINISHED';
    }

    if (this.isDraw()) {
      return 'DRAW';
    }

    return 'ACTIVE';
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this.board = this.createEmptyBoard();
    this.playerXPlacedCount = 0;
    this.playerOPlacedCount = 0;
    this.moveHistory = [];
    this.placedOrder = [];
  }

  /**
   * Undo last move
   * @returns True if undo successful
   */
  undo(): boolean {
    if (this.moveHistory.length === 0) {
      return false;
    }

    const lastMove = this.moveHistory.pop()!;
    this.board[lastMove.row][lastMove.col] = null;

    if (lastMove.player === 'X') {
      this.playerXPlacedCount--;
    } else {
      this.playerOPlacedCount--;
    }

    // Remove from placed order
    this.placedOrder = this.placedOrder.filter(
      p => !(p.row === lastMove.row && p.col === lastMove.col && p.player === lastMove.player)
    );

    return true;
  }
}


