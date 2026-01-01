/**
 * Neon Card Component
 * Modern card with Neon Noir theme and smooth animations
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface NeonCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  glow?: boolean;
  style?: any;
}

export function NeonCard({
  children,
  onPress,
  variant = 'default',
  glow = false,
  style,
}: NeonCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          border: '#00f3ff',
          glow: 'rgba(0, 243, 255, 0.2)',
          gradient: ['rgba(0, 243, 255, 0.05)', 'rgba(0, 243, 255, 0.02)'],
        };
      case 'secondary':
        return {
          border: '#ff00ff',
          glow: 'rgba(255, 0, 255, 0.2)',
          gradient: ['rgba(255, 0, 255, 0.05)', 'rgba(255, 0, 255, 0.02)'],
        };
      case 'danger':
        return {
          border: '#ff8a00',
          glow: 'rgba(255, 138, 0, 0.2)',
          gradient: ['rgba(255, 138, 0, 0.05)', 'rgba(255, 138, 0, 0.02)'],
        };
      default:
        return {
          border: '#27272a',
          glow: 'rgba(39, 39, 42, 0.2)',
          gradient: ['rgba(39, 39, 42, 0.1)', 'rgba(39, 39, 42, 0.05)'],
        };
    }
  };

  const colors = getVariantColors();
  const Component = onPress ? AnimatedPressable : Animated.View;

  return (
    <Component
      style={[styles.container, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <AnimatedLinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            borderColor: colors.border,
            shadowColor: glow ? colors.border : 'transparent',
            shadowOpacity: glow ? 0.4 : 0,
            shadowRadius: glow ? 12 : 0,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {children}
      </AnimatedLinearGradient>
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    backgroundColor: '#18181b',
  },
});

