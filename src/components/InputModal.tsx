/**
 * Input Modal
 * Clean input modal for player ID and room ID
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NeonModal } from './NeonModal';
import { NeonInput } from './NeonInput';
import { NeonButton } from './NeonButton';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  submitText?: string;
  variant?: 'primary' | 'secondary';
}

export function InputModal({
  visible,
  onClose,
  title,
  label,
  placeholder,
  value,
  onChangeText,
  onSubmit,
  submitText = 'Submit',
  variant = 'primary',
}: InputModalProps) {
  return (
    <NeonModal visible={visible} onClose={onClose} title={title} variant={variant}>
      <View style={styles.container}>
        <NeonInput
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          variant={variant}
        />
        <NeonButton
          title={submitText}
          onPress={onSubmit}
          variant={variant}
          fullWidth
        />
      </View>
    </NeonModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});


