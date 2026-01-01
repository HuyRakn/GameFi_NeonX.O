/**
 * Game Gateway
 * Socket.io gateway for real-time game communication
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { GameService } from './game.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Support both transports
  allowEIO3: true, // Allow Engine.IO v3 clients
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  constructor(private readonly gameService: GameService) {
    this.logger.log('GameGateway initialized');
  }

  /**
   * Handle client connection
   * @param client - Socket client
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle client disconnection
   * @param client - Socket client
   */
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (!this.gameService) {
      this.logger.error('GameService is undefined in handleDisconnect!');
      return;
    }
    await this.gameService.handleDisconnect(client.id);
  }

  /**
   * Handle join room request
   * @param client - Socket client
   * @param data - Room data
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; playerId: string }
  ) {
    const { roomId, playerId } = data;
    const success = await this.gameService.joinRoom(roomId, playerId);
    
    if (success) {
      client.join(roomId);
      this.gameService.setPlayerRoom(client.id, roomId);
      this.gameService.setPlayerSocket(playerId, client.id);
    
      const room = await this.gameService.getRoom(roomId);
      const gameState = this.gameService.getGameState(roomId);
      
      // Determine player assignment: first player is X, second is O
      const playerIndex = room?.players.indexOf(playerId) ?? -1;
      const assignedPlayer = playerIndex === 0 ? 'X' : playerIndex === 1 ? 'O' : null;
      
      client.emit('room-joined', { 
        roomId, 
        gameState,
        player: assignedPlayer, // Send player assignment
      });
      
      // Notify other player if room is full
      if (room && room.players.length === 2) {
        const gameStateForAll = this.gameService.getGameState(roomId);
        // Send to each player with their assignment
        const playerXId = room.players[0];
        const playerOId = room.players[1];
        const playerXSocketId = this.gameService.getPlayerSocket(playerXId);
        const playerOSocketId = this.gameService.getPlayerSocket(playerOId);
        
        if (playerXSocketId) {
          this.server.to(playerXSocketId).emit('game-started', { 
            gameState: gameStateForAll,
            player: 'X',
          });
        }
        if (playerOSocketId) {
          this.server.to(playerOSocketId).emit('game-started', { 
            gameState: gameStateForAll,
            player: 'O',
          });
        }
      }
    } else {
      client.emit('room-error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle game move
   * @param client - Socket client
   * @param data - Move data
   */
  @SubscribeMessage('make-move')
  async handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; row: number; col: number; player: string }
  ) {
    const { roomId, row, col, player } = data;
    const result = this.gameService.makeMove(roomId, row, col, player as 'X' | 'O');
    
    if (result.success && result.gameState) {
      this.server.to(roomId).emit('move-made', {
        row,
        col,
        player,
        gameState: result.gameState,
      });

      // Check if game is finished
      if (result.gameState.status === 'FINISHED' || result.gameState.status === 'DRAW') {
        await this.gameService.finishGame(roomId, result.gameState.winner);
        this.server.to(roomId).emit('game-finished', {
          winner: result.gameState.winner,
          gameState: result.gameState,
        });
      }
    } else {
      client.emit('move-error', { message: result.error || 'Invalid move' });
    }
  }

  /**
   * Handle create room request
   * @param client - Socket client
   * @param data - Room creation data
   */
  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string; mode: string }
  ) {
    const roomId = await this.gameService.createRoom(data.playerId, data.mode);
    client.join(roomId);
    this.gameService.setPlayerRoom(client.id, roomId);
    this.gameService.setPlayerSocket(data.playerId, client.id);
    client.emit('room-created', { roomId });
  }

  /**
   * Handle find match request
   * @param client - Socket client
   * @param data - Matchmaking data
   */
  @SubscribeMessage('find-match')
  async handleFindMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string; mode: string }
  ) {
    try {
      const { playerId, mode } = data;
      
      if (!this.gameService) {
        this.logger.error('GameService is undefined in handleFindMatch!');
        client.emit('matchmaking-error', { message: 'Service unavailable' });
        return;
      }

      this.gameService.addToQueue(playerId, mode, client.id);
      client.emit('matchmaking-started', { mode });

      // Try to find match immediately
      const opponent = this.gameService.findMatch(playerId, mode);
      if (opponent) {
        // Create room and notify both players
        const roomId = await this.gameService.createRoom(playerId, mode);
        await this.gameService.joinRoom(roomId, playerId);
        await this.gameService.joinRoom(roomId, opponent.playerId);
        
        this.gameService.setPlayerRoom(client.id, roomId);
        this.gameService.setPlayerRoom(opponent.socketId, roomId);
        this.gameService.setPlayerSocket(playerId, client.id);
        this.gameService.setPlayerSocket(opponent.playerId, opponent.socketId);
        
        client.join(roomId);
        this.server.sockets.sockets.get(opponent.socketId)?.join(roomId);
        
        const gameState = this.gameService.getGameState(roomId);
        
        // Assign players: creator is X, opponent is O
        this.server.to(client.id).emit('match-found', { 
          roomId, 
          opponent: opponent.playerId, 
          gameState,
          player: 'X', // Creator is X
        });
        this.server.to(opponent.socketId).emit('match-found', { 
          roomId, 
          opponent: playerId, 
          gameState,
          player: 'O', // Opponent is O
        });
      }
    } catch (error) {
      console.error('Error in handleFindMatch:', error);
      client.emit('matchmaking-error', { message: 'Failed to find match' });
    }
  }

  /**
   * Handle cancel matchmaking
   * @param client - Socket client
   * @param data - Cancel data
   */
  @SubscribeMessage('cancel-matchmaking')
  handleCancelMatchmaking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { playerId: string; mode: string }
  ) {
    try {
      if (this.gameService) {
        this.gameService.removeFromQueue(data.playerId, data.mode);
        client.emit('matchmaking-cancelled');
      }
    } catch (error) {
      console.error('Error in handleCancelMatchmaking:', error);
    }
  }
}

