/**
 * Neon Grid Component
 * Renders game board with Neon Noir theme
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Player } from '../types/game';

interface NeonGridProps {
  board: Player[][];
  onCellPress: (row: number, col: number) => void;
  winningLine: [number, number][] | null;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NeonGrid({ board, onCellPress, winningLine, disabled = false }: NeonGridProps) {
  const boardSize = board.length;
  
  // Calculate font size based on board size to match O's scaling
  // O uses 75% of cellContent (which is 80% of cell), so effective size is 60% of cell
  // For X, we want similar visual size, so calculate fontSize to match O's diameter
  // Base calculation: fontSize should scale inversely with board size
  const getFontSize = () => {
    // Base size for 3x3 board - adjusted to match O's visual size
    const baseSize = 70;
    // Scale down for larger boards (inverse relationship)
    // Add slight adjustment factor to better match O's visual appearance
    const scaleFactor = 3 / boardSize;
    return Math.round(baseSize * scaleFactor);
  };
  
  const xFontSize = getFontSize();

  /**
   * Check if cell is in winning line
   * @param row - Row index
   * @param col - Column index
   * @returns True if cell is in winning line
   */
  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  /**
   * Render cell content
   * @param player - Player occupying cell
   * @param row - Row index
   * @param col - Column index
   * @returns Cell content component
   */
  const renderCell = (player: Player, row: number, col: number) => {
    const isWinning = isWinningCell(row, col);
    const opacity = useSharedValue(0);

    React.useEffect(() => {
      if (player !== null) {
        // Smooth fade in (no bounce)
        opacity.value = withTiming(1, { duration: 150 });
      } else {
        opacity.value = withTiming(0, { duration: 100 });
      }
    }, [player]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const cellColor = player === 'X' ? '#00f3ff' : '#ff00ff';
    const glowColor = player === 'X' ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 0, 255, 0.3)';

    return (
      <Animated.View
        style={[
          styles.cellContent,
          animatedStyle,
          isWinning && {
            shadowColor: cellColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 15,
            elevation: 8,
          },
        ]}
      >
        {player && (
          <View
            style={[
              player === 'O' ? styles.pieceO : styles.pieceX,
              {
                backgroundColor: isWinning ? glowColor : 'transparent',
              },
            ]}
          >
            {player === 'O' ? (
              <View
                style={[
                  styles.circle,
                  {
                    borderColor: cellColor,
                    shadowColor: cellColor,
                  },
                ]}
              />
            ) : (
              <Animated.Text
                style={[
                  styles.pieceTextX,
                  {
                    fontSize: xFontSize,
                    lineHeight: xFontSize,
                    color: cellColor,
                    textShadowColor: cellColor,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  },
                ]}
              >
                X
              </Animated.Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {board.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <AnimatedPressable
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.cell,
                {
                  width: `${100 / boardSize}%`,
                  aspectRatio: 1,
                },
              ]}
              onPress={() => !disabled && onCellPress(rowIndex, colIndex)}
              disabled={disabled || cell !== null}
            >
              {renderCell(cell, rowIndex, colIndex)}
            </AnimatedPressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  cell: {
    borderWidth: 2,
    borderColor: '#27272a',
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  cellContent: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceX: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceO: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceTextX: {
    // fontSize and lineHeight are now dynamic based on boardSize
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: -2,
    textAlign: 'center',
    includeFontPadding: false, // Remove extra padding for better alignment
  },
  circle: {
    width: '75%',
    height: '75%',
    borderRadius: 999,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
});

