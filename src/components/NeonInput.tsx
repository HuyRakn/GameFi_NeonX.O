/**
 * Neon Input Component
 * Modern input field with Neon Noir theme
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface NeonInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  variant?: 'primary' | 'secondary';
}

export function NeonInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = 'none',
  variant = 'primary',
}: NeonInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderOpacity = useSharedValue(0.5);

  React.useEffect(() => {
    if (isFocused || value) {
      borderOpacity.value = withTiming(1, { duration: 200 });
    } else {
      borderOpacity.value = withTiming(0.5, { duration: 200 });
    }
  }, [isFocused, value]);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const borderColor = variant === 'primary' ? '#00f3ff' : '#ff00ff';

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.labelStatic,
            {
              color: isFocused || value ? borderColor : '#727272',
            },
          ]}
        >
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          borderAnimatedStyle,
          {
            borderColor,
            shadowColor: isFocused ? borderColor : 'transparent',
            shadowOpacity: isFocused ? 0.3 : 0,
            shadowRadius: isFocused ? 8 : 0,
          },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#525252"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelStatic: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 12, // Increased spacing from input
    textAlign: 'left', // Left align
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#18181b',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
});

