/**
 * Socket.io Hook
 * Manages Socket.io connection for multiplayer
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/getBackendUrl';
import { GameState } from '../types/game';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  joinRoom: (roomId: string, playerId: string) => void;
  createRoom: (playerId: string, mode: string) => void;
  findMatch: (playerId: string, mode: string) => void;
  cancelMatchmaking: (playerId: string, mode: string) => void;
  makeMove: (roomId: string, row: number, col: number, player: 'X' | 'O') => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    console.log('[Socket] Connecting to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first (more reliable on Android)
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity, // Keep trying
      timeout: 10000, // Increase timeout to 10s
      forceNew: false,
      upgrade: true, // Allow upgrade from polling to websocket
      rememberUpgrade: true,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] ✅ Connected to:', socketUrl);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      console.log('[Socket] Attempting to reconnect...');
      // Don't set connected to false on error, let reconnection handle it
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] ✅ Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('[Socket] Reconnection attempt...');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[Socket] ❌ Reconnection failed');
      setConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  /**
   * Join a game room
   * @param roomId - Room ID
   * @param playerId - Player wallet address
   */
  const joinRoom = useCallback((roomId: string, playerId: string) => {
    if (!socket) return;
    socket.emit('join-room', { roomId, playerId });
  }, [socket]);

  /**
   * Create a new game room
   * @param playerId - Player wallet address
   * @param mode - Game mode
   */
  const createRoom = useCallback((playerId: string, mode: string) => {
    if (!socket) return;
    socket.emit('create-room', { playerId, mode });
  }, [socket]);

  /**
   * Find match for ranked mode
   * @param playerId - Player wallet address
   * @param mode - Game mode
   */
  const findMatch = useCallback((playerId: string, mode: string) => {
    if (!socket) return;
    socket.emit('find-match', { playerId, mode });
  }, [socket]);

  /**
   * Cancel matchmaking
   * @param playerId - Player wallet address
   * @param mode - Game mode
   */
  const cancelMatchmaking = useCallback((playerId: string, mode: string) => {
    if (!socket) return;
    socket.emit('cancel-matchmaking', { playerId, mode });
  }, [socket]);

  /**
   * Make a move in the game
   * @param roomId - Room ID
   * @param row - Row index
   * @param col - Column index
   * @param player - Player making the move
   */
  const makeMove = useCallback((roomId: string, row: number, col: number, player: 'X' | 'O') => {
    if (!socket) return;
    socket.emit('make-move', { roomId, row, col, player });
  }, [socket]);

  return {
    socket,
    connected,
    joinRoom,
    createRoom,
    findMatch,
    cancelMatchmaking,
    makeMove,
  };
}

