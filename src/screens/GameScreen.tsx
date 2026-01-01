/**
 * Game Screen
 * Redesigned gameplay screen with modern UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GameBoard } from '../components/GameBoard';
import { NeonCard } from '../components/NeonCard';
import { StatusIndicator } from '../components/StatusIndicator';
import { GameOverModal } from '../components/GameOverModal';
import { NeonModal } from '../components/NeonModal';
import { NeonButton } from '../components/NeonButton';
import { TicTacToeEngine } from '../engines/TicTacToeEngine';
import { BotAI } from '../engines/BotAI';
import { GameMode, Player, GameConfig, GameState } from '../types/game';

interface GameScreenProps {
  mode: GameMode;
  onBack: () => void;
}

export function GameScreen({ mode, onBack }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [engine, setEngine] = useState<TicTacToeEngine | null>(null);
  const [botAI, setBotAI] = useState<BotAI | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: Player | null; isDraw: boolean } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const headerOpacity = useSharedValue(1);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  /**
   * Get game configuration based on mode
   */
  const getGameConfig = (mode: GameMode): GameConfig => {
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
      default:
        return {
          mode: 'TRAINING',
          boardSize: 3,
          infiniteMode: true,
          winCondition: 3,
        };
    }
  };

  /**
   * Initialize game
   */
  const initializeGame = useCallback(() => {
    const config = getGameConfig(mode);
    const newEngine = new TicTacToeEngine(config);
    setEngine(newEngine);
    setGameState(newEngine.getState());

    if (mode === 'BOT_BATTLE') {
      const bot = new BotAI(newEngine, 'O');
      setBotAI(bot);
    } else {
      setBotAI(null);
    }
  }, [mode]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  /**
   * Handle cell press
   */
  const handleCellPress = useCallback(
    async (row: number, col: number) => {
      if (!engine || !gameState || isBotThinking) return;

      const currentPlayer = gameState.currentPlayer;
      const success = engine.makeMove(row, col, currentPlayer);

      if (!success) {
        return;
      }

      const newState = engine.getState();
      setGameState(newState);

      // Check for game end
      if (newState.status === 'FINISHED' || newState.status === 'DRAW') {
        setGameResult({
          winner: newState.winner,
          isDraw: newState.status === 'DRAW',
        });
        setShowGameOver(true);
        return;
      }

      // Bot move (for BOT_BATTLE mode)
      if (mode === 'BOT_BATTLE' && botAI && newState.currentPlayer === 'O') {
        setIsBotThinking(true);

        requestAnimationFrame(() => {
          if (!engine || !botAI) {
            setIsBotThinking(false);
            return;
          }

          try {
            const botMove = botAI.getBestMoveSync('hard');
            
            if (botMove.row >= 0 && botMove.col >= 0) {
              const moveSuccess = engine.makeMove(botMove.row, botMove.col, 'O');
              
              if (moveSuccess) {
                const updatedState = engine.getState();
                setGameState(updatedState);
                setIsBotThinking(false);

                if (updatedState.status === 'FINISHED' || updatedState.status === 'DRAW') {
                  setTimeout(() => {
                    setGameResult({
                      winner: updatedState.winner,
                      isDraw: updatedState.status === 'DRAW',
                    });
                    setShowGameOver(true);
                  }, 100);
                }
              } else {
                setIsBotThinking(false);
              }
            } else {
              setIsBotThinking(false);
            }
          } catch (error) {
            console.error('[Bot] Error:', error);
            setIsBotThinking(false);
          }
        });
      }
    },
    [engine, gameState, botAI, mode, initializeGame, onBack, isBotThinking]
  );

  /**
   * Handle undo
   */
  const handleUndo = useCallback(() => {
    if (!engine || !gameState) return;
    const success = engine.undo();
    if (success) {
      setGameState(engine.getState());
    }
  }, [engine, gameState]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    if (!engine) return;
    engine.reset();
    setGameState(engine.getState());
  }, [engine]);

  if (!gameState) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00f3ff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mode === 'TRAINING' ? 'Training' : 'Bot Battle'}
          </Text>
          <View style={styles.headerSubtitle}>
            <Text style={styles.headerSubtitleText}>
              {mode === 'TRAINING' ? '3x3 Infinite' : '6x6 Arena'}
            </Text>
            <StatusIndicator status="connected" />
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setShowInfoModal(true)} 
          style={styles.backButton}
        >
          <Ionicons name="information-circle-outline" size={24} color="#00f3ff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Game Board */}
      <View style={styles.gameContainer}>
        <GameBoard
          gameState={gameState}
          onCellPress={handleCellPress}
          onReset={handleReset}
          onUndo={handleUndo}
          disabled={isBotThinking}
          showControls={true}
        />
      </View>

      {/* Bot Thinking Indicator */}
      {isBotThinking && (
        <NeonCard variant="secondary" style={styles.botThinkingCard}>
          <View style={styles.botThinkingContent}>
            <StatusIndicator status="searching" />
            <Text style={styles.botThinkingText}>Bot is thinking...</Text>
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
            initializeGame();
          }}
          onBack={() => {
            setShowGameOver(false);
            setGameResult(null);
            onBack();
          }}
          variant={mode === 'BOT_BATTLE' ? 'secondary' : 'primary'}
        />
      )}

      {/* Game Info Modal */}
      <NeonModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Game Info"
        variant={mode === 'BOT_BATTLE' ? 'secondary' : 'primary'}
      >
        <View style={styles.infoContent}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Mode</Text>
            <Text style={styles.infoValue}>
              {mode === 'TRAINING' ? 'Training' : 'Bot Battle'}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Board Size</Text>
            <Text style={styles.infoValue}>
              {mode === 'TRAINING' ? '3x3' : '6x6'}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Rules</Text>
            <Text style={styles.infoText}>
              {mode === 'TRAINING' 
                ? 'Classic Tic-Tac-Toe: Get 3 in a row to win!'
                : 'Extended Tic-Tac-Toe: Get 5 in a row to win on a 6x6 board!'}
            </Text>
          </View>
          <View style={styles.infoButtons}>
            <NeonButton
              title="Reset Game"
              onPress={() => {
                setShowInfoModal(false);
                handleReset();
              }}
              variant={mode === 'BOT_BATTLE' ? 'secondary' : 'primary'}
              fullWidth
            />
            <NeonButton
              title="Close"
              onPress={() => setShowInfoModal(false)}
              variant="secondary"
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
  gameContainer: {
    flex: 1,
  },
  botThinkingCard: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  botThinkingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botThinkingText: {
    color: '#ff00ff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
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
