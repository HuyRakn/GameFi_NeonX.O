/**
 * Multiplayer Game Screen
 * Redesigned real-time PVP gameplay with modern UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { GameBoard } from '../components/GameBoard';
import { NeonCard } from '../components/NeonCard';
import { StatusIndicator } from '../components/StatusIndicator';
import { GameOverModal } from '../components/GameOverModal';
import { NeonModal } from '../components/NeonModal';
import { NeonButton } from '../components/NeonButton';
import { useSocket } from '../hooks/useSocket';
import { useGameTransactions } from '../hooks/useGameTransactions';
import { useWallet } from '../contexts/WalletContext';
import { GameState, Player, GameMode } from '../types/game';

interface MultiplayerGameScreenProps {
  mode: GameMode;
  roomId?: string;
  onBack: () => void;
}

export function MultiplayerGameScreen({
  mode,
  roomId: initialRoomId,
  onBack,
}: MultiplayerGameScreenProps) {
  const { socket, connected, joinRoom, createRoom, findMatch, cancelMatchmaking, makeMove } = useSocket();
  const { payEntryFee, isProcessing: isPaymentProcessing } = useGameTransactions();
  const { connected: walletConnected, publicKey: walletPublicKey } = useWallet();
  
  const playerId = walletPublicKey?.toBase58() || '';
  
  if (!walletConnected || !walletPublicKey) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00f3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Required</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <NeonCard variant="primary">
            <View style={styles.walletRequiredContent}>
              <Ionicons name="wallet-outline" size={64} color="#00f3ff" />
              <Text style={styles.walletRequiredText}>Wallet Not Connected</Text>
              <Text style={styles.walletRequiredSubtext}>
                Please connect your wallet to play Competitive modes
              </Text>
            </View>
          </NeonCard>
        </View>
      </View>
    );
  }
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: Player | null; isDraw: boolean } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingMatch, setPendingMatch] = useState<{ roomId: string; opponent: string; gameState?: GameState; player?: Player } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isMatchmaking || isWaiting) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isMatchmaking, isWaiting]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.05]);
    const opacity = interpolate(pulse.value, [0, 1], [0.7, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  /**
   * Initialize socket listeners
   */
  useEffect(() => {
    if (!socket) return;

    socket.on('room-created', (data: { roomId: string }) => {
      setRoomId(data.roomId);
      setIsWaiting(true);
    });

    socket.on('room-joined', (data: { roomId: string; gameState?: GameState; player?: Player }) => {
      setRoomId(data.roomId);
      if (data.gameState) {
        setGameState(data.gameState);
      }
      if (data.player) {
        setMyPlayer(data.player);
      }
    });

    socket.on('game-started', (data: { gameState: GameState; player?: Player }) => {
      setGameState(data.gameState);
      setIsWaiting(false);
      setIsMatchmaking(false);
      if (data.player) {
        setMyPlayer(data.player);
      }
    });

    socket.on('match-found', async (data: { roomId: string; opponent: string; gameState?: GameState; player?: Player }) => {
      setIsMatchmaking(false);
      
      // Check if this mode requires entry fee
      const requiresPayment = mode === 'RANKED_IRON' || mode === 'RANKED_NEON' || mode === 'WHALE_WARS';
      
      if (requiresPayment && walletConnected && walletPublicKey) {
        // Store match data temporarily
        setPendingMatch(data);
        setPaymentStatus('processing');
        setPaymentError(null);
        
        // Request payment
        try {
          const result = await payEntryFee(mode);
          
          if (result.success && result.signature) {
            setPaymentStatus('success');
            
            // Notify backend that payment is complete
            socket.emit('payment-confirmed', {
              roomId: data.roomId,
              playerId: playerId,
              signature: result.signature,
            });
            
            // Proceed with match
            setRoomId(data.roomId);
            setOpponentId(data.opponent);
            setIsWaiting(false);
            if (data.gameState) {
              setGameState(data.gameState);
            }
            if (data.player) {
              setMyPlayer(data.player);
            }
            setPendingMatch(null);
          } else {
            setPaymentStatus('failed');
            setPaymentError(result.error || 'Payment failed');
            // Cancel matchmaking on payment failure
            cancelMatchmaking(playerId, mode);
          }
        } catch (error: any) {
          setPaymentStatus('failed');
          setPaymentError(error.message || 'Payment error');
          cancelMatchmaking(playerId, mode);
        }
      } else if (!requiresPayment) {
        // No payment required, proceed directly
        setRoomId(data.roomId);
        setOpponentId(data.opponent);
        setIsWaiting(false);
        if (data.gameState) {
          setGameState(data.gameState);
        }
        if (data.player) {
          setMyPlayer(data.player);
        }
      } else {
        // Payment required but wallet not connected
        setPaymentStatus('failed');
        setPaymentError('Wallet not connected. Please connect your wallet first.');
        cancelMatchmaking(playerId, mode);
      }
    });

    socket.on('matchmaking-started', () => {
      setIsMatchmaking(true);
    });

    socket.on('matchmaking-cancelled', () => {
      setIsMatchmaking(false);
    });

    socket.on('move-made', (data: { row: number; col: number; player: string; gameState: GameState }) => {
      setGameState(data.gameState);
    });

    socket.on('game-finished', (data: { winner: Player | null; gameState: GameState }) => {
      setGameState(data.gameState);
      setGameResult({
        winner: data.winner,
        isDraw: data.winner === null,
      });
      setShowGameOver(true);
    });

    socket.on('move-error', (data: { message: string }) => {
      // Handle error silently or show toast
    });

    socket.on('room-error', (data: { message: string }) => {
      console.error('[Multiplayer] Room error:', data.message);
    });

    socket.on('opponent-disconnected', (data: { roomId: string; refundSignature?: string }) => {
      console.log('[Multiplayer] Opponent disconnected, refunding...');
      if (data.refundSignature) {
        setPaymentError(null);
        setPaymentStatus('idle');
      }
      onBack();
    });

    socket.on('payment-required', (data: { roomId: string }) => {
      setIsWaiting(true);
    });

    socket.on('payment-success', (data: { roomId: string }) => {
      setPaymentStatus('success');
      setPaymentError(null);
    });

    socket.on('payment-error', (data: { message: string }) => {
      setPaymentStatus('failed');
      setPaymentError(data.message);
    });

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('game-started');
      socket.off('match-found');
      socket.off('matchmaking-started');
      socket.off('matchmaking-cancelled');
      socket.off('move-made');
      socket.off('game-finished');
      socket.off('move-error');
      socket.off('room-error');
      socket.off('opponent-disconnected');
      socket.off('payment-required');
      socket.off('payment-success');
      socket.off('payment-error');
    };
  }, [socket, playerId, joinRoom, payEntryFee, mode, walletConnected, walletPublicKey, cancelMatchmaking, onBack]);

  /**
   * Start matchmaking for ranked modes
   */
  const handleFindMatch = useCallback(() => {
    if (!connected) return;
    if (mode === 'TRAINING' || mode === 'BOT_BATTLE') return;
    findMatch(playerId, mode);
  }, [connected, mode, playerId, findMatch]);

  /**
   * Create room for training mode
   */
  const handleCreateRoom = useCallback(() => {
    if (!connected) return;
    createRoom(playerId, mode);
  }, [connected, mode, playerId, createRoom]);

  /**
   * Join existing room
   */
  const handleJoinRoom = useCallback((roomIdToJoin: string) => {
    if (!connected) return;
    joinRoom(roomIdToJoin, playerId);
  }, [connected, playerId, joinRoom]);

  /**
   * Handle cell press
   */
  const handleCellPress = useCallback((row: number, col: number) => {
    if (!roomId || !gameState) return;
    if (gameState.status !== 'ACTIVE') return;
    if (gameState.currentPlayer !== myPlayer) return;
    makeMove(roomId, row, col, myPlayer!);
  }, [roomId, gameState, myPlayer, makeMove]);

  /**
   * Initialize based on mode
   */
  useEffect(() => {
    if (!connected) return;

    if (initialRoomId) {
      // Joining existing room - player will be assigned by backend (O)
      handleJoinRoom(initialRoomId);
    } else if (mode === 'TRAINING') {
      // Creating room - will be X (first player)
      handleCreateRoom();
      setMyPlayer('X'); // Creator is always X
    } else if (mode.startsWith('RANKED') || mode === 'WHALE_WARS') {
      // Matchmaking - player will be assigned by backend
      handleFindMatch();
    }
  }, [connected, initialRoomId, mode, handleJoinRoom, handleCreateRoom, handleFindMatch]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00f3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connecting...</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Connecting to server...</Text>
        </View>
      </View>
    );
  }

  if (isMatchmaking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              cancelMatchmaking(playerId, mode);
              onBack();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#00f3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finding Match</Text>
          <TouchableOpacity 
            onPress={() => setShowInfoModal(true)} 
            style={styles.backButton}
          >
            <Ionicons name="information-circle-outline" size={24} color="#00f3ff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.matchmakingCard, pulseStyle]}>
            <NeonCard variant="secondary">
              <View style={styles.matchmakingContent}>
                <StatusIndicator status="searching" label="Searching" />
                <Text style={styles.matchmakingText}>Searching for opponent...</Text>
                <Text style={styles.matchmakingSubtext}>
                  {mode === 'RANKED_IRON' && 'Ranked Iron • 3x3 Infinite'}
                  {mode === 'RANKED_NEON' && 'Ranked Neon • 6x6 Arena'}
                  {mode === 'WHALE_WARS' && 'Whale Wars • 8x8 Gomoku'}
                </Text>
              </View>
            </NeonCard>
          </Animated.View>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              cancelMatchmaking(playerId, mode);
              onBack();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (paymentStatus === 'processing' || isWaiting || !gameState) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00f3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {paymentStatus === 'processing' ? 'Processing Payment' : 'Waiting'}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowInfoModal(true)} 
            style={styles.backButton}
          >
            <Ionicons name="information-circle-outline" size={24} color="#00f3ff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          {paymentStatus === 'processing' ? (
            <Animated.View style={[styles.waitingCard, pulseStyle]}>
              <NeonCard variant="primary">
                <View style={styles.waitingContent}>
                  <ActivityIndicator size="large" color="#00f3ff" />
                  <Text style={styles.waitingText}>Processing payment...</Text>
                  <Text style={styles.waitingSubtext}>Please approve the transaction in your wallet</Text>
                </View>
              </NeonCard>
            </Animated.View>
          ) : (
            <Animated.View style={[styles.waitingCard, pulseStyle]}>
              <NeonCard variant="primary">
                <View style={styles.waitingContent}>
                  <StatusIndicator status="waiting" label="Waiting" />
                  <Text style={styles.waitingText}>Waiting for opponent...</Text>
                  {roomId && (
                    <Text style={styles.roomIdText}>Room: {roomId}</Text>
                  )}
                </View>
              </NeonCard>
            </Animated.View>
          )}
          {paymentError && (
            <NeonCard variant="danger" style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={24} color="#ff8a00" />
                <Text style={styles.errorText}>{paymentError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setPaymentError(null);
                    setPaymentStatus('idle');
                    onBack();
                  }}
                >
                  <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </NeonCard>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00f3ff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mode === 'RANKED_IRON' ? 'Ranked Iron' :
             mode === 'RANKED_NEON' ? 'Ranked Neon' :
             mode === 'WHALE_WARS' ? 'Whale Wars' : 'Multiplayer'}
          </Text>
          <View style={styles.headerSubtitle}>
            <StatusIndicator status="connected" />
            {opponentId && (
              <Text style={styles.headerSubtitleText}>vs {opponentId.slice(0, 8)}...</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setShowInfoModal(true)} 
          style={styles.backButton}
        >
          <Ionicons name="information-circle-outline" size={24} color="#00f3ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.gameContainer}>
        <GameBoard
          gameState={gameState}
          onCellPress={handleCellPress}
          onReset={() => {}}
          disabled={gameState.status !== 'ACTIVE' || gameState.currentPlayer !== myPlayer}
          showControls={false}
        />
      </View>

      {/* Player Indicator */}
      {myPlayer && (
        <NeonCard variant={myPlayer === 'X' ? 'primary' : 'secondary'} style={styles.playerIndicator}>
          <View style={styles.playerIndicatorContent}>
            <Text style={styles.playerIndicatorLabel}>You are</Text>
            <Text style={[
              styles.playerIndicatorValue,
              { color: myPlayer === 'X' ? '#00f3ff' : '#ff00ff' }
            ]}>
              {myPlayer}
            </Text>
          </View>
        </NeonCard>
      )}

      {/* Game Over Modal */}
      {gameResult && (
        <GameOverModal
          visible={showGameOver}
          winner={gameResult.winner}
          isDraw={gameResult.isDraw}
          onNewGame={() => {
            setShowGameOver(false);
            setGameResult(null);
            setGameState(null);
            setRoomId(null);
            setOpponentId(null);
            setIsWaiting(false);
            setIsMatchmaking(false);
            setMyPlayer(null);
            // Re-initialize based on mode
            if (initialRoomId) {
              handleJoinRoom(initialRoomId);
            } else if (mode === 'TRAINING') {
              handleCreateRoom();
            } else if (mode.startsWith('RANKED') || mode === 'WHALE_WARS') {
              handleFindMatch();
            }
          }}
          onBack={() => {
            setShowGameOver(false);
            setGameResult(null);
            onBack();
          }}
          variant={mode === 'WHALE_WARS' ? 'danger' : mode === 'RANKED_NEON' ? 'secondary' : 'primary'}
        />
      )}

      {/* Game Info Modal */}
      <NeonModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Game Info"
        variant={mode === 'WHALE_WARS' ? 'danger' : mode === 'RANKED_NEON' ? 'secondary' : 'primary'}
      >
        <View style={styles.infoContent}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Mode</Text>
            <Text style={styles.infoValue}>
              {mode === 'RANKED_IRON' ? 'Ranked Iron' :
               mode === 'RANKED_NEON' ? 'Ranked Neon' :
               mode === 'WHALE_WARS' ? 'Whale Wars' : 'Multiplayer'}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Board Size</Text>
            <Text style={styles.infoValue}>
              {mode === 'RANKED_IRON' ? '3x3' :
               mode === 'RANKED_NEON' ? '6x6' :
               mode === 'WHALE_WARS' ? '8x8' : '3x3'}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Rules</Text>
            <Text style={styles.infoText}>
              {mode === 'RANKED_IRON' 
                ? 'Classic Tic-Tac-Toe: Get 3 in a row to win!'
                : mode === 'RANKED_NEON'
                ? 'Extended Tic-Tac-Toe: Get 5 in a row to win on a 6x6 board!'
                : mode === 'WHALE_WARS'
                ? 'Gomoku: Get 5 in a row to win on an 8x8 board!'
                : 'Classic Tic-Tac-Toe: Get 3 in a row to win!'}
            </Text>
          </View>
          {opponentId && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Opponent</Text>
              <Text style={styles.infoText}>
                {opponentId.slice(0, 8)}...{opponentId.slice(-8)}
              </Text>
            </View>
          )}
          {roomId && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Room ID</Text>
              <Text style={styles.infoText}>{roomId}</Text>
            </View>
          )}
          <View style={styles.infoButtons}>
            <NeonButton
              title="Close"
              onPress={() => setShowInfoModal(false)}
              variant={mode === 'WHALE_WARS' ? 'danger' : mode === 'RANKED_NEON' ? 'secondary' : 'primary'}
              fullWidth
            />
          </View>
        </View>
      </NeonModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#09090b',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#18181b',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitleText: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  loadingText: {
    color: '#71717a',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  matchmakingCard: {
    width: '100%',
  },
  matchmakingContent: {
    alignItems: 'center',
    gap: 12,
  },
  matchmakingText: {
    color: '#ff00ff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  matchmakingSubtext: {
    color: '#a1a1aa',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  waitingCard: {
    width: '100%',
  },
  waitingContent: {
    alignItems: 'center',
    gap: 12,
  },
  waitingText: {
    color: '#00f3ff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  roomIdText: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  waitingSubtext: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  errorCard: {
    marginTop: 16,
    width: '100%',
  },
  errorContent: {
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#ff8a00',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ff8a00',
  },
  retryButtonText: {
    color: '#ff8a00',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ff00ff',
  },
  cancelButtonText: {
    color: '#ff00ff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  gameContainer: {
    flex: 1,
  },
  playerIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  playerIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playerIndicatorLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    fontFamily: 'monospace',
  },
  playerIndicatorValue: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  walletRequiredContent: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  walletRequiredText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00f3ff',
    fontFamily: 'monospace',
  },
  walletRequiredSubtext: {
    fontSize: 14,
    color: '#71717a',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  infoContent: {
    gap: 24,
    paddingVertical: 10,
  },
  infoSection: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'monospace',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  infoButtons: {
    marginTop: 8,
    gap: 12,
  },
});
