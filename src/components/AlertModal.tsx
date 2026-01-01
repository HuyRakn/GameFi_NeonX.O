/**
 * Alert Modal Component
 * Custom alert modal to replace native Alert.alert with Neon styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeonModal } from './NeonModal';
import { NeonButton } from './NeonButton';

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  showIcon?: boolean;
}

/**
 * Alert Modal Component
 * @param visible - Whether the modal is visible
 * @param onClose - Callback when modal is closed
 * @param title - Alert title
 * @param message - Alert message
 * @param variant - Color variant (primary, secondary, danger, success)
 * @param showIcon - Whether to show icon
 */
export function AlertModal({
  visible,
  onClose,
  title,
  message,
  variant = 'primary',
  showIcon = true,
}: AlertModalProps) {
  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (variant) {
      case 'success':
        return 'checkmark-circle';
      case 'danger':
        return 'alert-circle';
      case 'secondary':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const borderColor =
    variant === 'primary'
      ? '#00f3ff'
      : variant === 'secondary'
      ? '#ff00ff'
      : variant === 'danger'
      ? '#ff8a00'
      : '#00ff88';

  return (
    <NeonModal visible={visible} onClose={onClose} title={title} variant={variant}>
      <View style={styles.container}>
        {showIcon && (
          <View style={[styles.iconContainer, { borderColor }]}>
            <Ionicons name={getIcon()} size={48} color={borderColor} />
          </View>
        )}
        <Text style={styles.message}>{message}</Text>
        <NeonButton
          title="OK"
          onPress={onClose}
          variant={variant}
          fullWidth
        />
      </View>
    </NeonModal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  message: {
    fontSize: 16,
    color: '#a1a1aa',
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 24,
  },
});

