/**
 * Toast Component
 * Displays temporary notifications at the bottom of the screen
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide: () => void;
}

/**
 * Toast notification component
 * @param visible - Whether toast is visible
 * @param message - Toast message
 * @param type - Toast type (success, error, warning, info)
 * @param duration - Auto-hide duration in ms (default 3000)
 * @param onHide - Callback when toast is hidden
 */
export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    translateY.value = withTiming(100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onHide)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#18181b', border: '#00ff88', icon: '#00ff88' };
      case 'error':
        return { bg: '#18181b', border: '#ff4444', icon: '#ff4444' };
      case 'warning':
        return { bg: '#18181b', border: '#ff8a00', icon: '#ff8a00' };
      default:
        return { bg: '#18181b', border: '#00f3ff', icon: '#00f3ff' };
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const colors = getColors();

  if (!visible && opacity.value === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.toast, { borderColor: colors.border, backgroundColor: colors.bg }]}>
        <Ionicons name={getIcon()} size={20} color={colors.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Pressable onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.icon} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});


