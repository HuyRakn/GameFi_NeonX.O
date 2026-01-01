/**
 * Bot AI Engine
 * Minimax for 3x3, Heuristic for larger boards
 */

import { Player, BoardSize } from '../types/game';
import { TicTacToeEngine } from './TicTacToeEngine';
import { GameConfig } from '../types/game';

export interface BotMove {
  row: number;
  col: number;
  score?: number;
}

export class BotAI {
  private engine: TicTacToeEngine;
  private botPlayer: Player;
  private humanPlayer: Player;
  private boardSize: BoardSize;
  private winCondition: number;

  /**
   * Initialize Bot AI
   * @param engine - Game engine instance
   * @param botPlayer - Bot's player (X or O)
   */
  constructor(engine: TicTacToeEngine, botPlayer: Player) {
    this.engine = engine;
    this.botPlayer = botPlayer;
    this.humanPlayer = botPlayer === 'X' ? 'O' : 'X';
    
    const state = engine.getState();
    // Infer board size from current board
    this.boardSize = state.board.length as BoardSize;
    this.winCondition = this.getWinCondition(this.boardSize);
  }

  /**
   * Get win condition based on board size
   * @param size - Board size
   * @returns Win condition (3, 4, or 5)
   */
  private getWinCondition(size: BoardSize): number {
    if (size === 3 || size === 4) return 3;
    if (size === 6) return 4;
    return 5; // 8x8
  }

  /**
   * Calculate best move (async version for compatibility)
   * @param difficulty - Bot difficulty level
   * @returns Best move coordinates
   */
  async getBestMove(difficulty: 'easy' | 'medium' | 'hard' = 'hard'): Promise<BotMove> {
    return this.getBestMoveSync(difficulty);
  }

  /**
   * Calculate best move synchronously (faster, no Promise overhead)
   * @param difficulty - Bot difficulty level
   * @returns Best move coordinates
   */
  getBestMoveSync(difficulty: 'easy' | 'medium' | 'hard' = 'hard'): BotMove {
    // Use Minimax for 3x3 boards
    if (this.boardSize === 3) {
      return this.minimaxMove(difficulty);
    }

    // Use optimized Heuristic for larger boards
    return this.heuristicMoveOptimized(difficulty);
  }

  /**
   * Minimax algorithm for 3x3 boards
   * @param difficulty - Bot difficulty
   * @returns Best move
   */
  private minimaxMove(difficulty: 'easy' | 'medium' | 'hard'): BotMove {
    const state = this.engine.getState();
    const board = state.board;
    
    // Easy: Random valid move
    if (difficulty === 'easy') {
      const validMoves = this.getValidMoves(board);
      if (validMoves.length === 0) {
        return { row: -1, col: -1 };
      }
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      return randomMove;
    }

    // Medium: Mix of random and optimal
    if (difficulty === 'medium') {
      const validMoves = this.getValidMoves(board);
      if (validMoves.length === 0) {
        return { row: -1, col: -1 };
      }
      
      // 70% chance to use optimal, 30% random
      if (Math.random() < 0.7) {
        const bestMove = this.minimax(board, 0, true);
        return bestMove;
      } else {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        return randomMove;
      }
    }

    // Hard: Full minimax with alpha-beta pruning
    return this.minimax(board, 0, true);
  }

  /**
   * Minimax with alpha-beta pruning
   * @param board - Current board state (will be cloned)
   * @param depth - Current depth
   * @param isMaximizing - True if maximizing player
   * @param alpha - Alpha value for pruning
   * @param beta - Beta value for pruning
   * @returns Best move with score
   */
  private minimax(
    board: Player[][],
    depth: number,
    isMaximizing: boolean,
    alpha: number = -Infinity,
    beta: number = Infinity
  ): BotMove {
    // Clone board to avoid mutating original
    const clonedBoard = board.map(row => [...row]);
    const winner = this.checkWinner(clonedBoard);
    
    if (winner === this.botPlayer) {
      return { row: -1, col: -1, score: 10 - depth };
    }
    if (winner === this.humanPlayer) {
      return { row: -1, col: -1, score: depth - 10 };
    }
    if (this.isBoardFull(clonedBoard)) {
      return { row: -1, col: -1, score: 0 };
    }

    const validMoves = this.getValidMoves(clonedBoard);
    if (validMoves.length === 0) {
      return { row: -1, col: -1, score: 0 };
    }

    let bestMove: BotMove = { row: -1, col: -1, score: isMaximizing ? -Infinity : Infinity };

    for (const move of validMoves) {
      // Make move
      clonedBoard[move.row][move.col] = isMaximizing ? this.botPlayer : this.humanPlayer;

      // Recursive call
      const result = this.minimax(clonedBoard, depth + 1, !isMaximizing, alpha, beta);

      // Undo move
      clonedBoard[move.row][move.col] = null;

      if (isMaximizing) {
        if (result.score! > bestMove.score!) {
          bestMove = { row: move.row, col: move.col, score: result.score };
        }
        alpha = Math.max(alpha, result.score!);
        if (beta <= alpha) break; // Alpha-beta pruning
      } else {
        if (result.score! < bestMove.score!) {
          bestMove = { row: move.row, col: move.col, score: result.score };
        }
        beta = Math.min(beta, result.score!);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }

    return bestMove;
  }

  /**
   * Heuristic-based move for larger boards (optimized version)
   * @param difficulty - Bot difficulty
   * @returns Best move based on heuristics
   */
  private heuristicMoveOptimized(difficulty: 'easy' | 'medium' | 'hard'): BotMove {
    const state = this.engine.getState();
    const board = state.board;
    const validMoves = this.getValidMoves(board);

    if (validMoves.length === 0) {
      return { row: -1, col: -1 };
    }

    // For speed: prioritize center moves (better strategic positions)
    // Center moves are more valuable in Tic-Tac-Toe variants
    const center = Math.floor(this.boardSize / 2);
    const prioritizedMoves = [...validMoves].sort((a, b) => {
      const distA = Math.abs(a.row - center) + Math.abs(a.col - center);
      const distB = Math.abs(b.row - center) + Math.abs(b.col - center);
      return distA - distB;
    });

    // For 6x6: evaluate all moves (fast enough with optimized heuristic)
    // For 8x8: limit to top 30 moves for speed
    const maxMoves = this.boardSize === 8 ? 30 : validMoves.length;
    const movesToEvaluate = prioritizedMoves.slice(0, Math.min(maxMoves, validMoves.length));

    // Score moves (optimized evaluation)
    const scoredMoves = movesToEvaluate.map(move => ({
      ...move,
      score: this.evaluateMoveFast(board, move.row, move.col),
    }));

    // Sort by score (descending)
    scoredMoves.sort((a, b) => b.score - a.score);

    // Easy: Random from bottom 50%
    if (difficulty === 'easy') {
      const bottomHalf = scoredMoves.slice(Math.floor(scoredMoves.length / 2));
      return bottomHalf[Math.floor(Math.random() * bottomHalf.length)] || scoredMoves[0];
    }

    // Medium: Random from top 50%
    if (difficulty === 'medium') {
      const topHalf = scoredMoves.slice(0, Math.ceil(scoredMoves.length / 2));
      return topHalf[Math.floor(Math.random() * topHalf.length)] || scoredMoves[0];
    }

    // Hard: Best move
    return scoredMoves[0];
  }

  /**
   * Heuristic-based move for larger boards (original, kept for compatibility)
   * @param difficulty - Bot difficulty
   * @returns Best move based on heuristics
   */
  private heuristicMove(difficulty: 'easy' | 'medium' | 'hard'): BotMove {
    return this.heuristicMoveOptimized(difficulty);
  }

  /**
   * Fast evaluation move using optimized heuristics
   * @param board - Current board
   * @param row - Row to evaluate
   * @param col - Column to evaluate
   * @returns Score for this move
   */
  private evaluateMoveFast(
    board: Player[][],
    row: number,
    col: number
  ): number {
    let score = 0;

    // Check all directions from this position (no board cloning for speed)
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal \
      [1, -1], // diagonal /
    ];

    // Offensive evaluation (if bot places here)
    for (const [deltaRow, deltaCol] of directions) {
      const lineScore = this.evaluateLineFast(
        board,
        row,
        col,
        deltaRow,
        deltaCol,
        this.botPlayer,
        this.humanPlayer,
        true // isBotMove
      );
      score += lineScore;
    }

    // Defensive evaluation (if opponent places here - must block!)
    for (const [deltaRow, deltaCol] of directions) {
      const threatScore = this.evaluateLineFast(
        board,
        row,
        col,
        deltaRow,
        deltaCol,
        this.humanPlayer,
        this.botPlayer,
        false // isOpponentMove
      );
      score += threatScore * 1.2; // Blocking threats is important!
    }

    return score;
  }

  /**
   * Evaluate move using heuristics (original, kept for compatibility)
   * @param board - Current board
   * @param row - Row to evaluate
   * @param col - Column to evaluate
   * @param difficulty - Bot difficulty
   * @returns Score for this move
   */
  private evaluateMove(
    board: Player[][],
    row: number,
    col: number,
    difficulty: 'easy' | 'medium' | 'hard'
  ): number {
    return this.evaluateMoveFast(board, row, col);
  }

  /**
   * Fast line evaluation (optimized, no board mutation)
   * @param board - Current board
   * @param row - Starting row
   * @param col - Starting column
   * @param deltaRow - Row direction
   * @param deltaCol - Column direction
   * @param player - Player to evaluate for
   * @param opponent - Opponent player
   * @param isBotMove - True if evaluating bot's move, false for opponent's threat
   * @returns Score for this line
   */
  private evaluateLineFast(
    board: Player[][],
    row: number,
    col: number,
    deltaRow: number,
    deltaCol: number,
    player: Player,
    opponent: Player,
    isBotMove: boolean
  ): number {
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    // Count forward direction (from position)
    for (let i = 0; i < this.winCondition; i++) {
      const checkRow = row + deltaRow * i;
      const checkCol = col + deltaCol * i;

      if (
        checkRow >= 0 &&
        checkRow < this.boardSize &&
        checkCol >= 0 &&
        checkCol < this.boardSize
      ) {
        const cell = board[checkRow][checkCol];
        if (cell === player) {
          playerCount++;
        } else if (cell === opponent) {
          opponentCount++;
          break; // Blocked, stop counting
        } else {
          emptyCount++;
        }
      } else {
        break; // Out of bounds
      }
    }

    // Count backward direction
    for (let i = 1; i < this.winCondition; i++) {
      const checkRow = row - deltaRow * i;
      const checkCol = col - deltaCol * i;

      if (
        checkRow >= 0 &&
        checkRow < this.boardSize &&
        checkCol >= 0 &&
        checkCol < this.boardSize
      ) {
        const cell = board[checkRow][checkCol];
        if (cell === player) {
          playerCount++;
        } else if (cell === opponent) {
          opponentCount++;
          break; // Blocked, stop counting
        } else {
          emptyCount++;
        }
      } else {
        break; // Out of bounds
      }
    }

    // Blocked line (opponent in the way)
    if (opponentCount > 0 && playerCount === 0) {
      return 0;
    }

    // Winning move (highest priority) - must have exactly winCondition-1 pieces and at least 1 empty
    if (playerCount === this.winCondition - 1 && emptyCount >= 1) {
      return isBotMove ? 1000000 : 500000; // Bot win > Block opponent win
    }

    // Two moves from win
    if (playerCount === this.winCondition - 2 && emptyCount >= 2) {
      return 10000;
    }

    // Three moves from win
    if (playerCount === this.winCondition - 3 && emptyCount >= 3) {
      return 1000;
    }

    // General position value (center bonus)
    const center = Math.floor(this.boardSize / 2);
    const centerBonus = Math.abs(row - center) + Math.abs(col - center) === 0 ? 20 : 0;
    return playerCount * 10 + (emptyCount > 0 ? 5 : 0) + centerBonus;
  }

  /**
   * Evaluate a line in a specific direction (original, kept for compatibility)
   * @param board - Current board
   * @param row - Starting row
   * @param col - Starting column
   * @param deltaRow - Row direction
   * @param deltaCol - Column direction
   * @param player - Player to evaluate for
   * @param opponent - Opponent player
   * @returns Score for this line
   */
  private evaluateLine(
    board: Player[][],
    row: number,
    col: number,
    deltaRow: number,
    deltaCol: number,
    player: Player,
    opponent: Player
  ): number {
    return this.evaluateLineFast(board, row, col, deltaRow, deltaCol, player, opponent, true);
  }

  /**
   * Get all valid moves
   * @param board - Current board
   * @returns Array of valid moves
   */
  private getValidMoves(board: Player[][]): BotMove[] {
    const moves: BotMove[] = [];

    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (board[row][col] === null) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }

  /**
   * Check if there's a winner
   * @param board - Current board
   * @returns Winner player or null
   */
  private checkWinner(board: Player[][]): Player | null {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        const player = board[row][col];
        if (player === null) continue;

        // Check all directions
        const directions = [
          [0, 1], // horizontal
          [1, 0], // vertical
          [1, 1], // diagonal \
          [1, -1], // diagonal /
        ];

        for (const [deltaRow, deltaCol] of directions) {
          if (this.checkDirection(board, row, col, deltaRow, deltaCol, player)) {
            return player;
          }
        }
      }
    }

    return null;
  }

  /**
   * Check win condition in a direction
   * @param board - Current board
   * @param startRow - Starting row
   * @param startCol - Starting column
   * @param deltaRow - Row direction
   * @param deltaCol - Column direction
   * @param player - Player to check
   * @returns True if win condition met
   */
  private checkDirection(
    board: Player[][],
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
        board[row][col] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    return count === this.winCondition;
  }

  /**
   * Check if board is full
   * @param board - Current board
   * @returns True if board is full
   */
  private isBoardFull(board: Player[][]): boolean {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (board[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }
}

