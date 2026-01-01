/**
 * Game Over Modal Component
 * Beautiful Neon-themed game over dialog
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeonModal } from './NeonModal';
import { NeonButton } from './NeonButton';
import { Player } from '../types/game';

interface GameOverModalProps {
  visible: boolean;
  winner: Player | null;
  isDraw: boolean;
  onNewGame: () => void;
  onBack: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function GameOverModal({
  visible,
  winner,
  isDraw,
  onNewGame,
  onBack,
  variant = 'primary',
}: GameOverModalProps) {

  const getTitle = (): string => {
    if (isDraw) return "It's a Draw!";
    if (winner === 'X') return 'X Wins!';
    if (winner === 'O') return 'O Wins!';
    return 'Game Over';
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isDraw) return 'remove-circle';
    if (winner === 'X') return 'trophy';
    return 'trophy';
  };

  const getVariant = (): 'primary' | 'secondary' | 'danger' => {
    if (isDraw) return 'danger';
    if (winner === 'X') return 'primary';
    return 'secondary';
  };

  const finalVariant = variant !== 'primary' ? variant : getVariant();
  const borderColor =
    finalVariant === 'primary'
      ? '#00f3ff'
      : finalVariant === 'secondary'
      ? '#ff00ff'
      : '#ff8a00';

  return (
    <NeonModal visible={visible} onClose={onBack} variant={finalVariant}>
      <View style={styles.container}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { borderColor, shadowColor: borderColor },
          ]}
        >
          <Ionicons name={getIcon()} size={64} color={borderColor} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: borderColor }]}>{getTitle()}</Text>

        {/* Message */}
        {!isDraw && winner && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerLabel}>Winner</Text>
            <View
              style={[
                styles.winnerSymbol,
                {
                  borderColor,
                  backgroundColor: winner === 'X' ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 0, 255, 0.1)',
                },
              ]}
            >
              <Text style={[styles.winnerText, { color: borderColor }]}>
                {winner}
              </Text>
            </View>
          </View>
        )}

        {isDraw && (
          <View style={styles.drawContainer}>
            <Text style={styles.drawText}>No winner this time!</Text>
            <Text style={styles.drawSubtext}>Try again to claim victory</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <NeonButton
            title="New Game"
            onPress={onNewGame}
            variant={finalVariant}
            fullWidth
          />
          <NeonButton
            title="Back to Home"
            onPress={onBack}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </NeonModal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#18181b',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 24,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  winnerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  winnerLabel: {
    fontSize: 14,
    color: '#71717a',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  winnerSymbol: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  winnerText: {
    fontSize: 48,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: -2,
  },
  drawContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  drawText: {
    fontSize: 18,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  drawSubtext: {
    fontSize: 14,
    color: '#71717a',
    fontFamily: 'monospace',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
});

