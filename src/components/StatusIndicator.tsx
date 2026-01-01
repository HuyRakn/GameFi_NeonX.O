/**
 * Status Indicator Component
 * Animated status indicator with pulse effect
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface StatusIndicatorProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'searching' | 'waiting' | 'active';
  label?: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (status === 'connecting' || status === 'searching' || status === 'waiting') {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [status]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [1, 1.2]);
    const opacity = interpolate(pulse.value, [0, 1], [0.6, 1]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
      case 'active':
        return '#00f3ff';
      case 'connecting':
      case 'searching':
      case 'waiting':
        return '#ff00ff';
      case 'disconnected':
        return '#727272';
      default:
        return '#727272';
    }
  };

  const color = getStatusColor();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          pulseStyle,
          {
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.4,
            shadowRadius: 8,
          },
        ]}
      />
      {label && (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

