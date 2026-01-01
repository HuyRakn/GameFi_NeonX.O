/**
 * Game Board Component
 * Redesigned with smooth animations and modern UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { NeonGrid } from './NeonGrid';
import { NeonButton } from './NeonButton';
import { GameState, Player } from '../types/game';

interface GameBoardProps {
  gameState: GameState;
  onCellPress: (row: number, col: number) => void;
  onReset: () => void;
  onUndo?: () => void;
  disabled?: boolean;
  showControls?: boolean;
}

export function GameBoard({
  gameState,
  onCellPress,
  onReset,
  onUndo,
  disabled = false,
  showControls = true,
}: GameBoardProps) {
  const statusScale = useSharedValue(1);
  const statusOpacity = useSharedValue(1);

  React.useEffect(() => {
    statusScale.value = withSpring(1.05, { damping: 10, stiffness: 300 });
    statusOpacity.value = withTiming(1, { duration: 200 });
    
    setTimeout(() => {
      statusScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }, 200);
  }, [gameState.status, gameState.currentPlayer]);

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusScale.value }],
    opacity: statusOpacity.value,
  }));

  /**
   * Get status message
   */
  const getStatusMessage = (): string => {
    if (gameState.status === 'FINISHED' && gameState.winner) {
      return `${gameState.winner} Wins!`;
    }
    if (gameState.status === 'DRAW') {
      return "It's a Draw!";
    }
    return `${gameState.currentPlayer}'s Turn`;
  };

  /**
   * Get status color
   */
  const getStatusColor = (): string => {
    if (gameState.status === 'FINISHED' && gameState.winner) {
      return gameState.winner === 'X' ? '#00f3ff' : '#ff00ff';
    }
    if (gameState.status === 'DRAW') {
      return '#ff8a00';
    }
    return gameState.currentPlayer === 'X' ? '#00f3ff' : '#ff00ff';
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      {/* Animated Status Bar */}
      <Animated.View
        style={[
          styles.statusBar,
          statusAnimatedStyle,
          {
            borderColor: statusColor,
            shadowColor: statusColor,
            shadowOpacity: gameState.status === 'FINISHED' ? 0.4 : 0.2,
            shadowRadius: 12,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color: statusColor,
              textShadowColor: statusColor,
            },
          ]}
        >
          {getStatusMessage()}
        </Text>
        {gameState.status === 'ACTIVE' && (
          <View style={styles.turnIndicator}>
            <View
              style={[
                styles.turnDot,
                { backgroundColor: statusColor },
              ]}
            />
          </View>
        )}
      </Animated.View>

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <NeonGrid
          board={gameState.board}
          onCellPress={onCellPress}
          winningLine={gameState.winningLine}
          disabled={disabled || gameState.status !== 'ACTIVE'}
        />
      </View>

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {onUndo && gameState.moveHistory.length > 0 && (
            <NeonButton
              title="Undo"
              onPress={onUndo}
              variant="secondary"
              disabled={disabled || gameState.status !== 'ACTIVE'}
              fullWidth
            />
          )}
          <NeonButton
            title="New Game"
            onPress={onReset}
            variant="primary"
            disabled={disabled}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  statusBar: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#18181b',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'monospace',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    letterSpacing: 1,
  },
  turnIndicator: {
    marginTop: 8,
    alignItems: 'center',
  },
  turnDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  controls: {
    gap: 12,
    paddingTop: 24,
  },
});
