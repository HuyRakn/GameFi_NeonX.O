/**
 * Game Mode Card Component
 * Beautiful card for game mode selection
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeonCard } from './NeonCard';
import { GameMode } from '../types/game';

interface GameModeCardProps {
  mode: GameMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
  isOffline?: boolean;
  entryFee?: string;
  reward?: string;
}

export function GameModeCard({
  mode,
  title,
  subtitle,
  icon,
  variant = 'primary',
  onPress,
  isOffline = false,
  entryFee,
  reward,
}: GameModeCardProps) {
  return (
    <NeonCard variant={variant} glow onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { borderColor: getVariantColor(variant) }]}>
            <Ionicons name={icon} size={28} color={getVariantColor(variant)} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: getVariantColor(variant) }]}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {isOffline && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>OFFLINE</Text>
            </View>
          )}
        </View>

        {(entryFee || reward) && (
          <View style={styles.footer}>
            {entryFee && (
              <View style={styles.feeContainer}>
                <Text style={styles.feeLabel}>Entry</Text>
                <Text style={[styles.feeValue, { color: getVariantColor(variant) }]}>
                  {entryFee}
                </Text>
              </View>
            )}
            {reward && (
              <View style={styles.feeContainer}>
                <Text style={styles.feeLabel}>Reward</Text>
                <Text style={[styles.feeValue, { color: getVariantColor(variant) }]}>
                  {reward}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </NeonCard>
  );
}

function getVariantColor(variant: 'primary' | 'secondary' | 'danger'): string {
  switch (variant) {
    case 'primary':
      return '#00f3ff';
    case 'secondary':
      return '#ff00ff';
    case 'danger':
      return '#ff8a00';
    default:
      return '#00f3ff';
  }
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    letterSpacing: 0.3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  feeContainer: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 11,
    color: '#71717a',
    fontFamily: 'monospace',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});

