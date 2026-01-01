/**
 * Game Service
 * Business logic for game management
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../models/user.schema';
import { Game, GameDocument } from '../../models/game.schema';
import { Room, RoomDocument } from '../../models/room.schema';
import { TicTacToeEngine } from '../../engines/TicTacToeEngine';
import { GameConfig, GameState, Player } from '../../types/game';

interface MatchmakingQueue {
  playerId: string;
  mode: string;
  socketId: string;
  timestamp: number;
}

@Injectable()
export class GameService {
  private activeGames: Map<string, TicTacToeEngine> = new Map();
  private matchmakingQueue: Map<string, MatchmakingQueue[]> = new Map();
  private playerRooms: Map<string, string> = new Map(); // socketId -> roomId
  private playerSocketMap: Map<string, string> = new Map(); // playerId -> socketId

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  /**
   * Get or create user
   * @param walletAddress - Wallet address
   * @returns User document
   */
  async getOrCreateUser(walletAddress: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ walletAddress });
    if (!user) {
      user = new this.userModel({ walletAddress, elo: 1000 });
      await user.save();
    }
    return user;
  }

  /**
   * Create a new game room
   * @param playerId - Player wallet address
   * @param mode - Game mode
   * @returns Room ID
   */
  async createRoom(playerId: string, mode: string): Promise<string> {
    const config = this.getGameConfig(mode);
    const roomId = `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const room = new this.roomModel({
      roomId,
      mode,
      boardSize: config.boardSize,
      winCondition: config.winCondition,
      infiniteMode: config.infiniteMode,
      players: [playerId],
      status: 'WAITING',
    });

    await room.save();
    return roomId;
  }

  /**
   * Join a game room
   * @param roomId - Room ID
   * @param playerId - Player wallet address
   * @returns Success status
   */
  async joinRoom(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) {
      return false;
    }

    if (room.players.length >= 2) {
      return false; // Room full
    }

    if (room.players.includes(playerId)) {
      return true; // Already in room
    }

    room.players.push(playerId);
    if (room.players.length === 2) {
      room.status = 'ACTIVE';
      // Initialize game engine
      const config = this.getGameConfig(room.mode);
      const engine = new TicTacToeEngine(config);
      this.activeGames.set(roomId, engine);
    }

    await room.save();
    return true;
  }

  /**
   * Make a move in the game
   * @param roomId - Room ID
   * @param row - Row index
   * @param col - Column index
   * @param player - Player making the move
   * @returns Move result
   */
  makeMove(roomId: string, row: number, col: number, player: Player): {
    success: boolean;
    gameState?: GameState;
    error?: string;
  } {
    const engine = this.activeGames.get(roomId);
    if (!engine) {
      return { success: false, error: 'Game not found' };
    }

    const currentState = engine.getState();
    if (currentState.currentPlayer !== player) {
      return { success: false, error: 'Not your turn' };
    }

    const success = engine.makeMove(row, col, player);
    if (!success) {
      return { success: false, error: 'Invalid move' };
    }

    const newState = engine.getState();
    return { success: true, gameState: newState };
  }

  /**
   * Finish game and update records
   * @param roomId - Room ID
   * @param winner - Winner player or null for draw
   */
  async finishGame(roomId: string, winner: Player | null): Promise<void> {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) return;

    const engine = this.activeGames.get(roomId);
    if (!engine) return;

    const gameState = engine.getState();
    const playerX = room.players[0];
    const playerO = room.players[1];

    // Create game record
    const game = new this.gameModel({
      roomId,
      playerX,
      playerO,
      mode: room.mode,
      boardSize: room.boardSize,
      winCondition: room.winCondition,
      infiniteMode: room.infiniteMode,
      moves: gameState.moveHistory.map(m => ({
        row: m.row,
        col: m.col,
        player: m.player,
        timestamp: m.timestamp,
      })),
      winner: winner,
      betAmount: room.betAmount,
      prizeAmount: room.betAmount * 1.8, // 90% of pot (10% fee)
      status: 'FINISHED',
      startedAt: room.createdAt,
      finishedAt: new Date(),
    });

    await game.save();

    // Update user stats
    await this.updateUserStats(playerX, playerO, winner);

    // Clean up
    this.activeGames.delete(roomId);
    room.status = 'FINISHED';
    await room.save();
  }

  /**
   * Update user statistics
   * @param playerX - Player X wallet
   * @param playerO - Player O wallet
   * @param winner - Winner or null
   */
  private async updateUserStats(
    playerX: string,
    playerO: string,
    winner: Player | null,
  ): Promise<void> {
    const userX = await this.getOrCreateUser(playerX);
    const userO = await this.getOrCreateUser(playerO);

    userX.totalGames++;
    userO.totalGames++;

    if (winner === 'X') {
      userX.wins++;
      userO.losses++;
      // Update ELO (simplified)
      userX.elo += 20;
      userO.elo = Math.max(0, userO.elo - 20);
    } else if (winner === 'O') {
      userO.wins++;
      userX.losses++;
      userO.elo += 20;
      userX.elo = Math.max(0, userX.elo - 20);
    } else {
      userX.draws++;
      userO.draws++;
    }

    await userX.save();
    await userO.save();
  }

  /**
   * Add player to matchmaking queue
   * @param playerId - Player wallet address
   * @param mode - Game mode
   * @param socketId - Socket ID
   */
  addToQueue(playerId: string, mode: string, socketId: string): void {
    if (!this.matchmakingQueue.has(mode)) {
      this.matchmakingQueue.set(mode, []);
    }

    const queue = this.matchmakingQueue.get(mode)!;
    
    // Remove if already in queue
    const existingIndex = queue.findIndex(p => p.playerId === playerId);
    if (existingIndex >= 0) {
      queue.splice(existingIndex, 1);
    }

    queue.push({
      playerId,
      mode,
      socketId,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove player from matchmaking queue
   * @param playerId - Player wallet address
   * @param mode - Game mode
   */
  removeFromQueue(playerId: string, mode: string): void {
    const queue = this.matchmakingQueue.get(mode);
    if (!queue) return;

    const index = queue.findIndex(p => p.playerId === playerId);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  }

  /**
   * Find match for player
   * @param playerId - Player wallet address
   * @param mode - Game mode
   * @returns Matched player or null
   */
  findMatch(playerId: string, mode: string): MatchmakingQueue | null {
    const queue = this.matchmakingQueue.get(mode);
    if (!queue || queue.length < 2) {
      return null;
    }

    const player = queue.find(p => p.playerId === playerId);
    if (!player) {
      return null;
    }

    // Find opponent (simple matching, can be improved with ELO)
    const opponent = queue.find(p => p.playerId !== playerId);
    if (!opponent) {
      return null;
    }

    // Remove both from queue
    this.removeFromQueue(playerId, mode);
    this.removeFromQueue(opponent.playerId, mode);

    return opponent;
  }

  /**
   * Get game configuration by mode
   * @param mode - Game mode
   * @returns Game configuration
   */
  private getGameConfig(mode: string): GameConfig {
    switch (mode) {
      case 'TRAINING':
        return {
          mode: 'TRAINING',
          boardSize: 3,
          infiniteMode: true,
          winCondition: 3,
        };
      case 'BOT_BATTLE':
        return {
          mode: 'BOT_BATTLE',
          boardSize: 6,
          infiniteMode: false,
          winCondition: 4,
        };
      case 'RANKED_IRON':
        return {
          mode: 'RANKED_IRON',
          boardSize: 3,
          infiniteMode: true,
          winCondition: 3,
        };
      case 'RANKED_NEON':
        return {
          mode: 'RANKED_NEON',
          boardSize: 6,
          infiniteMode: false,
          winCondition: 4,
        };
      case 'WHALE_WARS':
        return {
          mode: 'WHALE_WARS',
          boardSize: 8,
          infiniteMode: false,
          winCondition: 5,
        };
      default:
        return {
          mode: 'TRAINING',
          boardSize: 3,
          infiniteMode: true,
          winCondition: 3,
        };
    }
  }

  /**
   * Get active game state
   * @param roomId - Room ID
   * @returns Game state or null
   */
  getGameState(roomId: string): GameState | null {
    const engine = this.activeGames.get(roomId);
    if (!engine) return null;
    return engine.getState();
  }

  /**
   * Get room by ID
   * @param roomId - Room ID
   * @returns Room document or null
   */
  async getRoom(roomId: string): Promise<RoomDocument | null> {
    return this.roomModel.findOne({ roomId });
  }

  /**
   * Set player room mapping
   * @param socketId - Socket ID
   * @param roomId - Room ID
   */
  setPlayerRoom(socketId: string, roomId: string): void {
    this.playerRooms.set(socketId, roomId);
  }

  /**
   * Set player socket mapping
   * @param playerId - Player wallet address
   * @param socketId - Socket ID
   */
  setPlayerSocket(playerId: string, socketId: string): void {
    this.playerSocketMap.set(playerId, socketId);
  }

  /**
   * Get socket ID by player ID
   * @param playerId - Player wallet address
   * @returns Socket ID or undefined
   */
  getPlayerSocket(playerId: string): string | undefined {
    return this.playerSocketMap.get(playerId);
  }

  /**
   * Handle player disconnection
   * @param socketId - Socket ID
   */
  async handleDisconnect(socketId: string): Promise<void> {
    // Find room by socket ID
    const roomId = this.playerRooms.get(socketId);
    if (roomId) {
      // Mark game as cancelled
      const room = await this.roomModel.findOne({ roomId });
      if (room && room.status === 'ACTIVE') {
        room.status = 'FINISHED';
        await room.save();
      }
      this.activeGames.delete(roomId);
      this.playerRooms.delete(socketId);
    }

    // Remove player from socket map
    for (const [playerId, mappedSocketId] of this.playerSocketMap.entries()) {
      if (mappedSocketId === socketId) {
        this.playerSocketMap.delete(playerId);
        break;
      }
    }

    // Remove from all queues
    for (const [mode, queue] of this.matchmakingQueue.entries()) {
      const index = queue.findIndex(p => p.socketId === socketId);
      if (index >= 0) {
        queue.splice(index, 1);
      }
    }
  }
}
