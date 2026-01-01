/**
 * Neon Modal Component
 * Professional modal with smooth fade + scale animations, centered on screen
 */

import React, { useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NeonModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function NeonModal({
  visible,
  onClose,
  title,
  children,
  variant = 'primary',
}: NeonModalProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.back(1.2)),
      });
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    } else {
      scale.value = withTiming(0.9, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
      backdropOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const borderColor =
    variant === 'primary'
      ? '#00f3ff'
      : variant === 'secondary'
      ? '#ff00ff'
      : '#ff8a00';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Animated.View
            style={[
              styles.modalContainer,
              modalAnimatedStyle,
              { borderColor },
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={() => {}}
          >
            {title && (
              <View style={styles.header}>
                <Animated.Text
                  style={[
                    styles.title,
                    { color: borderColor },
                  ]}
                >
                  {title}
                </Animated.Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={borderColor} />
                </Pressable>
              </View>
            )}
            <View style={styles.content} pointerEvents="box-none">
              {children}
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#18181b',
    borderRadius: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
});

