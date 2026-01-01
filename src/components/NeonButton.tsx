/**
 * Neon Button Component
 * Styled button with Neon Noir theme
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: NeonButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#27272a',
          borderColor: '#00f3ff',
          textColor: '#00f3ff',
        };
      case 'secondary':
        return {
          backgroundColor: '#27272a',
          borderColor: '#ff00ff',
          textColor: '#ff00ff',
        };
      case 'danger':
        return {
          backgroundColor: '#27272a',
          borderColor: '#ff8a00',
          textColor: '#ff8a00',
        };
      default:
        return {
          backgroundColor: '#27272a',
          borderColor: '#00f3ff',
          textColor: '#00f3ff',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AnimatedPressable
      style={[
        styles.button,
        animatedStyle,
        {
          borderColor: variantStyles.borderColor,
          backgroundColor: variantStyles.backgroundColor,
          opacity: disabled || loading ? 0.5 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            {
              color: variantStyles.textColor,
              textShadowColor: variantStyles.textColor,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});


